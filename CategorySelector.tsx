import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shirt, Smartphone, Home, Car, Utensils,
  Check, ChevronRight
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subcategories: string[];
}

const MAIN_CATEGORIES: Category[] = [
  {
    id: 'fashion',
    name: 'الأزياء والملابس',
    nameEn: 'Fashion',
    icon: Shirt,
    color: 'from-pink-500 to-rose-600',
    subcategories: ['ملابس رجالية', 'ملابس نسائية', 'ملابس أطفال', 'أحذية', 'إكسسوارات']
  },
  {
    id: 'electronics',
    name: 'الإلكترونيات',
    nameEn: 'Electronics',
    icon: Smartphone,
    color: 'from-blue-500 to-indigo-600',
    subcategories: ['هواتف', 'لابتوب', 'أجهزة منزلية', 'كاميرات', 'ألعاب']
  },
  {
    id: 'home',
    name: 'المنزل والحديقة',
    nameEn: 'Home & Garden',
    icon: Home,
    color: 'from-green-500 to-emerald-600',
    subcategories: ['أثاث', 'ديكور', 'مطبخ', 'حديقة', 'إضاءة']
  },
  {
    id: 'automotive',
    name: 'السيارات',
    nameEn: 'Automotive',
    icon: Car,
    color: 'from-orange-500 to-amber-600',
    subcategories: ['قطع غيار', 'إكسسوارات', 'زيوت', 'إطارات', 'أدوات']
  },
  {
    id: 'food',
    name: 'الطعام والمشروبات',
    nameEn: 'Food & Beverages',
    icon: Utensils,
    color: 'from-red-500 to-orange-600',
    subcategories: ['مأكولات', 'مشروبات', 'حلويات', 'منتجات عضوية', 'توابل']
  }
];

interface CategorySelectorProps {
  onCategorySelect: (category: Category, subcategories: string[]) => void;
  selectedCategory?: Category;
  selectedSubcategories?: string[];
  disabled?: boolean;
}

export function CategorySelector({ 
  onCategorySelect, 
  selectedCategory, 
  selectedSubcategories = [],
  disabled 
}: CategorySelectorProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [localSelectedSubs, setLocalSelectedSubs] = useState<string[]>(selectedSubcategories);

  const handleCategorySelect = useCallback((category: Category) => {
    if (!disabled) {
      setLocalSelectedSubs([]);
      onCategorySelect(category, []);
    }
  }, [disabled, onCategorySelect]);

  const handleSubcategoryToggle = useCallback((sub: string) => {
    if (!disabled && selectedCategory) {
      const newSubs = localSelectedSubs.includes(sub)
        ? localSelectedSubs.filter(s => s !== sub)
        : [...localSelectedSubs, sub];
      setLocalSelectedSubs(newSubs);
      onCategorySelect(selectedCategory, newSubs);
    }
  }, [disabled, selectedCategory, localSelectedSubs, onCategorySelect]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">اختر فئة متجرك</h2>
        <p className="text-gray-400">حدد الفئة الرئيسية لمنتجاتك</p>
      </motion.div>

      {/* Main Categories */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {MAIN_CATEGORIES.map((category, index) => {
          const isSelected = selectedCategory?.id === category.id;
          const isHovered = hoveredCategory === category.id;
          const Icon = category.icon;

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCategorySelect(category)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              disabled={disabled}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300
                ${isSelected 
                  ? 'border-transparent bg-gradient-to-br ' + category.color 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              whileHover={!disabled ? { scale: 1.05, y: -3 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
            >
              {/* Selection indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-gray-900" />
                  </motion.div>
                )}
              </AnimatePresence>

              <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                {category.name}
              </p>

              {/* Glow effect */}
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, currentColor 0%, transparent 70%)`,
                    filter: 'blur(15px)',
                    zIndex: -1
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Subcategories */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-cyan-500" />
                الفئات الفرعية لـ {selectedCategory.name}
              </h3>
              <div className="flex flex-wrap gap-3">
                {selectedCategory.subcategories.map((sub, index) => {
                  const isSubSelected = localSelectedSubs.includes(sub);
                  return (
                    <motion.button
                      key={sub}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSubcategoryToggle(sub)}
                      disabled={disabled}
                      className={`
                        px-4 py-2 rounded-lg border transition-all duration-200
                        ${isSubSelected 
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      whileHover={!disabled ? { scale: 1.05 } : {}}
                      whileTap={!disabled ? { scale: 0.95 } : {}}
                    >
                      {isSubSelected && <Check className="w-4 h-4 inline mr-1" />}
                      {sub}
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-gray-500 text-sm mt-4">
                اختر فئة فرعية واحدة أو أكثر (اختياري)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CategorySelector;
