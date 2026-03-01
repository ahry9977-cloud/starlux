/**
 * STAR LUX - Advanced Audio Manager
 * نظام إدارة الصوت المتقدم مع Audio Pooling و Zero Latency
 */

import { 
  playStarLuxSound, 
  warmUpAudio, 
  resumeAudioContext,
  type StarLuxSoundType 
} from './starLuxSoundGenerator';

// Sound settings stored in localStorage
const STORAGE_KEY = 'starlux-sound-settings';

interface SoundSettings {
  enabled: boolean;
  volume: number;
  hoverSounds: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.7,
  hoverSounds: true
};

// Singleton state
let settings: SoundSettings = { ...DEFAULT_SETTINGS };
let isInitialized = false;
let lastPlayTime: Record<string, number> = {};

// Minimum time between same sounds (prevent overlap)
const MIN_SOUND_INTERVAL = 50; // ms

/**
 * Initialize the audio manager
 */
export const initStarLuxAudio = (): void => {
  if (isInitialized) return;
  isInitialized = true;

  // Load settings from localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }

  // Warm up audio on first interaction
  warmUpAudio();
};

/**
 * Save settings to localStorage
 */
const saveSettings = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Silent fail
  }
};

/**
 * Get current sound settings
 */
export const getSoundSettings = (): SoundSettings => ({ ...settings });

/**
 * Update sound settings
 */
export const updateSoundSettings = (newSettings: Partial<SoundSettings>): void => {
  settings = { ...settings, ...newSettings };
  saveSettings();
};

/**
 * Toggle sound on/off
 */
export const toggleSound = (): boolean => {
  settings.enabled = !settings.enabled;
  saveSettings();
  return settings.enabled;
};

/**
 * Set volume (0-1)
 */
export const setVolume = (volume: number): void => {
  settings.volume = Math.max(0, Math.min(1, volume));
  saveSettings();
};

/**
 * Toggle hover sounds
 */
export const toggleHoverSounds = (): boolean => {
  settings.hoverSounds = !settings.hoverSounds;
  saveSettings();
  return settings.hoverSounds;
};

/**
 * Play a Star Lux branded sound with anti-overlap protection
 */
export const playSound = (soundType: StarLuxSoundType): void => {
  if (!settings.enabled) return;
  if (!isInitialized) initStarLuxAudio();

  // Anti-overlap: prevent same sound from playing too quickly
  const now = Date.now();
  const lastTime = lastPlayTime[soundType] || 0;
  if (now - lastTime < MIN_SOUND_INTERVAL) return;
  lastPlayTime[soundType] = now;

  // Resume audio context if needed
  resumeAudioContext().then(() => {
    playStarLuxSound(soundType);
  });
};

/**
 * Play hover sound (respects hoverSounds setting)
 */
export const playHoverSound = (): void => {
  if (!settings.hoverSounds) return;
  playSound('hover-soft');
};

/**
 * Play click sound based on button type
 */
export const playClickSound = (isPrimary: boolean = true): void => {
  playSound(isPrimary ? 'click-primary' : 'click-secondary');
};

/**
 * Play navigation sound
 */
export const playNavigationSound = (): void => {
  playSound('navigation-tap');
};

/**
 * Play submit/confirm sound
 */
export const playSubmitSound = (): void => {
  playSound('submit-confirm');
};

/**
 * Play success sound
 */
export const playSuccessSound = (): void => {
  playSound('success');
};

/**
 * Play error sound
 */
export const playErrorSound = (): void => {
  playSound('error');
};

/**
 * Play warning sound
 */
export const playWarningSound = (): void => {
  playSound('warning-soft');
};

/**
 * Play notification sound
 */
export const playNotificationSound = (): void => {
  playSound('notification');
};

/**
 * Play admin action sound
 */
export const playAdminSound = (): void => {
  playSound('admin-action');
};

/**
 * Play toggle sound
 */
export const playToggleSound = (isOn: boolean): void => {
  playSound(isOn ? 'toggle-on' : 'toggle-off');
};

/**
 * Play delete sound
 */
export const playDeleteSound = (): void => {
  playSound('delete');
};

/**
 * Play open sound
 */
export const playOpenSound = (): void => {
  playSound('open');
};

/**
 * Play close sound
 */
export const playCloseSound = (): void => {
  playSound('close');
};

// Sound mapping for different element types
export type ElementSoundType = 
  | 'primary-button'
  | 'secondary-button'
  | 'link'
  | 'nav-item'
  | 'toggle'
  | 'input'
  | 'submit'
  | 'delete'
  | 'admin'
  | 'modal-open'
  | 'modal-close';

/**
 * Get appropriate sound for element type
 */
export const getSoundForElement = (elementType: ElementSoundType): (() => void) => {
  switch (elementType) {
    case 'primary-button':
      return () => playClickSound(true);
    case 'secondary-button':
      return () => playClickSound(false);
    case 'link':
    case 'nav-item':
      return playNavigationSound;
    case 'toggle':
      return () => playToggleSound(true);
    case 'input':
      return () => playSound('hover-soft');
    case 'submit':
      return playSubmitSound;
    case 'delete':
      return playDeleteSound;
    case 'admin':
      return playAdminSound;
    case 'modal-open':
      return playOpenSound;
    case 'modal-close':
      return playCloseSound;
    default:
      return () => playClickSound(false);
  }
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  // Defer initialization to avoid blocking
  setTimeout(initStarLuxAudio, 0);
}

// Export types
export type { SoundSettings, StarLuxSoundType };
