/**
 * STAR LUX - Sonic Brand Identity Generator
 * إنشاء أصوات أصلية وحصرية لمنصة Star Lux
 * باستخدام Web Audio API لتوليد أصوات فاخرة ومميزة
 */

// Audio Context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Resume audio context after user interaction
export const resumeAudioContext = async (): Promise<void> => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

/**
 * Star Lux Sonic Identity - Sound Definitions
 * كل صوت مصمم ليعكس الفخامة والتقنية المتقدمة
 */
interface SoundConfig {
  frequencies: number[];
  durations: number[];
  gains: number[];
  waveforms: OscillatorType[];
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq?: number;
  filterQ?: number;
  detune?: number;
  reverb?: number;
}

// Star Lux Sonic Brand Identity - Unique Sound Configurations
const STARLUX_SOUNDS: Record<string, SoundConfig> = {
  // Hover - صوت ناعم خفيف للـ hover (فخامة هادئة)
  'hover-soft': {
    frequencies: [880, 1320],
    durations: [0.08, 0.06],
    gains: [0.08, 0.04],
    waveforms: ['sine', 'sine'],
    attack: 0.005,
    decay: 0.02,
    sustain: 0.3,
    release: 0.05,
    filterFreq: 2000,
    filterQ: 1,
    detune: 5
  },

  // Click Primary - صوت تأكيد فاخر (نقرة رئيسية)
  'click-primary': {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 - Major chord
    durations: [0.12, 0.1, 0.08],
    gains: [0.15, 0.12, 0.08],
    waveforms: ['triangle', 'sine', 'sine'],
    attack: 0.001,
    decay: 0.03,
    sustain: 0.4,
    release: 0.08,
    filterFreq: 3000,
    filterQ: 0.8,
    reverb: 0.1
  },

  // Click Secondary - صوت أخف (نقرة ثانوية)
  'click-secondary': {
    frequencies: [698.46, 880],
    durations: [0.08, 0.06],
    gains: [0.1, 0.06],
    waveforms: ['sine', 'sine'],
    attack: 0.002,
    decay: 0.025,
    sustain: 0.3,
    release: 0.06,
    filterFreq: 2500,
    filterQ: 0.7
  },

  // Submit Confirm - صوت نجاح واضح (تأكيد الإرسال)
  'submit-confirm': {
    frequencies: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6 - Rising major
    durations: [0.15, 0.12, 0.1, 0.18],
    gains: [0.12, 0.14, 0.12, 0.16],
    waveforms: ['triangle', 'sine', 'sine', 'sine'],
    attack: 0.002,
    decay: 0.04,
    sustain: 0.5,
    release: 0.12,
    filterFreq: 4000,
    filterQ: 0.5,
    reverb: 0.15
  },

  // Navigation Tap - صوت انتقال أنيق
  'navigation-tap': {
    frequencies: [440, 554.37, 659.25], // A4, C#5, E5
    durations: [0.1, 0.08, 0.06],
    gains: [0.1, 0.08, 0.05],
    waveforms: ['sine', 'triangle', 'sine'],
    attack: 0.003,
    decay: 0.03,
    sustain: 0.35,
    release: 0.07,
    filterFreq: 2800,
    filterQ: 0.6,
    detune: 3
  },

  // Admin Action - صوت تقني احترافي
  'admin-action': {
    frequencies: [392, 493.88, 587.33], // G4, B4, D5
    durations: [0.12, 0.1, 0.08],
    gains: [0.12, 0.1, 0.07],
    waveforms: ['square', 'triangle', 'sine'],
    attack: 0.001,
    decay: 0.035,
    sustain: 0.4,
    release: 0.08,
    filterFreq: 2200,
    filterQ: 1.2
  },

  // Warning Soft - صوت تحذير غير مزعج
  'warning-soft': {
    frequencies: [349.23, 415.30], // F4, G#4
    durations: [0.15, 0.12],
    gains: [0.12, 0.08],
    waveforms: ['triangle', 'sine'],
    attack: 0.005,
    decay: 0.04,
    sustain: 0.35,
    release: 0.1,
    filterFreq: 1800,
    filterQ: 0.8
  },

  // Error - صوت خطأ واضح لكن غير مزعج
  'error': {
    frequencies: [293.66, 277.18], // D4, C#4 - Minor second
    durations: [0.12, 0.15],
    gains: [0.14, 0.1],
    waveforms: ['triangle', 'sawtooth'],
    attack: 0.002,
    decay: 0.05,
    sustain: 0.3,
    release: 0.1,
    filterFreq: 1500,
    filterQ: 1.5
  },

  // Success - صوت نجاح مميز
  'success': {
    frequencies: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
    durations: [0.1, 0.1, 0.1, 0.2],
    gains: [0.1, 0.12, 0.14, 0.12],
    waveforms: ['sine', 'sine', 'sine', 'triangle'],
    attack: 0.002,
    decay: 0.03,
    sustain: 0.5,
    release: 0.15,
    filterFreq: 4500,
    filterQ: 0.4,
    reverb: 0.2
  },

  // Notification - صوت إشعار لطيف
  'notification': {
    frequencies: [880, 1108.73, 1318.51], // A5, C#6, E6
    durations: [0.12, 0.1, 0.15],
    gains: [0.1, 0.12, 0.08],
    waveforms: ['sine', 'sine', 'triangle'],
    attack: 0.003,
    decay: 0.04,
    sustain: 0.4,
    release: 0.12,
    filterFreq: 5000,
    filterQ: 0.3,
    reverb: 0.1
  },

  // Toggle On - صوت تفعيل
  'toggle-on': {
    frequencies: [523.25, 783.99], // C5, G5
    durations: [0.08, 0.1],
    gains: [0.1, 0.12],
    waveforms: ['sine', 'triangle'],
    attack: 0.002,
    decay: 0.025,
    sustain: 0.4,
    release: 0.08,
    filterFreq: 3500,
    filterQ: 0.5
  },

  // Toggle Off - صوت إلغاء التفعيل
  'toggle-off': {
    frequencies: [783.99, 523.25], // G5, C5 - Descending
    durations: [0.08, 0.1],
    gains: [0.1, 0.08],
    waveforms: ['sine', 'triangle'],
    attack: 0.002,
    decay: 0.025,
    sustain: 0.35,
    release: 0.08,
    filterFreq: 2500,
    filterQ: 0.5
  },

  // Delete - صوت حذف
  'delete': {
    frequencies: [392, 329.63], // G4, E4 - Descending
    durations: [0.1, 0.12],
    gains: [0.12, 0.08],
    waveforms: ['triangle', 'sine'],
    attack: 0.002,
    decay: 0.04,
    sustain: 0.3,
    release: 0.1,
    filterFreq: 2000,
    filterQ: 0.8
  },

  // Open Modal/Panel - صوت فتح
  'open': {
    frequencies: [440, 554.37, 659.25], // A4, C#5, E5 - Rising
    durations: [0.08, 0.08, 0.1],
    gains: [0.08, 0.1, 0.12],
    waveforms: ['sine', 'sine', 'triangle'],
    attack: 0.003,
    decay: 0.03,
    sustain: 0.4,
    release: 0.1,
    filterFreq: 3000,
    filterQ: 0.6
  },

  // Close Modal/Panel - صوت إغلاق
  'close': {
    frequencies: [659.25, 554.37, 440], // E5, C#5, A4 - Descending
    durations: [0.08, 0.08, 0.1],
    gains: [0.1, 0.08, 0.06],
    waveforms: ['sine', 'sine', 'triangle'],
    attack: 0.003,
    decay: 0.03,
    sustain: 0.35,
    release: 0.1,
    filterFreq: 2500,
    filterQ: 0.6
  }
};

/**
 * Generate and play a Star Lux branded sound
 */
export const playStarLuxSound = (soundName: keyof typeof STARLUX_SOUNDS): void => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') return;

    const config = STARLUX_SOUNDS[soundName];
    if (!config) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.connect(ctx.destination);

    // Create filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.filterFreq || 3000, now);
    filter.Q.setValueAtTime(config.filterQ || 1, now);
    filter.connect(masterGain);

    // Create oscillators for each frequency
    config.frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = config.waveforms[i] || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      if (config.detune) {
        osc.detune.setValueAtTime(config.detune * (i % 2 === 0 ? 1 : -1), now);
      }

      const duration = config.durations[i] || 0.1;
      const gain = config.gains[i] || 0.1;

      // ADSR Envelope
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(gain, now + config.attack);
      oscGain.gain.linearRampToValueAtTime(gain * config.sustain, now + config.attack + config.decay);
      oscGain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    });

    // Master envelope
    const totalDuration = Math.max(...config.durations);
    masterGain.gain.linearRampToValueAtTime(1, now + 0.001);
    masterGain.gain.setValueAtTime(1, now + totalDuration - config.release);
    masterGain.gain.linearRampToValueAtTime(0, now + totalDuration);

  } catch (error) {
    // Silent fail - don't break the UI
    console.debug('Star Lux Sound:', error);
  }
};

// Sound type aliases for easier usage
export type StarLuxSoundType = keyof typeof STARLUX_SOUNDS;

// Export sound names for reference
export const SOUND_NAMES = Object.keys(STARLUX_SOUNDS) as StarLuxSoundType[];

// Pre-warm audio context on first user interaction
let isWarmed = false;
export const warmUpAudio = (): void => {
  if (isWarmed) return;
  isWarmed = true;
  
  resumeAudioContext().then(() => {
    // Play a silent sound to warm up the audio pipeline
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.001);
  });
};

// Auto warm-up on first interaction
if (typeof window !== 'undefined') {
  const warmUpHandler = () => {
    warmUpAudio();
    window.removeEventListener('click', warmUpHandler);
    window.removeEventListener('touchstart', warmUpHandler);
    window.removeEventListener('keydown', warmUpHandler);
  };
  
  window.addEventListener('click', warmUpHandler, { once: true, passive: true });
  window.addEventListener('touchstart', warmUpHandler, { once: true, passive: true });
  window.addEventListener('keydown', warmUpHandler, { once: true, passive: true });
}
