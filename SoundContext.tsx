/**
 * STAR LUX - Sound Context Provider
 * 
 * يوفر نظام الأصوات لجميع المكونات في التطبيق
 * - تسجيل التفاعل الأول تلقائياً
 * - توفير الإعدادات لجميع المكونات
 * - التوافق مع جميع الأجهزة
 */

import React, { createContext, useContext, useEffect, useCallback, useState, memo } from 'react';
import {
  playSound,
  registerUserInteraction,
  isSoundEnabled,
  getVolume,
  setSoundEnabled,
  setVolume,
  toggleSound,
  type SoundType,
} from '@/lib/soundSystem';

interface SoundContextValue {
  play: (type: SoundType) => void;
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggle: () => boolean;
}

const SoundContext = createContext<SoundContextValue | null>(null);

interface SoundProviderProps {
  children: React.ReactNode;
}

/**
 * Provider لنظام الأصوات
 */
export const SoundProvider: React.FC<SoundProviderProps> = memo(({ children }) => {
  const [enabled, setEnabledState] = useState(isSoundEnabled);
  const [volumeState, setVolumeState] = useState(getVolume);

  // تسجيل التفاعل الأول
  useEffect(() => {
    const handleInteraction = () => {
      registerUserInteraction();
    };

    // الاستماع لأحداث التفاعل
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  // تشغيل صوت
  const play = useCallback((type: SoundType) => {
    playSound(type);
  }, []);

  // تفعيل/تعطيل
  const setEnabled = useCallback((value: boolean) => {
    setSoundEnabled(value);
    setEnabledState(value);
  }, []);

  // تعيين مستوى الصوت
  const setVolumeLevel = useCallback((value: number) => {
    setVolume(value);
    setVolumeState(value);
  }, []);

  // تبديل
  const toggle = useCallback(() => {
    const newState = toggleSound();
    setEnabledState(newState);
    return newState;
  }, []);

  const value: SoundContextValue = {
    play,
    enabled,
    volume: volumeState,
    setEnabled,
    setVolume: setVolumeLevel,
    toggle,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
});

SoundProvider.displayName = 'SoundProvider';

/**
 * Hook لاستخدام نظام الأصوات
 */
export function useSoundContext(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) {
    // إرجاع قيم افتراضية إذا لم يكن هناك Provider
    return {
      play: () => {},
      enabled: false,
      volume: 0.5,
      setEnabled: () => {},
      setVolume: () => {},
      toggle: () => false,
    };
  }
  return context;
}

export default SoundProvider;
