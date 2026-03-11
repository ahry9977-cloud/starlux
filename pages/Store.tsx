import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Share2, ShoppingCart, Store as StoreIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

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

export default function Store(): React.JSX.Element {
  const { language, direction } = useLanguage();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const storeId = Number(params.id ?? 0);
  const [search, setSearch] = useState("");

  const storeQuery = trpc.products.getStoreById.useQuery({ id: storeId }, { enabled: storeId > 0 });
  const productsQuery = trpc.products.getStoreProducts.useQuery(
    { storeId, limit: 60, offset: 0 },
    { enabled: storeId > 0 }
  );

  const shareMutation = trpc.sharing.track.useMutation();

  const handleShare = async (platform: 'whatsapp' | 'telegram' | 'facebook' | 'twitter' | 'copy_link') => {
    const url = `${window.location.origin}/store/${storeId}`;
    const text = String(storeQuery.data?.name ?? (language === "ar-IQ" ? "المتجر" : "Store"));

    try {
      if (platform === 'copy_link') {
        await navigator.clipboard.writeText(url);
        await shareMutation.mutateAsync({ platform, storeId });
        return;
      }

      const shareUrl = (() => {
        const u = encodeURIComponent(url);
        const t = encodeURIComponent(text);
        switch (platform) {
          case 'whatsapp':
            return `https://wa.me/?text=${t}%20${u}`;
          case 'telegram':
            return `https://t.me/share/url?url=${u}&text=${t}`;
          case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
          case 'twitter':
            return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
          default:
            return '';
        }
      })();

      if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
      await shareMutation.mutateAsync({ platform, storeId });
    } catch {
      // ignore
    }
  };

  const products = useMemo(() => {
    const list = ((productsQuery.data as any)?.products ?? []) as any[];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p: any) => {
      const title = String(p?.title ?? "").toLowerCase();
      const desc = String(p?.description ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [productsQuery.data, search]);

  const store = storeQuery.data as any;

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <StoreIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{store?.name ?? (language === "ar-IQ" ? "المتجر" : "Store")}</h1>
              <p className="text-muted-foreground text-sm">{store?.description ?? ""}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" className="gap-2" onClick={() => handleShare('whatsapp')}>
                <Share2 className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleShare('telegram')}>
                <Share2 className="w-4 h-4" />
                Telegram
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleShare('facebook')}>
                <Share2 className="w-4 h-4" />
                Facebook
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleShare('twitter')}>
                <Share2 className="w-4 h-4" />
                X
              </Button>
              <Button className="gap-2" onClick={() => handleShare('copy_link')}>
                <Share2 className="w-4 h-4" />
                {language === "ar-IQ" ? "نسخ الرابط" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === "ar-IQ" ? "ابحث داخل المتجر..." : "Search in store..."}
              className="pr-4"
            />
          </div>
        </div>

        {storeQuery.isLoading || productsQuery.isLoading ? (
          <div className="py-12 text-center text-muted-foreground">{language === "ar-IQ" ? "جاري التحميل..." : "Loading..."}</div>
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
                    const buyNowMutation = trpc.cart.buyNow.useMutation();
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
                    const shareMutation = trpc.sharing.track.useMutation();
                    const url = `${window.location.origin}/product/${product.id}`;
                    await navigator.clipboard.writeText(url);
                    await shareMutation.mutateAsync({ platform: "copy_link", productId: Number(product.id) } as any);
                  }}
                />
              ))}
            </div>

            {products.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">{language === "ar-IQ" ? "لا توجد منتجات" : "No products"}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
