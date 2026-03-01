import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, CreditCard as CardIcon } from 'lucide-react';
import './card-animations.css';

// أنواع البطاقات المدعومة
export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

interface CreditCardVisualProps {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  isFlipped?: boolean;
  isFocused?: 'number' | 'holder' | 'expiry' | 'cvv' | null;
  className?: string;
}

// دالة تحديد نوع البطاقة
export function detectCardType(number: string): CardType {
  const cleanNumber = number.replace(/\s/g, '');
  
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
  
  return 'unknown';
}

// ألوان البطاقات
const CARD_COLORS: Record<CardType, { primary: string; secondary: string; accent: string }> = {
  visa: {
    primary: 'from-blue-600 via-blue-500 to-cyan-400',
    secondary: 'from-blue-700 to-blue-900',
    accent: '#1A1F71',
  },
  mastercard: {
    primary: 'from-orange-500 via-red-500 to-yellow-400',
    secondary: 'from-red-700 to-orange-900',
    accent: '#EB001B',
  },
  amex: {
    primary: 'from-slate-400 via-slate-300 to-slate-200',
    secondary: 'from-slate-600 to-slate-800',
    accent: '#006FCF',
  },
  discover: {
    primary: 'from-orange-400 via-orange-300 to-yellow-200',
    secondary: 'from-orange-600 to-orange-800',
    accent: '#FF6000',
  },
  unknown: {
    primary: 'from-cyan-500 via-purple-500 to-pink-500',
    secondary: 'from-slate-700 to-slate-900',
    accent: '#06B6D4',
  },
};

// شعارات البطاقات
function CardLogo({ type }: { type: CardType }) {
  switch (type) {
    case 'visa':
      return (
        <svg viewBox="0 0 50 16" className="h-8 w-auto">
          <text x="0" y="14" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="16">VISA</text>
        </svg>
      );
    case 'mastercard':
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-red-500 opacity-90" />
          <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-90 -ml-4" />
        </div>
      );
    case 'amex':
      return (
        <div className="text-white font-bold text-sm">AMEX</div>
      );
    case 'discover':
      return (
        <div className="text-white font-bold text-sm">DISCOVER</div>
      );
    default:
      return <CardIcon className="w-8 h-8 text-white/80" />;
  }
}

// مكون الشريحة
function CardChip() {
  return (
    <div className="relative w-12 h-9 rounded-md overflow-hidden">
      {/* الشريحة الذهبية */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-md" />
      {/* خطوط الشريحة */}
      <div className="absolute inset-0 flex flex-col justify-center gap-1 px-1">
        <div className="h-px bg-yellow-700/30" />
        <div className="h-px bg-yellow-700/30" />
        <div className="h-px bg-yellow-700/30" />
        <div className="h-px bg-yellow-700/30" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-5 border border-yellow-700/30 rounded-sm" />
      </div>
    </div>
  );
}

// مكون NFC
function NFCIcon() {
  return (
    <div className="relative">
      <Wifi className="w-6 h-6 text-white/60 rotate-90" />
    </div>
  );
}

export function CreditCardVisual({
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
  isFlipped = false,
  isFocused,
  className,
}: CreditCardVisualProps) {
  const [cardType, setCardType] = useState<CardType>('unknown');
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // تحديث نوع البطاقة
  useEffect(() => {
    setCardType(detectCardType(cardNumber));
  }, [cardNumber]);

  // تأثير الحركة عند تحريك الماوس
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // تنسيق رقم البطاقة
  const formatCardNumber = (num: string) => {
    const clean = num.replace(/\s/g, '');
    const groups = clean.match(/.{1,4}/g) || [];
    return groups.join(' ').padEnd(19, '•');
  };

  // تنسيق تاريخ الانتهاء
  const formatExpiry = (exp: string) => {
    if (!exp) return '••/••';
    return exp.padEnd(5, '•');
  };

  const colors = CARD_COLORS[cardType];

  return (
    <div
      className={cn(
        'card-container perspective-1000',
        className
      )}
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        className={cn(
          'relative w-[380px] h-[240px] transition-all duration-700 ease-out',
          'transform-style-3d cursor-pointer',
          isFlipped && 'rotate-y-180'
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped 
            ? 'rotateY(180deg)' 
            : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* الوجه الأمامي */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl overflow-hidden',
            'backface-hidden shadow-2xl',
            'bg-gradient-to-br',
            colors.primary
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* تأثير اللمعان */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 40%,
                rgba(255,255,255,0.4) 45%,
                rgba(255,255,255,0.4) 50%,
                transparent 55%
              )`,
              backgroundSize: '200% 200%',
              animation: isHovered ? 'shine 1.5s ease-in-out' : 'none',
            }}
          />

          {/* النمط الهندسي */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full">
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* المحتوى */}
          <div className="relative h-full p-6 flex flex-col justify-between">
            {/* الصف العلوي */}
            <div className="flex items-start justify-between">
              <CardChip />
              <div className="flex items-center gap-3">
                <NFCIcon />
                <CardLogo type={cardType} />
              </div>
            </div>

            {/* رقم البطاقة */}
            <div
              className={cn(
                'text-2xl font-mono tracking-[0.2em] text-white',
                'transition-all duration-300',
                isFocused === 'number' && 'scale-105 text-shadow-glow'
              )}
            >
              {formatCardNumber(cardNumber)}
            </div>

            {/* الصف السفلي */}
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="text-[10px] text-white/60 uppercase tracking-wider">
                  Card Holder
                </div>
                <div
                  className={cn(
                    'text-sm font-medium text-white uppercase tracking-wider',
                    'transition-all duration-300',
                    isFocused === 'holder' && 'text-shadow-glow'
                  )}
                >
                  {cardHolder || 'YOUR NAME'}
                </div>
              </div>

              <div className="space-y-1 text-right">
                <div className="text-[10px] text-white/60 uppercase tracking-wider">
                  Expires
                </div>
                <div
                  className={cn(
                    'text-sm font-medium text-white tracking-wider',
                    'transition-all duration-300',
                    isFocused === 'expiry' && 'text-shadow-glow'
                  )}
                >
                  {formatExpiry(expiryDate)}
                </div>
              </div>
            </div>
          </div>

          {/* تأثير التوهج عند التركيز */}
          {isFocused && (
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: `0 0 30px 5px ${colors.accent}40`,
              }}
            />
          )}
        </div>

        {/* الوجه الخلفي */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl overflow-hidden',
            'backface-hidden shadow-2xl rotate-y-180',
            'bg-gradient-to-br',
            colors.secondary
          )}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* الشريط المغناطيسي */}
          <div className="w-full h-12 bg-slate-900 mt-6" />

          {/* شريط التوقيع و CVV */}
          <div className="px-6 mt-6">
            <div className="flex items-center gap-4">
              {/* شريط التوقيع */}
              <div className="flex-1 h-10 bg-white/90 rounded flex items-center justify-end px-4">
                <div className="text-slate-400 text-xs italic">
                  Authorized Signature
                </div>
              </div>
              
              {/* CVV */}
              <div
                className={cn(
                  'w-16 h-10 bg-white rounded flex items-center justify-center',
                  'font-mono text-lg text-slate-900',
                  'transition-all duration-300',
                  isFocused === 'cvv' && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-800'
                )}
              >
                {cvv || '•••'}
              </div>
            </div>

            {/* نص CVV */}
            <div className="text-right mt-2 text-xs text-white/60">
              CVV / CVC
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center justify-between text-white/40 text-xs">
              <span>This card is property of the issuing bank</span>
              <CardLogo type={cardType} />
            </div>
          </div>

          {/* تأثير التوهج عند التركيز على CVV */}
          {isFocused === 'cvv' && (
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: `0 0 30px 5px ${colors.accent}40`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CreditCardVisual;
