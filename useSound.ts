/**
 * STAR LUX - React Hook للأصوات التفاعلية
 * 
 * يوفر واجهة سهلة لاستخدام نظام الأصوات في مكونات React
 */

import { useCallback, useEffect, useState } from 'react';
import {
  playSound,
  setSoundEnabled,
  isSoundEnabled,
  setVolume,
  getVolume,
  toggleSound,
  getSettings,
  updateSettings,
  registerUserInteraction,
  type SoundType,
} from '@/lib/soundSystem';

/**
 * Hook رئيسي لنظام الأصوات
 */
export function useSound() {
  const [enabled, setEnabled] = useState(isSoundEnabled);
  const [volume, setVolumeState] = useState(getVolume);

  // تحديث الحالة عند تغيير الإعدادات
  useEffect(() => {
    const handleStorageChange = () => {
      setEnabled(isSoundEnabled());
      setVolumeState(getVolume());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // تشغيل صوت
  const play = useCallback((type: SoundType) => {
    playSound(type);
  }, []);

  // تفعيل/تعطيل
  const setEnabledState = useCallback((value: boolean) => {
    setSoundEnabled(value);
    setEnabled(value);
  }, []);

  // تعيين مستوى الصوت
  const setVolumeLevel = useCallback((value: number) => {
    setVolume(value);
    setVolumeState(value);
  }, []);

  // تبديل
  const toggle = useCallback(() => {
    const newState = toggleSound();
    setEnabled(newState);
    return newState;
  }, []);

  return {
    play,
    enabled,
    volume,
    setEnabled: setEnabledState,
    setVolume: setVolumeLevel,
    toggle,
    settings: getSettings(),
    updateSettings,
  };
}

/**
 * Hook لأصوات الأزرار
 */
export function useButtonSound(soundType: SoundType = 'click') {
  const { play, enabled } = useSound();

  const handleClick = useCallback(() => {
    if (enabled) play(soundType);
  }, [play, enabled, soundType]);

  const handleHover = useCallback(() => {
    if (enabled) play('hover');
  }, [play, enabled]);

  return {
    onClick: handleClick,
    onMouseEnter: handleHover,
    onTouchStart: handleClick,
  };
}

/**
 * Hook لأصوات النماذج
 */
export function useFormSound() {
  const { play, enabled } = useSound();

  const playSubmit = useCallback(() => {
    if (enabled) play('submit');
  }, [play, enabled]);

  const playSuccess = useCallback(() => {
    if (enabled) play('success');
  }, [play, enabled]);

  const playError = useCallback(() => {
    if (enabled) play('error');
  }, [play, enabled]);

  return {
    playSubmit,
    playSuccess,
    playError,
  };
}

/**
 * Hook لأصوات التنقل
 */
export function useNavigationSound() {
  const { play, enabled } = useSound();

  const playNavigation = useCallback(() => {
    if (enabled) play('navigation');
  }, [play, enabled]);

  const playOpen = useCallback(() => {
    if (enabled) play('open');
  }, [play, enabled]);

  const playClose = useCallback(() => {
    if (enabled) play('close');
  }, [play, enabled]);

  return {
    playNavigation,
    playOpen,
    playClose,
  };
}

/**
 * Hook لتسجيل التفاعل الأول
 */
export function useRegisterInteraction() {
  useEffect(() => {
    registerUserInteraction();
  }, []);
}

// تصدير الأنواع
export type { SoundType };
