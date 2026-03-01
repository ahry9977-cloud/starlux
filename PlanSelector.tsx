import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Star, Crown, Users, Zap, Shield, 
  BarChart3, Headphones, Lock
} from 'lucide-react';

export type PlanType = 'free' | 'pro' | 'community';

export interface Plan {
  id: PlanType;
  name: string;
  nameEn: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresPayment: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'مجاني',
    nameEn: 'Free',
    price: 0,
    currency: 'USD',
    period: 'شهرياً',
    description: 'ابدأ مجاناً',
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    requiresPayment: false,
    features: [
      'حتى 10 منتجات',
      'لوحة تحكم أساسية',
      'دعم عبر البريد',
      'عمولة 8%'
    ]
  },
  {
    id: 'pro',
    name: 'احترافي',
    nameEn: 'Pro',
    price: 29,
    currency: 'USD',
    period: 'شهرياً',
    description: 'للمتاجر المتوسطة',
    icon: Star,
    color: 'from-cyan-500 to-blue-600',
    highlighted: true,
    requiresPayment: true,
    features: [
      'منتجات غير محدودة',
      'تحليلات متقدمة',
      'دعم أولوية 24/7',
      'عمولة 5%',
      'شارة PRO',
      'تخصيص المتجر'
    ]
  },
  {
    id: 'community',
    name: 'مجتمعي',
    nameEn: 'Community',
    price: 99,
    currency: 'USD',
    period: 'شهرياً',
    description: 'للعلامات التجارية',
    icon: Crown,
    color: 'from-purple-500 to-pink-600',
    requiresPayment: true,
    features: [
      'كل مميزات Pro',
      'عمولة 3%',
      'مدير حساب مخصص',
      'API كامل',
      'تقارير مخصصة',
      'أولوية في البحث',
      'شارة VERIFIED'
    ]
  }
];

interface PlanSelectorProps {
  onPlanSelect: (plan: Plan) => void;
  selectedPlan?: Plan;
  disabled?: boolean;
}

export function PlanSelector({ onPlanSelect, selectedPlan, disabled }: PlanSelectorProps) {
  const [hoveredPlan, setHoveredPlan] = useState<PlanType | null>(null);

  const handleSelect = useCallback((plan: Plan) => {
    if (!disabled) {
      onPlanSelect(plan);
    }
  }, [disabled, onPlanSelect]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">اختر خطة الاشتراك</h2>
        <p className="text-gray-400">حدد الخطة المناسبة لحجم أعمالك</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan, index) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isHovered = hoveredPlan === plan.id;
          const Icon = plan.icon;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${plan.highlighted ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                >
                  <span className="px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white text-sm font-medium">
                    الأكثر شعبية
                  </span>
                </motion.div>
              )}

              <motion.button
                onClick={() => handleSelect(plan)}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                disabled={disabled}
                className={`
                  relative w-full p-6 rounded-2xl border-2 transition-all duration-300 text-right
                  ${isSelected 
                    ? 'border-transparent bg-gradient-to-br ' + plan.color 
                    : plan.highlighted 
                      ? 'border-cyan-500/50 bg-gray-800/80' 
                      : 'border-gray-700 bg-gray-800/50'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-600'}
                `}
                whileHover={!disabled ? { scale: 1.02, y: -5 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
              >
                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-gray-900" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl mb-4 flex items-center justify-center
                  ${isSelected ? 'bg-white/20' : 'bg-gradient-to-br ' + plan.color}
                `}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Plan name */}
                <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${isSelected ? 'text-white' : 'text-white'}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                    /{plan.period}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className={`flex items-center gap-2 text-sm ${isSelected ? 'text-white/90' : 'text-gray-400'}`}
                    >
                      <Check className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-cyan-500'}`} />
                      {feature}
                    </motion.div>
                  ))}
                </div>

                {/* Payment required indicator */}
                {plan.requiresPayment && (
                  <div className={`mt-4 pt-4 border-t ${isSelected ? 'border-white/20' : 'border-gray-700'}`}>
                    <div className={`flex items-center gap-2 text-xs ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                      <Lock className="w-3 h-3" />
                      يتطلب الدفع للتفعيل
                    </div>
                  </div>
                )}

                {/* Glow effect */}
                {(isHovered || isSelected) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, currentColor 0%, transparent 70%)`,
                      filter: 'blur(25px)',
                      zIndex: -1
                    }}
                  />
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Payment notice */}
      <AnimatePresence>
        {selectedPlan?.requiresPayment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-500" />
              <div>
                <p className="text-amber-400 font-medium">الدفع مطلوب للمتابعة</p>
                <p className="text-gray-400 text-sm">
                  ستتم إعادة توجيهك لصفحة الدفع الآمنة بعد إكمال التسجيل
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlanSelector;
