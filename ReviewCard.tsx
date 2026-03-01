import { useState } from 'react';
import { StarRating } from './StarRating';
import { ThumbsUp, ThumbsDown, Flag, MessageCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ReviewCardProps {
  review: {
    id: number;
    rating: number;
    userName: string;
    userImage?: string;
    reviewTitle?: string;
    reviewContent?: string;
    pros?: string[];
    cons?: string[];
    reviewImages?: string[];
    helpfulCount: number;
    notHelpfulCount: number;
    isVerifiedPurchase: boolean;
    createdAt: string;
    sellerResponse?: string;
    sellerResponseAt?: string;
  };
  onHelpful?: (reviewId: number) => void;
  onNotHelpful?: (reviewId: number) => void;
  onReport?: (reviewId: number) => void;
  isInteracting?: boolean;
  userInteraction?: 'helpful' | 'not_helpful' | null;
}

export function ReviewCard({
  review,
  onHelpful,
  onNotHelpful,
  onReport,
  isInteracting = false,
  userInteraction = null,
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSellerResponse, setShowSellerResponse] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // الحصول على الأحرف الأولى من الاسم
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  // التحقق من وجود محتوى طويل
  const hasLongContent = (review.reviewContent?.length || 0) > 300;
  const displayContent = hasLongContent && !isExpanded 
    ? review.reviewContent?.slice(0, 300) + '...'
    : review.reviewContent;
  
  return (
    <div className="bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
      {/* رأس المراجعة */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={review.userImage} alt={review.userName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              {getInitials(review.userName)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{review.userName}</span>
              {review.isVerifiedPurchase && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle className="w-3 h-3" />
                  مشتري موثق
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
        
        <StarRating
          value={review.rating}
          size={20}
          showValue
          animated={false}
        />
      </div>
      
      {/* عنوان المراجعة */}
      {review.reviewTitle && (
        <h4 className="font-bold text-lg mb-2">{review.reviewTitle}</h4>
      )}
      
      {/* محتوى المراجعة */}
      {review.reviewContent && (
        <div className="mb-4">
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          {hasLongContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary text-sm mt-2 flex items-center gap-1 hover:underline"
            >
              {isExpanded ? (
                <>
                  عرض أقل <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  عرض المزيد <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* الإيجابيات والسلبيات */}
      {(review.pros?.length || review.cons?.length) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros && review.pros.length > 0 && (
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <h5 className="font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                الإيجابيات
              </h5>
              <ul className="space-y-1">
                {review.pros.map((pro, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {review.cons && review.cons.length > 0 && (
            <div className="bg-red-500/10 rounded-lg p-3">
              <h5 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" />
                السلبيات
              </h5>
              <ul className="space-y-1">
                {review.cons.map((con, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* صور المراجعة */}
      {review.reviewImages && review.reviewImages.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {review.reviewImages.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`صورة المراجعة ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setImagePreview(image)}
            />
          ))}
        </div>
      )}
      
      {/* رد البائع */}
      {review.sellerResponse && (
        <div className="mb-4">
          <button
            onClick={() => setShowSellerResponse(!showSellerResponse)}
            className="text-sm text-primary flex items-center gap-1 hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            رد البائع
            {showSellerResponse ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showSellerResponse && (
            <div className="mt-2 bg-muted/50 rounded-lg p-3 border-r-4 border-primary">
              <p className="text-sm">{review.sellerResponse}</p>
              {review.sellerResponseAt && (
                <span className="text-xs text-muted-foreground mt-2 block">
                  {formatDate(review.sellerResponseAt)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* أزرار التفاعل */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">هل كانت هذه المراجعة مفيدة؟</span>
          
          <Button
            variant={userInteraction === 'helpful' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onHelpful?.(review.id)}
            disabled={isInteracting || userInteraction !== null}
            className="gap-1"
          >
            <ThumbsUp className="w-4 h-4" />
            {review.helpfulCount > 0 && review.helpfulCount}
          </Button>
          
          <Button
            variant={userInteraction === 'not_helpful' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNotHelpful?.(review.id)}
            disabled={isInteracting || userInteraction !== null}
            className="gap-1"
          >
            <ThumbsDown className="w-4 h-4" />
            {review.notHelpfulCount > 0 && review.notHelpfulCount}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReport?.(review.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Flag className="w-4 h-4" />
        </Button>
      </div>
      
      {/* معاينة الصورة */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setImagePreview(null)}
        >
          <img
            src={imagePreview}
            alt="معاينة الصورة"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export default ReviewCard;
