import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { AppNavbar } from "@/components/AppNavbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Search, ShoppingCart } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const RECENT_SEARCHES_KEY = "star_lux_recent_searches";

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x)).map((s) => s.trim()).filter(Boolean).slice(0, 10);
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const q = String(query ?? "").trim();
  if (!q) return;
  const prev = loadRecentSearches();
  const next = [q, ...prev.filter((p) => p.toLowerCase() !== q.toLowerCase())].slice(0, 10);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function safeParseImages(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter((x) => typeof x === "string") as string[];
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string") as string[];
    } catch {
      return [];
    }
  }
  return [];
}

export default function Explore(): React.JSX.Element {
  const { language, direction, t } = useLanguage();
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const buyNowMutation = trpc.cart.buyNow.useMutation();
  const shareMutation = trpc.sharing.track.useMutation();

  const initialSearch = useMemo(() => {
    const qIndex = location.indexOf("?");
    if (qIndex === -1) return "";
    const params = new URLSearchParams(location.slice(qIndex + 1));
    return params.get("search") ?? "";
  }, [location]);

  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; title: string }>>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadRecentSearches();
  });

  const { data, isLoading } = trpc.products.getAll.useQuery({ limit: 60, offset: 0 });

  const dbSearchEnabled = searchQuery.trim().length > 0;
  const { data: dbSearchData, isLoading: dbSearchLoading } = trpc.products.search.useQuery(
    { query: searchQuery.trim(), limit: 60, offset: 0 },
    { enabled: dbSearchEnabled }
  );

  const products = useMemo(() => {
    if (aiResults) return aiResults;

    const q = searchQuery.trim();
    if (q) {
      const fromDb = (dbSearchData as any)?.products ?? [];
      return Array.isArray(fromDb) ? fromDb : [];
    }

    const list = (data as any)?.products ?? [];
    return Array.isArray(list) ? list : [];
  }, [aiResults, data, dbSearchData, searchQuery]);

  const recommendedProducts = useMemo(() => {
    const list = (data as any)?.products ?? [];
    return Array.isArray(list) ? list.slice(0, 8) : [];
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      saveRecentSearch(q);
      setRecentSearches(loadRecentSearches());
      navigate(`/explore?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/explore`);
    }
  };

  const stopVoice = useCallback(() => {
    try {
      const rec = recognitionRef.current;
      if (rec) rec.stop?.();
    } catch {
      // ignore
    } finally {
      setListening(false);
      recognitionRef.current = null;
    }
  }, []);

  const startVoice = useCallback(() => {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening) {
      stopVoice();
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = language;
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (event: any) => {
      const result = event?.results?.[0];
      const transcript = String(result?.[0]?.transcript ?? "").trim();
      if (!transcript) return;
      setSearchQuery(transcript);
      const isFinal = Boolean(result?.isFinal);
      if (isFinal) {
        saveRecentSearch(transcript);
        setRecentSearches(loadRecentSearches());
        navigate(`/explore?search=${encodeURIComponent(transcript)}`);
      }
    };

    rec.onerror = () => {
      stopVoice();
    };

    rec.onend = () => {
      stopVoice();
    };

    setListening(true);
    rec.start();
  }, [language, listening, navigate, stopVoice]);

  React.useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setAiResults(null);
      setDidYouMean(null);
      return;
    }
    let cancelled = false;
    setAiLoading(true);
    fetch("/api/ai-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.ok && Array.isArray(json?.products)) {
          setAiResults(json.products);
          setDidYouMean(typeof json?.didYouMean === "string" && json.didYouMean.trim() ? json.didYouMean : null);
        } else {
          setAiResults(null);
          setDidYouMean(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAiResults(null);
        setDidYouMean(null);
      })
      .finally(() => {
        if (cancelled) return;
        setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  React.useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setSuggestLoading(true);
      fetch(`/api/ai-suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((json) => {
          if (cancelled) return;
          if (json?.ok && Array.isArray(json?.suggestions)) {
            setSuggestions(
              (json.suggestions as any[])
                .map((s: any) => ({ id: Number(s?.id), title: String(s?.title ?? "") }))
                .filter((s: any) => Number.isFinite(s.id) && s.title)
            );
          } else {
            setSuggestions([]);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setSuggestions([]);
        })
        .finally(() => {
          if (cancelled) return;
          setSuggestLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <AppNavbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSubmitSearch={handleSearch} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("explore.title")}</h1>
            <p className="text-muted-foreground">{t("explore.subtitle")}</p>
          </div>

          <form onSubmit={handleSearch} className="w-full md:max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("explore.searchPlaceholder")}
                className="pl-10 pr-36"
              />
              <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
                {t("explore.searchButton")}
              </Button>

              {voiceSupported && (
                <Button
                  type="button"
                  size="sm"
                  variant={listening ? "destructive" : "outline"}
                  className="absolute right-[72px] top-1/2 -translate-y-1/2"
                  onClick={startVoice}
                  title={listening ? "Stop" : "Voice search"}
                >
                  {listening ? "■" : "🎤"}
                </Button>
              )}

              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20">
                  {suggestions.slice(0, 8).map((s) => (
                    <button
                      key={`${s.id}-${s.title}`}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-muted transition"
                      onClick={() => {
                        saveRecentSearch(s.title);
                        setRecentSearches(loadRecentSearches());
                        setSearchQuery(s.title);
                        setSuggestions([]);
                        navigate(`/explore?search=${encodeURIComponent(s.title)}`);
                      }}
                    >
                      <div className="text-sm font-medium line-clamp-1">{s.title}</div>
                    </button>
                  ))}
                  {suggestLoading && (
                    <div className="px-4 py-2 text-xs text-muted-foreground">
                      {t("explore.suggesting")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {recentSearches.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {recentSearches.slice(0, 10).map((q) => (
                  <Button
                    key={`recent-${q}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full px-3"
                    onClick={() => {
                      saveRecentSearch(q);
                      setRecentSearches(loadRecentSearches());
                      setSearchQuery(q);
                      navigate(`/explore?search=${encodeURIComponent(q)}`);
                    }}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}
          </form>
        </div>

        {didYouMean && (
          <div className="mb-6">
            <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {t("explore.didYouMean")} <span className="text-foreground font-medium">{didYouMean}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  saveRecentSearch(didYouMean);
                  setRecentSearches(loadRecentSearches());
                  setSearchQuery(didYouMean);
                  navigate(`/explore?search=${encodeURIComponent(didYouMean)}`);
                }}
              >
                {t("explore.searchButton")}
              </Button>
            </div>
          </div>
        )}

        {isLoading || aiLoading || dbSearchLoading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  onOpen={() => navigate(`/product/${product.id}`)}
                  onBuyNow={async () => {
                    if (!isAuthenticated) {
                      navigate("/auth");
                      return;
                    }
                    const res = await buyNowMutation.mutateAsync({
                      productId: Number(product.id),
                      quantity: 1,
                      paymentMethod: "visa",
                    } as any);
                    if ((res as any)?.orderId) {
                      navigate(
                        `/payment/${(res as any).orderId}?amount=${encodeURIComponent(String((res as any).total ?? 0))}`
                      );
                    }
                  }}
                  onShare={async () => {
                    const url = `${window.location.origin}/product/${product.id}`;
                    await navigator.clipboard.writeText(url);
                    await shareMutation.mutateAsync({ platform: "copy_link", productId: Number(product.id) } as any);
                  }}
                />
              ))}
            </div>

            {products.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">{t("explore.noProducts")}</p>
              </div>
            )}

            {searchQuery.trim() && products.length === 0 && recommendedProducts.length > 0 && (
              <div className="mt-10">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {t("explore.recommendedTitle")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("explore.recommendedSubtitle")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/explore")}>
                    {t("explore.seeMore")}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedProducts.map((product: any) => (
                    <ProductCard
                      key={`rec-${product.id}`}
                      product={product}
                      language={language}
                      onOpen={() => navigate(`/product/${product.id}`)}
                      onBuyNow={async () => {
                        if (!isAuthenticated) {
                          navigate("/auth");
                          return;
                        }
                        const res = await buyNowMutation.mutateAsync({
                          productId: Number(product.id),
                          quantity: 1,
                          paymentMethod: "visa",
                        } as any);
                        if ((res as any)?.orderId) {
                          navigate(
                            `/payment/${(res as any).orderId}?amount=${encodeURIComponent(String((res as any).total ?? 0))}`
                          );
                        }
                      }}
                      onShare={async () => {
                        const url = `${window.location.origin}/product/${product.id}`;
                        await navigator.clipboard.writeText(url);
                        await shareMutation.mutateAsync({ platform: "copy_link", productId: Number(product.id) } as any);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
