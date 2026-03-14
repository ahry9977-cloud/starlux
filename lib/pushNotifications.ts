import admin from "firebase-admin";

let _initError: Error | null = null;
let _initialized = false;

function getServiceAccountJson(): any | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw || raw.trim().length === 0) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    // Common in Railway/Render envs: JSON is wrapped/escaped. User can also provide base64.
    return null;
  }
}

function getServiceAccountBase64(): any | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!raw || raw.trim().length === 0) return null;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function initFirebaseAdmin(): { ok: boolean; error?: string } {
  if (_initialized) return { ok: true };
  if (_initError) return { ok: false, error: _initError.message };

  try {
    const serviceAccount = getServiceAccountJson() ?? getServiceAccountBase64();
    if (!serviceAccount) {
      _initError = new Error(
        "Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64."
      );
      return { ok: false, error: _initError.message };
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    _initialized = true;
    return { ok: true };
  } catch (e: any) {
    _initError = e instanceof Error ? e : new Error(String(e));
    return { ok: false, error: _initError.message };
  }
}

export async function sendPushToTokens(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ ok: boolean; successCount: number; failureCount: number; error?: string }> {
  const init = initFirebaseAdmin();
  if (!init.ok) {
    return { ok: false, successCount: 0, failureCount: params.tokens.length, error: init.error };
  }

  const tokens = (params.tokens ?? []).map(String).filter(Boolean);
  if (tokens.length === 0) return { ok: true, successCount: 0, failureCount: 0 };

  const messaging = admin.messaging();
  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: params.data,
  });

  return {
    ok: res.failureCount === 0,
    successCount: res.successCount,
    failureCount: res.failureCount,
  };
}
