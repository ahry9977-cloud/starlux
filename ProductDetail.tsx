import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { StarRating, RatingDistribution, ReviewCard, AddRatingForm } from '@/components/rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OptimizedImage } from './OptimizedImage';
import { 
  Loader2, ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, 
  Star, PenLine, Truck, Shield, RefreshCw, ArrowRight, Store, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const productId = parseInt(params.id || '0');
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAddRating, setShowAddRating] = useState(false);
  
  // جلب بيانات المنتج
  const { data: product, isLoading: productLoading } = trpc.products.getById.useQuery(
    { id: productId },
    { enabled: productId > 0 }
  );
  
  // جلب ملخص التقييمات
  const { data: ratingsData, refetch: refetchRatings } = trpc.ratings.getEntityRatings.useQuery(
    {
      entityType: 'product',
      entityId: productId,
      page: 1,
      limit: 3,
      sortBy: 'helpful',
    },
    { enabled: productId > 0 }
  );
  
  // جلب تقييم المستخدم الحالي
  const { data: userRating, refetch: refetchUserRating } = trpc.ratings.getUserRating.useQuery(
    {
      entityType: 'product',
      entityId: productId,
    },
    { enabled: productId > 0 && !!user }
  );
  
  // إضافة للسلة
  const addToCartMutation = trpc.cart.addToCart.useMutation({
    onSuccess: () => {
      toast.success('تمت الإضافة للسلة!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ');
    },
  });

  const buyNowMutation = trpc.cart.buyNow.useMutation({
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ');
    },
  });

  const shareMutation = trpc.sharing.track.useMutation();

  const logViewMutation = trpc.products.logView.useMutation();

  const { data: similarData } = trpc.products.getSimilar.useQuery(
    { productId, limit: 8 },
    { enabled: productId > 0 }
  );

  useEffect(() => {
    if (!productId) return;
    logViewMutation.mutate({ productId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);
  
  // إضافة تقييم
  const addRatingMutation = trpc.ratings.addRating.useMutation({
    onSuccess: async (data) => {
      toast.success('تم إضافة تقييمك بنجاح!');
      setShowAddRating(false);
      await refetchRatings();
      await refetchUserRating();
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة التقييم');
    },
  });
  
  // إضافة مراجعة
  const addReviewMutation = trpc.ratings.addReview.useMutation({
    onSuccess: () => {
      refetchRatings();
    },
  });
  
  // معالجة إرسال التقييم
  const handleSubmitRating = async (data: any) => {
    const result = await addRatingMutation.mutateAsync({
      entityType: 'product',
      entityId: productId,
      rating: data.rating,
      qualityRating: data.qualityRating,
      serviceRating: data.serviceRating,
      deliveryRating: data.deliveryRating,
      valueRating: data.valueRating,
    });
    
    if (result.ratingId && data.content) {
      await addReviewMutation.mutateAsync({
        ratingId: result.ratingId,
        title: data.title,
        content: data.content,
        pros: data.pros,
        cons: data.cons,
        images: data.images,
      });
    }
  };
  
  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">المنتج غير موجود</p>
          <Button onClick={() => setLocation('/explore')}>
            تصفح المنتجات
          </Button>
        </div>
      </div>
    );
  }

  const images = (() => {
    const raw = (product as any)?.images;
    if (!raw) return [] as string[];
    if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string') as string[];
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string') as string[];
      } catch {
        return [] as string[];
      }
    }
    return [] as string[];
  })();
  const summary = ratingsData?.summary;
  const topReviews = ratingsData?.ratings || [];

  useEffect(() => {
    setSelectedImage((prev) => {
      if (images.length === 0) return 0;
      if (prev < 0) return 0;
      if (prev >= images.length) return images.length - 1;
      return prev;
    });
  }, [images.length]);

  const handleShare = async (platform: 'whatsapp' | 'telegram' | 'facebook' | 'twitter' | 'copy_link') => {
    const url = `${window.location.origin}/product/${productId}`;
    const text = `${product.title}`;

    try {
      if (platform === 'copy_link') {
        await navigator.clipboard.writeText(url);
        await shareMutation.mutateAsync({ platform, productId });
        toast.success('تم نسخ رابط المنتج');
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
      await shareMutation.mutateAsync({ platform, productId });
    } catch {
      toast.error('تعذر المشاركة');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-4">
          <button
            onClick={() => setLocation('/explore')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للتصفح
          </button>
        </div>
      </div>
      
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* قسم الصور */}
          <div className="space-y-4">
            {/* الصورة الرئيسية */}
            <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
              {images.length > 0 ? (
                <OptimizedImage
                  src={images[selectedImage]}
                  alt={product.title}
                  priority
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">لا توجد صورة</span>
                </div>
              )}
              
              {/* أزرار التنقل */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* الصور المصغرة */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`
                      w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all
                      ${selectedImage === index ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}
                    `}
                  >
                    <OptimizedImage src={image} alt="" className="w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* قسم التفاصيل */}
          <div className="space-y-6">
            {/* العنوان والتقييم */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold">{product.title}</h1>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>مشاركة المنتج</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => handleShare('whatsapp')}>WhatsApp</Button>
                        <Button variant="outline" onClick={() => handleShare('telegram')}>Telegram</Button>
                        <Button variant="outline" onClick={() => handleShare('facebook')}>Facebook</Button>
                        <Button variant="outline" onClick={() => handleShare('twitter')}>X</Button>
                        <Button className="col-span-2" onClick={() => handleShare('copy_link')}>نسخ الرابط</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {/* التقييم */}
              <div className="flex items-center gap-4 mt-3">
                <StarRating
                  value={parseFloat(summary?.averageRating || '0')}
                  size={20}
                  showValue
                  showCount
                  count={summary?.totalRatings || 0}
                  animated={false}
                />
                <button
                  onClick={() => setLocation(`/product/${productId}/reviews`)}
                  className="text-sm text-primary hover:underline"
                >
                  عرض جميع المراجعات
                </button>
              </div>
            </div>
            
            {/* السعر */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                {parseFloat(product.price).toLocaleString('ar-EG')} د.ع
              </span>
              {(product as any).originalPrice && parseFloat((product as any).originalPrice) > parseFloat(product.price) && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {parseFloat((product as any).originalPrice).toLocaleString('ar-EG')} د.ع
                  </span>
                  <Badge variant="destructive">
                    خصم {Math.round((1 - parseFloat(product.price) / parseFloat((product as any).originalPrice)) * 100)}%
                  </Badge>
                </>
              )}
            </div>
            
            {/* الوصف */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
            
            {/* الكمية والإضافة للسلة */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  +
                </button>
              </div>
              
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={() => {
                  if (!user) {
                    toast.error('يجب تسجيل الدخول أولاً');
                    return;
                  }
                  addToCartMutation.mutate({
                    productId,
                    quantity,
                  });
                }}
                disabled={addToCartMutation.isPending}
              >
                {addToCartMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                أضف للسلة
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  if (!user) {
                    toast.error('يجب تسجيل الدخول أولاً');
                    return;
                  }
                  const res = await buyNowMutation.mutateAsync({
                    productId,
                    quantity,
                    paymentMethod: 'visa',
                  });
                  if ((res as any)?.orderId) {
                    setLocation(`/payment/${(res as any).orderId}?amount=${encodeURIComponent(String((res as any).total ?? 0))}`);
                  }
                }}
                disabled={buyNowMutation.isPending}
              >
                {buyNowMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                شراء الآن
              </Button>
            </div>
            
            {/* المميزات */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm">توصيل سريع</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm">ضمان الجودة</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm">إرجاع سهل</span>
              </div>
            </div>
            
            {/* معلومات المتجر */}
            {product.storeId && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Store className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">المتجر</h4>
                  <p className="text-sm text-muted-foreground">متجر موثق</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLocation(`/store/${product.storeId}`)}>
                  زيارة المتجر
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* قسم التقييمات والمراجعات */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">التقييمات والمراجعات</h2>
            <Button
              variant="outline"
              onClick={() => setLocation(`/product/${productId}/reviews`)}
            >
              عرض الكل ({summary?.totalRatings || 0})
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ملخص التقييمات */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary mb-2">
                  {parseFloat(summary?.averageRating || '0').toFixed(1)}
                </div>
                <StarRating
                  value={parseFloat(summary?.averageRating || '0')}
                  size={28}
                  animated
                />
                <p className="text-muted-foreground mt-2">
                  من {summary?.totalRatings?.toLocaleString('ar-EG') || 0} تقييم
                </p>
              </div>
              
              {summary && (
                <RatingDistribution
                  distribution={{
                    count5Stars: summary.count5Stars || 0,
                    count4Stars: summary.count4Stars || 0,
                    count3Stars: summary.count3Stars || 0,
                    count2Stars: summary.count2Stars || 0,
                    count1Star: summary.count1Star || 0,
                  }}
                  totalRatings={summary.totalRatings || 0}
                />
              )}
              
              {/* زر إضافة تقييم */}
              {user && !userRating && (
                <Dialog open={showAddRating} onOpenChange={setShowAddRating}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-6 gap-2">
                      <PenLine className="w-4 h-4" />
                      أضف تقييمك
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>تقييم المنتج</DialogTitle>
                    </DialogHeader>
                    <AddRatingForm
                      entityType="product"
                      entityId={productId}
                      entityName={product.title}
                      onSubmit={handleSubmitRating}
                      isSubmitting={addRatingMutation.isPending || addReviewMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              )}
              
              {userRating && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">تقييمك:</p>
                  <StarRating
                    value={parseFloat(String(userRating.rating))}
                    size={20}
                    animated={false}
                  />
                </div>
              )}
            </div>
            
            {/* أفضل المراجعات */}
            <div className="lg:col-span-2 space-y-4">
              {topReviews.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد مراجعات بعد</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    كن أول من يقيّم هذا المنتج!
                  </p>
                </div>
              ) : (
                topReviews.map((review: any) => (
                  <ReviewCard
                    key={review.rating?.id || review.id}
                    review={{
                      id: review.rating?.id || review.id,
                      rating: parseFloat(review.rating?.rating || review.rating || '0'),
                      userName: review.userName || 'مستخدم',
                      userImage: review.userImage,
                      reviewTitle: review.reviewTitle,
                      reviewContent: review.reviewContent,
                      pros: review.pros ? JSON.parse(review.pros) : [],
                      cons: review.cons ? JSON.parse(review.cons) : [],
                      reviewImages: review.reviewImages ? JSON.parse(review.reviewImages) : [],
                      helpfulCount: review.helpfulCount || 0,
                      notHelpfulCount: review.notHelpfulCount || 0,
                      isVerifiedPurchase: review.rating?.isVerifiedPurchase || review.isVerifiedPurchase || false,
                      createdAt: review.rating?.createdAt || review.createdAt,
                      sellerResponse: review.sellerResponse,
                      sellerResponseAt: review.sellerResponseAt,
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {Array.isArray((similarData as any)?.products) && (similarData as any).products.length > 0 && (
        <div className="container pb-12">
          <h2 className="text-2xl font-bold mb-4">منتجات مشابهة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(((similarData as any)?.products ?? []) as any[]).slice(0, 8).map((p: any) => (
              <button
                key={`sim-${p.id}`}
                onClick={() => setLocation(`/product/${p.id}`)}
                className="text-left bg-card border border-border rounded-xl p-4 hover:bg-card/80 transition"
              >
                <div className="font-semibold line-clamp-1">{p.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description || ''}</div>
                <div className="mt-3 font-bold text-primary">{Number(p.price ?? 0).toLocaleString('ar-EG')} د.ع</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
