import { useState, useRef, useEffect } from 'react';

interface StarProps {
  index: number;
  filled: number; // 0 = empty, 0.5 = half, 1 = full
  size?: number;
  interactive?: boolean;
  onHover?: (index: number, isHalf: boolean) => void;
  onClick?: (index: number, isHalf: boolean) => void;
  onLeave?: () => void;
  color?: string;
  emptyColor?: string;
  glowColor?: string;
  animated?: boolean;
  delay?: number;
}

export function Star({
  index,
  filled,
  size = 32,
  interactive = false,
  onHover,
  onClick,
  onLeave,
  color = '#FFD700',
  emptyColor = '#E5E7EB',
  glowColor = 'rgba(255, 215, 0, 0.6)',
  animated = true,
  delay = 0,
}: StarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const starRef = useRef<SVGSVGElement>(null);

  // تأثير الظهور المتأخر
  const [isVisible, setIsVisible] = useState(!animated);
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [animated, delay]);

  // معالجة الـ hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !starRef.current) return;
    
    const rect = starRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    
    setIsHovered(true);
    onHover?.(index, isHalf);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onLeave?.();
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !starRef.current) return;
    
    const rect = starRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    
    setIsClicked(true);
    setShowRipple(true);
    
    onClick?.(index, isHalf);
    
    // إزالة تأثير النقر
    setTimeout(() => setIsClicked(false), 300);
    setTimeout(() => setShowRipple(false), 600);
  };

  // حساب التدرج
  const gradientId = `star-gradient-${index}`;
  const glowId = `star-glow-${index}`;
  
  // تحديد نسبة الملء
  const fillPercentage = filled * 100;

  return (
    <div 
      className="relative inline-block"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(10px)',
        transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      {/* تأثير الموجة عند النقر */}
      {showRipple && (
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: glowColor,
            opacity: 0.5,
          }}
        />
      )}
      
      <svg
        ref={starRef}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`
          ${interactive ? 'cursor-pointer' : ''}
          transition-all duration-300 ease-out
        `}
        style={{
          filter: (filled > 0 || isHovered) ? `drop-shadow(0 0 ${isHovered ? 12 : 8}px ${glowColor})` : 'none',
          transform: `scale(${isClicked ? 1.3 : isHovered ? 1.15 : 1})`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <defs>
          {/* تدرج الملء */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset={`${fillPercentage}%`} stopColor={color} />
            <stop offset={`${fillPercentage}%`} stopColor={emptyColor} />
          </linearGradient>
          
          {/* تأثير التوهج */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* تدرج ذهبي للنجمة الممتلئة */}
          <linearGradient id={`${gradientId}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        
        {/* خلفية النجمة (فارغة) */}
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={emptyColor}
          stroke={filled > 0 ? color : '#D1D5DB'}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        
        {/* النجمة الممتلئة مع القناع */}
        {filled > 0 && (
          <clipPath id={`clip-${index}`}>
            <rect x="0" y="0" width={`${fillPercentage}%`} height="100%" />
          </clipPath>
        )}
        
        {filled > 0 && (
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#${gradientId}-gold)`}
            stroke={color}
            strokeWidth="0.5"
            strokeLinejoin="round"
            clipPath={`url(#clip-${index})`}
            filter={`url(#${glowId})`}
            style={{
              animation: filled === 1 && animated ? 'starPulse 2s ease-in-out infinite' : 'none',
            }}
          />
        )}
        
        {/* تأثير اللمعان */}
        {filled === 1 && (
          <ellipse
            cx="10"
            cy="8"
            rx="2"
            ry="1.5"
            fill="rgba(255, 255, 255, 0.4)"
            style={{
              animation: animated ? 'starShine 3s ease-in-out infinite' : 'none',
            }}
          />
        )}
      </svg>
      
      <style>{`
        @keyframes starPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        
        @keyframes starShine {
          0%, 100% { opacity: 0.4; transform: translate(0, 0); }
          50% { opacity: 0.7; transform: translate(1px, -1px); }
        }
      `}</style>
    </div>
  );
}

export default Star;
