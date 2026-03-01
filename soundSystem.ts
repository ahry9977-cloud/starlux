/**
 * STAR LUX - Professional Interactive Sound System
 * 
 * نظام أصوات تفاعلية احترافي عالي الجودة
 * - Audio Manager مركزي
 * - Lazy Loading للأصوات
 * - Caching محلي
 * - صفر تأثير على الأداء
 * - توافق كامل مع جميع الأجهزة
 */

// أنواع الأصوات المتاحة
export type SoundType = 
  | 'click'           // نقرة عادية
  | 'hover'           // وضع المؤشر
  | 'submit'          // إرسال/تأكيد
  | 'success'         // نجاح
  | 'error'           // خطأ
  | 'warning'         // تحذير
  | 'navigation'      // انتقال
  | 'toggle'          // تبديل
  | 'notification'    // إشعار
  | 'delete'          // حذف
  | 'open'            // فتح
  | 'close';          // إغلاق

// إعدادات الصوت
interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
  respectSystemMute: boolean;
}

// حالة نظام الصوت
interface SoundSystemState {
  initialized: boolean;
  userInteracted: boolean;
  audioContext: AudioContext | null;
  audioBuffers: Map<SoundType, AudioBuffer>;
  settings: SoundSettings;
}

// الأصوات المضمنة (Base64 encoded - أصوات صغيرة جداً)
// هذه أصوات مولدة برمجياً لتجنب تحميل ملفات خارجية
const SOUND_FREQUENCIES: Record<SoundType, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
  click: { freq: 1000, duration: 0.05, type: 'sine', gain: 0.15 },
  hover: { freq: 800, duration: 0.03, type: 'sine', gain: 0.08 },
  submit: { freq: 600, duration: 0.15, type: 'sine', gain: 0.2 },
  success: { freq: 880, duration: 0.2, type: 'sine', gain: 0.18 },
  error: { freq: 200, duration: 0.25, type: 'square', gain: 0.12 },
  warning: { freq: 400, duration: 0.15, type: 'triangle', gain: 0.15 },
  navigation: { freq: 700, duration: 0.08, type: 'sine', gain: 0.12 },
  toggle: { freq: 900, duration: 0.06, type: 'sine', gain: 0.1 },
  notification: { freq: 1200, duration: 0.12, type: 'sine', gain: 0.15 },
  delete: { freq: 300, duration: 0.18, type: 'sawtooth', gain: 0.1 },
  open: { freq: 500, duration: 0.1, type: 'sine', gain: 0.12 },
  close: { freq: 400, duration: 0.08, type: 'sine', gain: 0.1 },
};

// الحالة العامة للنظام
const state: SoundSystemState = {
  initialized: false,
  userInteracted: false,
  audioContext: null,
  audioBuffers: new Map(),
  settings: {
    enabled: true,
    volume: 0.5,
    respectSystemMute: true,
  },
};

// مفتاح التخزين المحلي
const STORAGE_KEY = 'starlux_sound_settings';

/**
 * تحميل الإعدادات من التخزين المحلي
 */
function loadSettings(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.settings = { ...state.settings, ...parsed };
    }
  } catch {
    // تجاهل أخطاء التخزين
  }
}

/**
 * حفظ الإعدادات في التخزين المحلي
 */
function saveSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  } catch {
    // تجاهل أخطاء التخزين
  }
}

/**
 * تهيئة AudioContext (يتم استدعاؤها بعد تفاعل المستخدم)
 */
function initAudioContext(): boolean {
  if (state.audioContext) return true;
  
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;
    
    state.audioContext = new AudioContextClass();
    state.initialized = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * إنشاء صوت برمجياً باستخدام Web Audio API
 */
function generateSound(type: SoundType): void {
  if (!state.audioContext || !state.settings.enabled) return;
  
  const config = SOUND_FREQUENCIES[type];
  if (!config) return;
  
  try {
    const ctx = state.audioContext;
    
    // إنشاء المذبذب
    const oscillator = ctx.createOscillator();
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime);
    
    // إنشاء Gain للتحكم في الصوت
    const gainNode = ctx.createGain();
    const volume = config.gain * state.settings.volume;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);
    
    // توصيل العقد
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // تشغيل وإيقاف
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);
    
    // تنظيف
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  } catch {
    // تجاهل أخطاء الصوت بصمت
  }
}

/**
 * تشغيل صوت معين
 */
export function playSound(type: SoundType): void {
  // التحقق من الإعدادات
  if (!state.settings.enabled) return;
  if (!state.userInteracted) return;
  
  // تهيئة AudioContext إذا لم يكن موجوداً
  if (!state.audioContext) {
    if (!initAudioContext()) return;
  }
  
  // استئناف AudioContext إذا كان معلقاً
  if (state.audioContext?.state === 'suspended') {
    state.audioContext.resume().catch(() => {});
  }
  
  // تشغيل الصوت
  generateSound(type);
}

/**
 * تسجيل أول تفاعل للمستخدم (مطلوب لسياسات المتصفح)
 */
export function registerUserInteraction(): void {
  if (state.userInteracted) return;
  state.userInteracted = true;
  initAudioContext();
}

/**
 * تفعيل/تعطيل الأصوات
 */
export function setSoundEnabled(enabled: boolean): void {
  state.settings.enabled = enabled;
  saveSettings();
}

/**
 * الحصول على حالة تفعيل الأصوات
 */
export function isSoundEnabled(): boolean {
  return state.settings.enabled;
}

/**
 * تعيين مستوى الصوت (0-1)
 */
export function setVolume(volume: number): void {
  state.settings.volume = Math.max(0, Math.min(1, volume));
  saveSettings();
}

/**
 * الحصول على مستوى الصوت الحالي
 */
export function getVolume(): number {
  return state.settings.volume;
}

/**
 * تبديل حالة الأصوات
 */
export function toggleSound(): boolean {
  state.settings.enabled = !state.settings.enabled;
  saveSettings();
  return state.settings.enabled;
}

/**
 * الحصول على جميع الإعدادات
 */
export function getSettings(): SoundSettings {
  return { ...state.settings };
}

/**
 * تحديث الإعدادات
 */
export function updateSettings(newSettings: Partial<SoundSettings>): void {
  state.settings = { ...state.settings, ...newSettings };
  saveSettings();
}

// تحميل الإعدادات عند بدء التشغيل
if (typeof window !== 'undefined') {
  loadSettings();
  
  // تسجيل أول تفاعل
  const interactionEvents = ['click', 'touchstart', 'keydown'];
  const handleFirstInteraction = () => {
    registerUserInteraction();
    interactionEvents.forEach(event => {
      document.removeEventListener(event, handleFirstInteraction);
    });
  };
  
  interactionEvents.forEach(event => {
    document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
  });
}

// تصدير الأنواع والدوال
export default {
  playSound,
  registerUserInteraction,
  setSoundEnabled,
  isSoundEnabled,
  setVolume,
  getVolume,
  toggleSound,
  getSettings,
  updateSettings,
};
