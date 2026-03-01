import { cn } from '@/lib/utils';
import { Check, Package, CreditCard, Truck, CheckCircle2 } from 'lucide-react';
import './animations.css';

export interface Step {
  id: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  animated?: boolean;
}

// الأيقونات الافتراضية للخطوات
const defaultIcons = [
  <Package key="cart" className="w-5 h-5" />,
  <Truck key="shipping" className="w-5 h-5" />,
  <CreditCard key="payment" className="w-5 h-5" />,
  <CheckCircle2 key="confirm" className="w-5 h-5" />,
];

export function ProgressIndicator({
  steps,
  currentStep,
  className,
  variant = 'horizontal',
  showLabels = true,
  animated = true,
}: ProgressIndicatorProps) {
  const isHorizontal = variant === 'horizontal';

  return (
    <div
      className={cn(
        'relative',
        isHorizontal ? 'flex items-center justify-between' : 'flex flex-col gap-4',
        className
      )}
    >
      {/* خط التقدم الخلفي */}
      {isHorizontal && (
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-700/50 rounded-full -z-10">
          <div
            className={cn(
              'h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-700 ease-out',
              animated && 'animate-pulseGlow'
            )}
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
      )}

      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isPending = stepNumber > currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-3',
              isHorizontal ? 'flex-col' : 'flex-row',
              animated && 'animate-fadeInUp',
              animated && `stagger-${index + 1}`
            )}
            style={{ animationFillMode: 'both' }}
          >
            {/* دائرة الخطوة */}
            <div
              className={cn(
                'step-indicator relative flex items-center justify-center',
                'w-10 h-10 rounded-full font-bold text-sm',
                'transition-all duration-500 ease-out',
                isCompleted && 'step-completed bg-emerald-500',
                isActive && 'step-active',
                isPending && 'step-pending'
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5 text-white animate-fadeInScale" />
              ) : (
                <span className={cn(
                  'flex items-center justify-center',
                  isActive && 'text-white',
                  isPending && 'text-slate-400'
                )}>
                  {step.icon || defaultIcons[index] || stepNumber}
                </span>
              )}

              {/* تأثير التوهج للخطوة النشطة */}
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
                  <div className="absolute inset-[-4px] rounded-full border-2 border-cyan-400/30 animate-pulse" />
                </>
              )}
            </div>

            {/* التسمية */}
            {showLabels && (
              <div
                className={cn(
                  'text-center transition-all duration-300',
                  isHorizontal ? 'mt-2' : 'flex-1',
                  isCompleted && 'text-emerald-400',
                  isActive && 'text-cyan-400',
                  isPending && 'text-slate-500'
                )}
              >
                <p
                  className={cn(
                    'font-semibold text-sm',
                    isActive && 'animate-neonPulse'
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs mt-0.5 opacity-70">
                    {step.description}
                  </p>
                )}
              </div>
            )}

            {/* خط الربط (للعرض العمودي) */}
            {!isHorizontal && index < steps.length - 1 && (
              <div
                className={cn(
                  'absolute right-5 top-12 w-0.5 h-8',
                  'transition-all duration-500',
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-700'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// مكون شريط التقدم البسيط
interface SimpleProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function SimpleProgressBar({
  progress,
  className,
  showPercentage = false,
  animated = true,
  color = 'primary',
}: SimpleProgressBarProps) {
  const colorClasses = {
    primary: 'from-cyan-500 to-purple-600',
    success: 'from-emerald-500 to-green-600',
    warning: 'from-amber-500 to-orange-600',
    error: 'from-red-500 to-rose-600',
  };

  return (
    <div className={cn('relative', className)}>
      <div className="progress-container h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'progress-bar h-full bg-gradient-to-r rounded-full',
            colorClasses[color],
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {animated && (
            <div className="progress-glow absolute top-0 right-0 w-8 h-full bg-gradient-to-r from-transparent to-white/30" />
          )}
        </div>
      </div>
      {showPercentage && (
        <span className="absolute -top-6 right-0 text-xs text-slate-400">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

// مكون التقدم الدائري
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 6,
  className,
  showPercentage = true,
  animated = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* الخلفية */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700/50"
        />
        {/* التقدم */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            animated && 'transition-all duration-700 ease-out'
          )}
        />
        {/* التدرج */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      
      {showPercentage && (
        <span className="absolute text-lg font-bold text-white">
          {Math.round(progress)}%
        </span>
      )}
      
      {/* تأثير التوهج */}
      {animated && progress > 0 && (
        <div
          className="absolute inset-0 rounded-full animate-pulseGlow opacity-30"
          style={{
            background: `conic-gradient(from 0deg, transparent ${100 - progress}%, rgba(6, 182, 212, 0.3) ${100 - progress}%)`,
          }}
        />
      )}
    </div>
  );
}

export default ProgressIndicator;
