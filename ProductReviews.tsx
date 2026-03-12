import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { StarRating, RatingDistribution, ReviewCard, AddRatingForm } from '@/components/rating';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Star, PenLine, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function safeParseStringArray(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((x) => typeof x === 'string') as string[];
  if (typeof input !== 'string') return [];
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === 'string') as string[];
  } catch {
    return [];
  }
}

export default function ProductReviews() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const productId = parseInt(params.id || '0');
  
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [showAddRating, setShowAddRating] = useState(false);
  
  // جلب بيانات المنتج
  const { data: product, isLoading: productLoading } = trpc.products.getById.useQuery(
    { id: productId },
    { enabled: productId > 0 }
  );
  
  // جلب التقييمات
  const { data: ratingsData, isLoading: ratingsLoading, refetch: refetchRatings } = trpc.ratings.getEntityRatings.useQuery(
    {
      entityType: 'product',
      entityId: productId,
      page,
      limit: 10,
      sortBy,
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
  
  // إضافة تقييم
  const addRatingMutation = trpc.ratings.addRating.useMutation({
    onSuccess: async (data) => {
      toast.success('تم إضافة تقييمك بنجاح!');
      setShowAddRating(false);
      await refetchRatings();
      await refetchUserRating();
      
      // إذا كان هناك محتوى مراجعة، أضف المراجعة
      if (data.ratingId) {
        // يمكن إضافة المراجعة هنا
      }
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة التقييم');
    },
  });
  
  // إضافة مراجعة
  const addReviewMutation = trpc.ratings.addReview.useMutation({
    onSuccess: () => {
      toast.success('تم إضافة مراجعتك بنجاح!');
      refetchRatings();
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة المراجعة');
    },
  });
  
  // التفاعل مع المراجعة
  const interactMutation = trpc.ratings.interactWithReview.useMutation({
    onSuccess: () => {
      toast.success('تم تسجيل تفاعلك');
      refetchRatings();
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ');
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
    
    // إضافة المراجعة إذا كان هناك محتوى
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
  
  // معالجة تصفية النجوم
  const handleFilterStars = (stars: number) => {
    setFilterStars(filterStars === stars ? null : stars);
    setPage(1);
  };
  
  if (productLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">المنتج غير موجود</p>
      </div>
    );
  }
  
  const summary = ratingsData?.summary;
  const ratings = ratingsData?.ratings || [];
  const pagination = ratingsData?.pagination;
  
  return (
    <div className="min-h-screen bg-background">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-8">
        <div className="container">
          <button
            onClick={() => setLocation(`/product/${productId}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمنتج
          </button>
          
          <div className="flex items-start gap-6">
            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-4">
                <StarRating
                  value={parseFloat(summary?.averageRating || '0')}
                  size={24}
                  showValue
                  showCount
                  count={summary?.totalRatings || 0}
                  animated={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* الجانب الأيسر - ملخص التقييمات */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">ملخص التقييمات</h2>
              
              {/* التقييم الإجمالي */}
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
                {(summary?.verifiedPurchases ?? 0) > 0 && (
                  <p className="text-sm text-emerald-600 mt-1">
                    {summary?.verifiedPurchases ?? 0} من مشترين موثقين
                  </p>
                )}
              </div>
              
              {/* توزيع التقييمات */}
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
                  onFilterClick={handleFilterStars}
                  activeFilter={filterStars}
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
              
              {!user && (
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => setLocation('/auth')}
                >
                  سجل دخولك لإضافة تقييم
                </Button>
              )}
            </div>
          </div>
          
          {/* الجانب الأيمن - قائمة المراجعات */}
          <div className="lg:col-span-2">
            {/* شريط الفرز */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                المراجعات ({pagination?.total || 0})
              </h2>
              
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="oldest">الأقدم</SelectItem>
                  <SelectItem value="highest">الأعلى تقييماً</SelectItem>
                  <SelectItem value="lowest">الأقل تقييماً</SelectItem>
                  <SelectItem value="helpful">الأكثر فائدة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* قائمة المراجعات */}
            {ratingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد مراجعات بعد</p>
                <p className="text-sm text-muted-foreground mt-1">
                  كن أول من يقيّم هذا المنتج!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map((review: any) => (
                  <ReviewCard
                    key={review.rating?.id || review.id}
                    review={{
                      id: review.rating?.id || review.id,
                      rating: parseFloat(review.rating?.rating || review.rating || '0'),
                      userName: review.userName || 'مستخدم',
                      userImage: review.userImage,
                      reviewTitle: review.reviewTitle,
                      reviewContent: review.reviewContent,
                      pros: safeParseStringArray(review.pros),
                      cons: safeParseStringArray(review.cons),
                      reviewImages: safeParseStringArray(review.reviewImages),
                      helpfulCount: review.helpfulCount || 0,
                      notHelpfulCount: review.notHelpfulCount || 0,
                      isVerifiedPurchase: review.rating?.isVerifiedPurchase || review.isVerifiedPurchase || false,
                      createdAt: review.rating?.createdAt || review.createdAt,
                      sellerResponse: review.sellerResponse,
                      sellerResponseAt: review.sellerResponseAt,
                    }}
                    onHelpful={(reviewId) => {
                      if (!user) {
                        toast.error('يجب تسجيل الدخول أولاً');
                        return;
                      }
                      interactMutation.mutate({
                        reviewId,
                        interactionType: 'helpful',
                      });
                    }}
                    onNotHelpful={(reviewId) => {
                      if (!user) {
                        toast.error('يجب تسجيل الدخول أولاً');
                        return;
                      }
                      interactMutation.mutate({
                        reviewId,
                        interactionType: 'not_helpful',
                      });
                    }}
                    onReport={(reviewId) => {
                      if (!user) {
                        toast.error('يجب تسجيل الدخول أولاً');
                        return;
                      }
                      interactMutation.mutate({
                        reviewId,
                        interactionType: 'report',
                        reportReason: 'other',
                      });
                    }}
                    isInteracting={interactMutation.isPending}
                  />
                ))}
              </div>
            )}
            
            {/* التصفح */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  السابق
                </Button>
                <span className="px-4 py-2 bg-muted rounded-lg">
                  {page} من {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  التالي
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
