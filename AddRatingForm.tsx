import { useState, useCallback } from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Upload, Loader2 } from 'lucide-react';

interface AddRatingFormProps {
  entityType: 'product' | 'store' | 'seller';
  entityId: number;
  entityName: string;
  onSubmit: (data: {
    rating: number;
    qualityRating?: number;
    serviceRating?: number;
    deliveryRating?: number;
    valueRating?: number;
    title?: string;
    content?: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  showDetailedRatings?: boolean;
}

export function AddRatingForm({
  entityType,
  entityId,
  entityName,
  onSubmit,
  isSubmitting = false,
  showDetailedRatings = true,
}: AddRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  
  // إضافة إيجابية
  const addPro = useCallback(() => {
    if (newPro.trim() && pros.length < 5) {
      setPros([...pros, newPro.trim()]);
      setNewPro('');
    }
  }, [newPro, pros]);
  
  // إضافة سلبية
  const addCon = useCallback(() => {
    if (newCon.trim() && cons.length < 5) {
      setCons([...cons, newCon.trim()]);
      setNewCon('');
    }
  }, [newCon, cons]);
  
  // حذف إيجابية
  const removePro = useCallback((index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  }, [pros]);
  
  // حذف سلبية
  const removeCon = useCallback((index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  }, [cons]);
  
  // إرسال النموذج
  const handleSubmit = async () => {
    if (rating === 0) return;
    
    await onSubmit({
      rating,
      qualityRating: qualityRating > 0 ? qualityRating : undefined,
      serviceRating: serviceRating > 0 ? serviceRating : undefined,
      deliveryRating: deliveryRating > 0 ? deliveryRating : undefined,
      valueRating: valueRating > 0 ? valueRating : undefined,
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      pros: pros.length > 0 ? pros : undefined,
      cons: cons.length > 0 ? cons : undefined,
      images: images.length > 0 ? images : undefined,
    });
  };
  
  // الحصول على رسالة التقييم
  const getRatingMessage = (value: number) => {
    if (value >= 5) return 'ممتاز! 🌟';
    if (value >= 4) return 'جيد جداً 😊';
    if (value >= 3) return 'جيد 👍';
    if (value >= 2) return 'مقبول 😐';
    if (value >= 1) return 'ضعيف 😕';
    return 'اختر تقييمك';
  };
  
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <h3 className="text-xl font-bold text-center">
        قيّم تجربتك مع {entityName}
      </h3>
      
      {/* مؤشر الخطوات */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              transition-all duration-300
              ${step >= s 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
              }
            `}
          >
            {s}
          </div>
        ))}
      </div>
      
      {/* الخطوة 1: التقييم الأساسي */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center">
            <Label className="text-lg mb-4 block">التقييم العام</Label>
            <StarRating
              value={rating}
              size={48}
              interactive
              onChange={setRating}
              showValue
              animated
            />
            <p className="mt-2 text-lg font-medium text-primary">
              {getRatingMessage(rating)}
            </p>
          </div>
          
          {showDetailedRatings && rating > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <Label className="text-sm text-muted-foreground">تقييمات تفصيلية (اختياري)</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">جودة المنتج</Label>
                  <StarRating
                    value={qualityRating}
                    size={24}
                    interactive
                    onChange={setQualityRating}
                    animated={false}
                  />
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block">خدمة العملاء</Label>
                  <StarRating
                    value={serviceRating}
                    size={24}
                    interactive
                    onChange={setServiceRating}
                    animated={false}
                  />
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block">سرعة التوصيل</Label>
                  <StarRating
                    value={deliveryRating}
                    size={24}
                    interactive
                    onChange={setDeliveryRating}
                    animated={false}
                  />
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block">القيمة مقابل السعر</Label>
                  <StarRating
                    value={valueRating}
                    size={24}
                    interactive
                    onChange={setValueRating}
                    animated={false}
                  />
                </div>
              </div>
            </div>
          )}
          
          <Button
            onClick={() => setStep(2)}
            disabled={rating === 0}
            className="w-full"
          >
            التالي
          </Button>
        </div>
      )}
      
      {/* الخطوة 2: المراجعة المكتوبة */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div>
            <Label htmlFor="title">عنوان المراجعة (اختياري)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ملخص تجربتك في جملة واحدة"
              maxLength={255}
            />
          </div>
          
          <div>
            <Label htmlFor="content">تفاصيل المراجعة (اختياري)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="شاركنا تجربتك بالتفصيل..."
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/5000 حرف
            </p>
          </div>
          
          {/* الإيجابيات */}
          <div>
            <Label>الإيجابيات (اختياري)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                placeholder="أضف إيجابية..."
                onKeyPress={(e) => e.key === 'Enter' && addPro()}
              />
              <Button type="button" size="icon" onClick={addPro} disabled={pros.length >= 5}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {pros.map((pro, index) => (
                <span
                  key={index}
                  className="bg-emerald-500/20 text-emerald-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {pro}
                  <button onClick={() => removePro(index)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* السلبيات */}
          <div>
            <Label>السلبيات (اختياري)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                placeholder="أضف سلبية..."
                onKeyPress={(e) => e.key === 'Enter' && addCon()}
              />
              <Button type="button" size="icon" onClick={addCon} disabled={cons.length >= 5}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {cons.map((con, index) => (
                <span
                  key={index}
                  className="bg-red-500/20 text-red-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {con}
                  <button onClick={() => removeCon(index)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              السابق
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              التالي
            </Button>
          </div>
        </div>
      )}
      
      {/* الخطوة 3: المراجعة والإرسال */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">ملخص تقييمك</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>التقييم العام:</span>
                <StarRating value={rating} size={20} animated={false} showValue />
              </div>
              
              {title && (
                <div>
                  <span className="text-muted-foreground">العنوان:</span>
                  <p className="font-medium">{title}</p>
                </div>
              )}
              
              {content && (
                <div>
                  <span className="text-muted-foreground">المراجعة:</span>
                  <p className="text-sm">{content.slice(0, 100)}{content.length > 100 ? '...' : ''}</p>
                </div>
              )}
              
              {pros.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground">الإيجابيات:</span>
                  {pros.map((pro, i) => (
                    <span key={i} className="text-emerald-600 text-sm">+{pro}</span>
                  ))}
                </div>
              )}
              
              {cons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground">السلبيات:</span>
                  {cons.map((con, i) => (
                    <span key={i} className="text-red-600 text-sm">-{con}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isSubmitting}>
              السابق
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال التقييم'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddRatingForm;
