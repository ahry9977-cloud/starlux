import { useMemo, useEffect, useState } from 'react';

interface RatingDistributionProps {
  distribution: {
    count5Stars: number;
    count4Stars: number;
    count3Stars: number;
    count2Stars: number;
    count1Star: number;
  };
  totalRatings: number;
  onFilterClick?: (stars: number) => void;
  activeFilter?: number | null;
  animated?: boolean;
}

export function RatingDistribution({
  distribution,
  totalRatings,
  onFilterClick,
  activeFilter = null,
  animated = true,
}: RatingDistributionProps) {
  const [isVisible, setIsVisible] = useState(!animated);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);
  
  // حساب النسب المئوية
  const percentages = useMemo(() => {
    if (totalRatings === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }
    return {
      5: (distribution.count5Stars / totalRatings) * 100,
      4: (distribution.count4Stars / totalRatings) * 100,
      3: (distribution.count3Stars / totalRatings) * 100,
      2: (distribution.count2Stars / totalRatings) * 100,
      1: (distribution.count1Star / totalRatings) * 100,
    };
  }, [distribution, totalRatings]);
  
  // ألوان الأشرطة
  const barColors = {
    5: 'from-emerald-400 to-emerald-600',
    4: 'from-lime-400 to-lime-600',
    3: 'from-yellow-400 to-yellow-600',
    2: 'from-orange-400 to-orange-600',
    1: 'from-red-400 to-red-600',
  };
  
  const glowColors = {
    5: 'rgba(52, 211, 153, 0.4)',
    4: 'rgba(163, 230, 53, 0.4)',
    3: 'rgba(250, 204, 21, 0.4)',
    2: 'rgba(251, 146, 60, 0.4)',
    1: 'rgba(248, 113, 113, 0.4)',
  };
  
  const counts = {
    5: distribution.count5Stars,
    4: distribution.count4Stars,
    3: distribution.count3Stars,
    2: distribution.count2Stars,
    1: distribution.count1Star,
  };
  
  return (
    <div className="space-y-2">
      {([5, 4, 3, 2, 1] as const).map((stars, index) => (
        <div
          key={stars}
          className={`
            flex items-center gap-3 p-2 rounded-lg transition-all duration-300
            ${onFilterClick ? 'cursor-pointer hover:bg-accent/50' : ''}
            ${activeFilter === stars ? 'bg-accent ring-2 ring-primary' : ''}
          `}
          onClick={() => onFilterClick?.(stars)}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
            transition: `all 0.4s ease-out ${index * 100}ms`,
          }}
        >
          {/* عدد النجوم */}
          <div className="flex items-center gap-1 w-16 shrink-0">
            <span className="text-sm font-medium">{stars}</span>
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          
          {/* شريط التقدم */}
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden relative">
            <div
              className={`
                h-full rounded-full bg-gradient-to-r ${barColors[stars]}
                transition-all duration-1000 ease-out
              `}
              style={{
                width: isVisible ? `${percentages[stars]}%` : '0%',
                boxShadow: percentages[stars] > 0 ? `0 0 10px ${glowColors[stars]}` : 'none',
              }}
            />
            
            {/* تأثير اللمعان */}
            {percentages[stars] > 0 && (
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                  animation: 'shimmer 2s infinite',
                }}
              />
            )}
          </div>
          
          {/* العدد والنسبة */}
          <div className="w-20 text-left shrink-0">
            <span className="text-sm font-medium">{counts[stars].toLocaleString('ar-EG')}</span>
            <span className="text-xs text-muted-foreground mr-1">
              ({percentages[stars].toFixed(0)}%)
            </span>
          </div>
        </div>
      ))}
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default RatingDistribution;
