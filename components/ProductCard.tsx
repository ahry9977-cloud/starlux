import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/OptimizedImage";
import { StarRating } from "@/components/rating";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShoppingCart, Share2 } from "lucide-react";

export function ProductCard({
  product,
  language,
  onOpen,
  onBuyNow,
  onShare,
  className,
}: {
  product: any;
  language: string;
  onOpen: () => void;
  onBuyNow?: () => Promise<void> | void;
  onShare?: () => Promise<void> | void;
  className?: string;
}): React.JSX.Element {
  const { t } = useLanguage();
  const title = String(product?.title ?? "");
  const description = String(product?.description ?? "");
  const price = Number(product?.price ?? 0);

  const images = (() => {
    const raw = (product as any)?.images;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  })();

  const img = typeof images?.[0] === "string" ? images[0] : "";

  const ratingValRaw = (product as any)?.avgRating ?? (product as any)?.averageRating ?? (product as any)?.rating;
  const rating = Number(ratingValRaw);
  const ratingCount = Number((product as any)?.reviewsCount ?? (product as any)?.totalRatings ?? (product as any)?.ratingsCount ?? 0);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border bg-card/95 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10",
        className
      )}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="relative">
        <div className="h-44 bg-muted">
          {img ? (
            <OptimizedImage src={img} alt={title} className="h-44 w-full" />
          ) : (
            <div className="h-44 w-full flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-sm text-muted-foreground line-clamp-2 mb-3">{description || t("product.noDescription")}</div>

        <div className="flex items-center justify-between gap-2">
          <div className="font-bold">${price}</div>
          {Number.isFinite(rating) && rating > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating value={rating} size={16} animated={false} />
              {ratingCount > 0 ? (
                <span className="text-xs text-muted-foreground">({ratingCount})</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {(onBuyNow || onShare) && (
          <div className="mt-4 flex gap-2">
            {onBuyNow && (
              <Button
                size="sm"
                className="flex-1"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onBuyNow();
                }}
              >
                {t("product.buyNow")}
              </Button>
            )}

            {onShare && (
              <Button
                size="sm"
                variant="outline"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onShare();
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
