import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Star, PartyPopper } from 'lucide-react';

interface PaymentSuccessAnimationProps {
  isVisible: boolean;
  amount?: number;
  onComplete?: () => void;
  className?: string;
}

// مكون الجزيئات المتطايرة
function Confetti({ count = 50 }: { count?: number }) {
  const colors = ['#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const rotation = Math.random() * 360;
        
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: '-20px',
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              transform: `rotate(${rotation}deg)`,
              animation: `confettiFall ${duration}s ease-out ${delay}s forwards`,
            }}
          />
        );
      })}
      
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// مكون النجوم المتلألئة
function SparkleStars({ count = 20 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 2;
        const size = 10 + Math.random() * 20;
        
        return (
          <div
            key={i}
            className="absolute text-yellow-400"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              fontSize: `${size}px`,
              animation: `sparkle 1.5s ease-in-out ${delay}s infinite`,
            }}
          >
            ✦
          </div>
        );
      })}
      
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}

// مكون الدائرة المتوسعة
function ExpandingCircle({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="absolute inset-0 rounded-full border-4 border-emerald-400"
      style={{
        animation: `expandCircle 1s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <style>{`
        @keyframes expandCircle {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// مكون علامة الصح المتحركة
function AnimatedCheckmark({ isVisible }: { isVisible: boolean }) {
  return (
    <div className="relative w-24 h-24">
      {/* الدوائر المتوسعة */}
      {isVisible && (
        <>
          <ExpandingCircle delay={0} />
          <ExpandingCircle delay={0.2} />
          <ExpandingCircle delay={0.4} />
        </>
      )}
      
      {/* الدائرة الرئيسية */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-600',
          'flex items-center justify-center shadow-2xl shadow-emerald-500/50',
          'transition-all duration-500',
          isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        )}
      >
        {/* علامة الصح */}
        <svg
          viewBox="0 0 24 24"
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M5 13l4 4L19 7"
            className={cn(
              isVisible && 'checkmark-animated'
            )}
            style={{
              strokeDasharray: 30,
              strokeDashoffset: isVisible ? 0 : 30,
              transition: 'stroke-dashoffset 0.5s ease-out 0.3s',
            }}
          />
        </svg>
      </div>
    </div>
  );
}

// مكون الرسالة المتحركة
function AnimatedMessage({ 
  isVisible, 
  amount 
}: { 
  isVisible: boolean;
  amount?: number;
}) {
  return (
    <div
      className={cn(
        'text-center transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: '0.5s' }}
    >
      <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
        <PartyPopper className="w-8 h-8 text-yellow-400" />
        تم الدفع بنجاح!
        <PartyPopper className="w-8 h-8 text-yellow-400 scale-x-[-1]" />
      </h2>
      
      {amount && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
          <p className="text-sm text-emerald-300 mb-1">المبلغ المدفوع</p>
          <p className="text-3xl font-bold text-emerald-400">
            {amount.toLocaleString()} <span className="text-lg">د.ع</span>
          </p>
        </div>
      )}
      
      <p className="mt-4 text-slate-400">
        شكراً لك، سيتم معالجة طلبك قريباً
      </p>
    </div>
  );
}

// المكون الرئيسي
export function PaymentSuccessAnimation({
  isVisible,
  amount,
  onComplete,
  className,
}: PaymentSuccessAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isVisible) {
      // تشغيل الجزيئات
      setShowConfetti(true);
      
      // تشغيل النجوم بعد تأخير
      setTimeout(() => setShowSparkles(true), 300);
      
      // تشغيل صوت النجاح (اختياري)
      try {
        // يمكن إضافة صوت هنا
      } catch (e) {
        // تجاهل أخطاء الصوت
      }
      
      // استدعاء onComplete بعد انتهاء الأنيميشن
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      setShowSparkles(false);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-slate-900/95 backdrop-blur-sm',
        className
      )}
    >
      {/* الجزيئات */}
      {showConfetti && <Confetti count={80} />}
      
      {/* النجوم */}
      {showSparkles && <SparkleStars count={30} />}
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-8">
        <AnimatedCheckmark isVisible={isVisible} />
        <AnimatedMessage isVisible={isVisible} amount={amount} />
      </div>
      
      {/* تأثير التوهج في الخلفية */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.2) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}

export default PaymentSuccessAnimation;
