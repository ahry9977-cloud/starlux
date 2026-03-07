import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Search, ShoppingCart } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

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
  const { language, direction } = useLanguage();
  const [location, navigate] = useLocation();

  const initialSearch = useMemo(() => {
    const qIndex = location.indexOf("?");
    if (qIndex === -1) return "";
    const params = new URLSearchParams(location.slice(qIndex + 1));
    return params.get("search") ?? "";
  }, [location]);

  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; title: string }>>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const { data, isLoading } = trpc.products.getAll.useQuery({ limit: 60, offset: 0 });

  const products = useMemo(() => {
    if (aiResults) return aiResults;
    const list = (data as any)?.products ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p: any) => {
      const title = String(p?.title ?? "").toLowerCase();
      const desc = String(p?.description ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [aiResults, data, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/explore?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/explore`);
    }
  };

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{language === "ar-IQ" ? "استكشف المنتجات" : "Explore Products"}</h1>
            <p className="text-muted-foreground">{language === "ar-IQ" ? "ابحث وتصفح أحدث المنتجات" : "Search and browse the latest products"}</p>
          </div>

          <form onSubmit={handleSearch} className="w-full md:max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "ar-IQ" ? "ابحث عن منتج..." : "Search for a product..."}
                className="pl-10 pr-24"
              />
              <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
                {language === "ar-IQ" ? "بحث" : "Search"}
              </Button>

              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20">
                  {suggestions.slice(0, 8).map((s) => (
                    <button
                      key={`${s.id}-${s.title}`}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-muted transition"
                      onClick={() => {
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
                      {language === "ar-IQ" ? "جاري الاقتراح..." : "Suggesting..."}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {didYouMean && (
          <div className="mb-6">
            <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {language === "ar-IQ" ? "ربما تقصد:" : "Did you mean:"} <span className="text-foreground font-medium">{didYouMean}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery(didYouMean);
                  navigate(`/explore?search=${encodeURIComponent(didYouMean)}`);
                }}
              >
                {language === "ar-IQ" ? "بحث" : "Search"}
              </Button>
            </div>
          </div>
        )}

        {isLoading || aiLoading ? (
          <div className="py-12 text-center text-muted-foreground">{language === "ar-IQ" ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product: any) => {
                const imgs = safeParseImages(product.images);
                const img = imgs[0];
                return (
                  <Card
                    key={product.id}
                    className="border-border/50 bg-card hover:bg-card/80 transition-all cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="h-40 bg-muted flex items-center justify-center">
                      {img ? <img src={img} alt={product.title} className="w-full h-full object-cover" /> : <ShoppingCart className="w-10 h-10 text-muted-foreground" />}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-1">{product.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description || (language === "ar-IQ" ? "لا يوجد وصف" : "No description")}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold">${Number(product.price ?? 0)}</p>
                        <p className="text-xs text-muted-foreground">{language === "ar-IQ" ? `المخزون: ${product.stock ?? 0}` : `Stock: ${product.stock ?? 0}`}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">{language === "ar-IQ" ? "لا توجد منتجات مطابقة" : "No matching products"}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
