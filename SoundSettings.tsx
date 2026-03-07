/**
 * STAR LUX - Sound Settings Component
 * 
 * مكون إعدادات الصوت للمستخدم
 * - تشغيل/إيقاف الأصوات
 * - التحكم في مستوى الصوت
 * - حفظ التفضيلات تلقائياً
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { useSound } from './useSound';
import { playSound } from '@/lib/soundSystem';
import { cn } from '@/lib/utils';

interface SoundSettingsProps {
  className?: string;
  compact?: boolean;
}

/**
 * أيقونة الصوت
 */
const VolumeIcon = memo(({ muted, volume }: { muted: boolean; volume: number }) => {
  if (muted || volume === 0) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    );
  }
  
  if (volume < 0.5) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    );
  }
  
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
});

VolumeIcon.displayName = 'VolumeIcon';

/**
 * مكون إعدادات الصوت
 */
const SoundSettings: React.FC<SoundSettingsProps> = ({ className, compact = false }) => {
  const { enabled, volume, setEnabled, setVolume, toggle } = useSound();
  const [showSlider, setShowSlider] = useState(false);

  // تشغيل صوت عند تغيير الإعدادات
  const handleToggle = useCallback(() => {
    const newState = toggle();
    if (newState) {
      setTimeout(() => playSound('toggle'), 50);
    }
  }, [toggle]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    playSound('click');
  }, [setVolume]);

  // إغلاق الشريط عند النقر خارجه
  useEffect(() => {
    if (!showSlider) return;
    
    const handleClickOutside = () => setShowSlider(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSlider]);

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
          enabled ? 'text-cyan-400' : 'text-gray-500',
          className
        )}
        title={enabled ? 'إيقاف الأصوات' : 'تشغيل الأصوات'}
      >
        <VolumeIcon muted={!enabled} volume={volume} />
      </button>
    );
  }

  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      {/* زر التبديل */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowSlider(!showSlider);
        }}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
          enabled ? 'text-cyan-400' : 'text-gray-500'
        )}
        title="إعدادات الصوت"
      >
        <VolumeIcon muted={!enabled} volume={volume} />
      </button>

      {/* شريط التحكم */}
      {showSlider && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-2 p-4 bg-gray-800 rounded-xl shadow-xl border border-gray-700 z-50 min-w-[200px]"
        >
          {/* تشغيل/إيقاف */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-300">الأصوات التفاعلية</span>
            <button
              onClick={handleToggle}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                enabled ? 'bg-cyan-500' : 'bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200',
                  enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* مستوى الصوت */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">مستوى الصوت</span>
              <span className="text-sm text-cyan-400">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!enabled}
              className={cn(
                'w-full h-2 rounded-full appearance-none cursor-pointer',
                'bg-gray-600',
                '[&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
                '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500',
                '[&::-webkit-slider-thumb]:cursor-pointer',
                '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
                !enabled && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>

          {/* اختبار الصوت */}
          <button
            onClick={() => playSound('notification')}
            disabled={!enabled}
            className={cn(
              'mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
              'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            اختبار الصوت
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(SoundSettings);
export { SoundSettings };
