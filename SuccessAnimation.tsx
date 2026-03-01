import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, Package, Sparkles } from 'lucide-react';
import './animations.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  orderNumber?: string;
  showConfetti?: boolean;
  className?: string;
}

// ألوان الجزيئات
const PARTICLE_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f472b6', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
];

export function SuccessAnimation({
  show,
  onComplete,
  title = 'تم الطلب بنجاح!',
  subtitle = 'شكراً لك على طلبك',
  orderNumber,
  showConfetti = true,
  className,
}: SuccessAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // إنشاء الجزيئات
  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1,
      });
    }

    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (showConfetti) {
        createParticles();
      }
      
      // إظهار المحتوى بعد تأخير
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 500);

      // إزالة الجزيئات بعد الانتهاء
      const particleTimer = setTimeout(() => {
        setParticles([]);
      }, 3000);

      // استدعاء onComplete
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(particleTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setIsVisible(false);
      setShowContent(false);
      setParticles([]);
    }
  }, [show, showConfetti, createParticles, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-slate-900/95 backdrop-blur-lg',
        'animate-fadeInScale',
        className
      )}
    >
      {/* الجزيئات */}
      {showConfetti && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall ${particle.duration}s ease-out ${particle.delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      {/* المحتوى الرئيسي */}
      <div className="relative text-center px-8 max-w-md">
        {/* دائرة النجاح */}
        <div className="relative mx-auto mb-8">
          {/* الدوائر المتحركة */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-32 h-32 rounded-full border-4 border-emerald-500/30"
              style={{
                animation: 'circleExpand 1s ease-out forwards',
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-32 h-32 rounded-full border-4 border-emerald-500/20"
              style={{
                animation: 'circleExpand 1s ease-out 0.2s forwards',
              }}
            />
          </div>

          {/* الدائرة الرئيسية */}
          <div
            className={cn(
              'relative w-32 h-32 mx-auto rounded-full',
              'bg-gradient-to-br from-emerald-500 to-green-600',
              'flex items-center justify-center',
              'shadow-2xl shadow-emerald-500/50',
              showContent ? 'animate-bounce' : 'scale-0'
            )}
            style={{
              transition: 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            }}
          >
            <Check
              className={cn(
                'w-16 h-16 text-white',
                showContent && 'animate-checkmark'
              )}
              strokeWidth={3}
            />
          </div>

          {/* النجوم المتلألئة */}
          <Sparkles
            className="absolute -top-4 -right-4 w-8 h-8 text-amber-400 animate-float"
            style={{ animationDelay: '0.2s' }}
          />
          <Sparkles
            className="absolute -bottom-2 -left-4 w-6 h-6 text-cyan-400 animate-float"
            style={{ animationDelay: '0.5s' }}
          />
        </div>

        {/* العنوان */}
        <h1
          className={cn(
            'text-3xl font-bold mb-4',
            'bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent',
            showContent ? 'animate-fadeInUp' : 'opacity-0'
          )}
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          {title}
        </h1>

        {/* العنوان الفرعي */}
        <p
          className={cn(
            'text-lg text-slate-300 mb-6',
            showContent ? 'animate-fadeInUp' : 'opacity-0'
          )}
          style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
        >
          {subtitle}
        </p>

        {/* رقم الطلب */}
        {orderNumber && (
          <div
            className={cn(
              'inline-flex items-center gap-3 px-6 py-3 rounded-xl',
              'bg-slate-800/80 border border-slate-700',
              showContent ? 'animate-fadeInUp' : 'opacity-0'
            )}
            style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}
          >
            <Package className="w-5 h-5 text-cyan-400" />
            <div className="text-right">
              <p className="text-xs text-slate-400">رقم الطلب</p>
              <p className="font-mono font-bold text-cyan-400">{orderNumber}</p>
            </div>
          </div>
        )}

        {/* رسالة إضافية */}
        <p
          className={cn(
            'mt-8 text-sm text-slate-400',
            showContent ? 'animate-fadeInUp' : 'opacity-0'
          )}
          style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}
        >
          سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني
        </p>
      </div>

      {/* تأثير الإضاءة الخلفية */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            animation: 'pulseGlow 3s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

// مكون أنيميشن الشاحنة
interface TruckAnimationProps {
  show: boolean;
  progress?: number; // 0-100
  className?: string;
}

export function TruckAnimation({
  show,
  progress = 0,
  className,
}: TruckAnimationProps) {
  if (!show) return null;

  return (
    <div className={cn('relative h-16 overflow-hidden', className)}>
      {/* المسار */}
      <div className="absolute bottom-4 left-0 right-0 h-1 bg-slate-700 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* الشاحنة */}
      <div
        className="absolute bottom-2 transition-all duration-500"
        style={{ left: `calc(${progress}% - 24px)` }}
      >
        <svg
          className="w-12 h-12 text-cyan-400 animate-float"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 3h15v13H1z" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>

      {/* النقاط */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4">
        {[0, 25, 50, 75, 100].map((point) => (
          <div
            key={point}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              progress >= point
                ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                : 'bg-slate-600'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default SuccessAnimation;
