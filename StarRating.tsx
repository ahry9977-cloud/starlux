import { useState, useCallback, useMemo } from 'react';
import { Star } from './Star';

interface StarRatingProps {
  value?: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  allowHalf?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  color?: string;
  emptyColor?: string;
  glowColor?: string;
  animated?: boolean;
  label?: string;
  className?: string;
}

export function StarRating({
  value = 0,
  maxStars = 5,
  size = 32,
  interactive = false,
  allowHalf = true,
  onChange,
  showValue = false,
  showCount = false,
  count = 0,
  color = '#FFD700',
  emptyColor = '#E5E7EB',
  glowColor = 'rgba(255, 215, 0, 0.6)',
  animated = true,
  label,
  className = '',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  // حساب القيمة المعروضة
  const displayValue = hoverValue !== null ? hoverValue : value;
  
  // معالجة الـ hover
  const handleHover = useCallback((index: number, isHalf: boolean) => {
    if (!interactive) return;
    const newValue = allowHalf && isHalf ? index + 0.5 : index + 1;
    setHoverValue(newValue);
  }, [interactive, allowHalf]);
  
  // معالجة النقر
  const handleClick = useCallback((index: number, isHalf: boolean) => {
    if (!interactive || !onChange) return;
    const newValue = allowHalf && isHalf ? index + 0.5 : index + 1;
    onChange(newValue);
  }, [interactive, allowHalf, onChange]);
  
  // معالجة مغادرة الماوس
  const handleLeave = useCallback(() => {
    setHoverValue(null);
  }, []);
  
  // إنشاء النجوم
  const stars = useMemo(() => {
    return Array.from({ length: maxStars }, (_, index) => {
      let filled = 0;
      if (displayValue >= index + 1) {
        filled = 1;
      } else if (displayValue > index) {
        filled = displayValue - index;
      }
      
      return (
        <Star
          key={index}
          index={index}
          filled={filled}
          size={size}
          interactive={interactive}
          onHover={handleHover}
          onClick={handleClick}
          onLeave={handleLeave}
          color={color}
          emptyColor={emptyColor}
          glowColor={glowColor}
          animated={animated}
          delay={animated ? index * 100 : 0}
        />
      );
    });
  }, [maxStars, displayValue, size, interactive, handleHover, handleClick, handleLeave, color, emptyColor, glowColor, animated]);
  
  return (
    <div className={`inline-flex flex-col ${className}`}>
      {label && (
        <span className="text-sm text-muted-foreground mb-1">{label}</span>
      )}
      <div className="flex items-center gap-1">
        <div 
          className="flex items-center gap-0.5"
          onMouseLeave={handleLeave}
        >
          {stars}
        </div>
        
        {showValue && (
          <span 
            className="mr-2 text-lg font-bold transition-all duration-300"
            style={{ 
              color: displayValue >= 4 ? '#22C55E' : displayValue >= 3 ? '#EAB308' : '#EF4444',
              textShadow: `0 0 10px ${displayValue >= 4 ? 'rgba(34, 197, 94, 0.5)' : displayValue >= 3 ? 'rgba(234, 179, 8, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
            }}
          >
            {displayValue.toFixed(1)}
          </span>
        )}
        
        {showCount && count > 0 && (
          <span className="text-sm text-muted-foreground">
            ({count.toLocaleString('ar-EG')} تقييم)
          </span>
        )}
      </div>
    </div>
  );
}

export default StarRating;
