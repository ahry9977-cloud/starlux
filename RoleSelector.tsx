import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Store, Check, ArrowRight } from 'lucide-react';
import './auth-animations.css';

export type UserRole = 'buyer' | 'seller';

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
  selectedRole?: UserRole;
  disabled?: boolean;
}

export function RoleSelector({ onRoleSelect, selectedRole, disabled }: RoleSelectorProps) {
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  const handleSelect = useCallback((role: UserRole) => {
    if (!disabled) {
      onRoleSelect(role);
    }
  }, [disabled, onRoleSelect]);

  const roles = [
    {
      id: 'buyer' as UserRole,
      title: 'مشتري',
      titleEn: 'Buyer',
      description: 'تسوق من آلاف المنتجات',
      icon: ShoppingBag,
      color: 'from-cyan-500 to-blue-600',
      glowColor: 'rgba(6, 182, 212, 0.5)',
      features: ['تصفح المنتجات', 'سلة التسوق', 'تتبع الطلبات', 'التقييم والمراجعات']
    },
    {
      id: 'seller' as UserRole,
      title: 'بائع',
      titleEn: 'Seller',
      description: 'ابدأ متجرك الآن',
      icon: Store,
      color: 'from-purple-500 to-pink-600',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      features: ['إنشاء متجر', 'إدارة المنتجات', 'تحليلات المبيعات', 'دعم العملاء']
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">اختر نوع حسابك</h2>
        <p className="text-gray-400">حدد الدور المناسب لك للمتابعة</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role, index) => {
          const isSelected = selectedRole === role.id;
          const isHovered = hoveredRole === role.id;
          const Icon = role.icon;

          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <motion.button
                onClick={() => handleSelect(role.id)}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
                disabled={disabled}
                className={`
                  relative w-full p-6 rounded-2xl border-2 transition-all duration-300
                  ${isSelected 
                    ? 'border-transparent bg-gradient-to-br ' + role.color 
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                whileHover={!disabled ? { scale: 1.02, y: -5 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
                style={{
                  boxShadow: isSelected || isHovered 
                    ? `0 0 40px ${role.glowColor}` 
                    : 'none'
                }}
              >
                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-gray-900" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div className={`
                  w-16 h-16 rounded-xl mb-4 flex items-center justify-center mx-auto
                  ${isSelected ? 'bg-white/20' : 'bg-gradient-to-br ' + role.color}
                `}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-white'}`} />
                </div>

                {/* Title */}
                <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-white'}`}>
                  {role.title}
                </h3>
                <p className={`text-sm mb-4 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  {role.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {role.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className={`flex items-center gap-2 text-sm ${isSelected ? 'text-white/90' : 'text-gray-400'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-cyan-500'}`} />
                      {feature}
                    </motion.div>
                  ))}
                </div>

                {/* Hover glow effect */}
                {(isHovered || isSelected) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${role.glowColor} 0%, transparent 70%)`,
                      filter: 'blur(20px)',
                      zIndex: -1
                    }}
                  />
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button */}
      <AnimatePresence>
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 text-center"
          >
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-semibold flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              متابعة كـ {selectedRole === 'buyer' ? 'مشتري' : 'بائع'}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RoleSelector;
