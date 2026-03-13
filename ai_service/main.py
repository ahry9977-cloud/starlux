import base64
import hashlib
import json
import os
import pickle
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import psycopg2
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _db_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError("DATABASE_URL is required")
    return url


def _secret() -> str:
    return os.getenv("AI_SERVICE_SECRET", "").strip()


def _require_secret(x_ai_secret: Optional[str]) -> None:
    expected = _secret()
    if not expected:
        raise HTTPException(status_code=500, detail="AI_SERVICE_SECRET is not configured")
    if not x_ai_secret or x_ai_secret.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _connect():
    return psycopg2.connect(_db_url())


def _fetch_products(conn) -> List[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, title, description, categoryid, storeid
            FROM products
            WHERE COALESCE(isactive, TRUE) = TRUE
            ORDER BY id ASC
            """
        )
        rows = cur.fetchall()

    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "id": int(r[0]),
                "title": r[1] or "",
                "description": r[2] or "",
                "categoryId": int(r[3]) if r[3] is not None else None,
                "storeId": int(r[4]) if r[4] is not None else None,
            }
        )
    return out


def _build_corpus(items: List[Dict[str, Any]]) -> List[str]:
    corpus: List[str] = []
    for p in items:
        parts = [
            str(p.get("title") or ""),
            str(p.get("description") or ""),
            f"category:{p.get('categoryId') or ''}",
            f"store:{p.get('storeId') or ''}",
        ]
        corpus.append(" ".join([x for x in parts if x]).strip())
    return corpus


def _upsert_vectors(conn, model_name: str, vectors, product_ids: List[int]) -> None:
    with conn.cursor() as cur:
        for idx, pid in enumerate(product_ids):
            v = vectors[idx]
            dense = v.toarray().ravel().tolist()
            payload = json.dumps(dense, ensure_ascii=False)
            cur.execute(
                """
                INSERT INTO product_vectors (product_id, model, vector, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (product_id, model)
                DO UPDATE SET vector = EXCLUDED.vector, updated_at = NOW()
                """,
                (pid, model_name, payload),
            )


def _insert_model_version(conn, name: str, version: str, artifact_b64: str, metadata: Dict[str, Any]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO ai_model_versions (name, version, artifact, metadata, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            """,
            (name, version, artifact_b64, json.dumps(metadata, ensure_ascii=False)),
        )


class TrainTfidfRequest(BaseModel):
    model: str = "tfidf-v1"
    max_features: int = 512
    min_df: int = 2
    max_df: float = 0.95


class TrainResponse(BaseModel):
    ok: bool
    model: str
    version: str
    products: int
    updatedAt: str


app = FastAPI(title="STAR LUX AI Service", version="1.0.0")


@app.get("/health")
def health():
    return {"ok": True, "time": _utc_now_iso()}


@app.post("/train/tfidf", response_model=TrainResponse)
def train_tfidf(payload: TrainTfidfRequest, x_ai_secret: Optional[str] = Header(default=None)):
    _require_secret(x_ai_secret)

    if payload.max_features < 64 or payload.max_features > 4096:
        raise HTTPException(status_code=400, detail="max_features out of range")

    conn = None
    try:
        conn = _connect()
        conn.autocommit = False

        products = _fetch_products(conn)
        if len(products) == 0:
            raise HTTPException(status_code=400, detail="No products found")

        corpus = _build_corpus(products)

        vectorizer = TfidfVectorizer(
            max_features=int(payload.max_features),
            min_df=int(payload.min_df),
            max_df=float(payload.max_df),
            ngram_range=(1, 2),
            strip_accents="unicode",
            lowercase=True,
        )

        X = vectorizer.fit_transform(corpus)
        product_ids = [int(p["id"]) for p in products]

        _upsert_vectors(conn, payload.model, X, product_ids)

        artifact_bytes = pickle.dumps(vectorizer)
        artifact_b64 = base64.b64encode(artifact_bytes).decode("utf-8")
        digest = hashlib.sha256(artifact_bytes).hexdigest()[:16]
        version = f"{payload.model}-{digest}"

        metadata = {
            "type": "tfidf",
            "model": payload.model,
            "max_features": payload.max_features,
            "min_df": payload.min_df,
            "max_df": payload.max_df,
            "products": len(products),
            "trainedAt": _utc_now_iso(),
        }
        _insert_model_version(conn, name=payload.model, version=version, artifact_b64=artifact_b64, metadata=metadata)

        conn.commit()

        return TrainResponse(ok=True, model=payload.model, version=version, products=len(products), updatedAt=_utc_now_iso())
    except HTTPException:
        if conn is not None:
            conn.rollback()
        raise
    except Exception as e:
        if conn is not None:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn is not None:
            conn.close()
