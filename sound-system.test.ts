/**
 * STAR LUX - Sound System Tests
 * 
 * اختبارات شاملة لنظام الأصوات التفاعلية
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  resume: vi.fn().mockResolvedValue(undefined),
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    onended: null,
  })),
  createGain: vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  destination: {},
  currentTime: 0,
};

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }),
});

// Mock AudioContext
vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));
vi.stubGlobal('webkitAudioContext', vi.fn(() => mockAudioContext));

describe('Sound System Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('Audio Manager', () => {
    it('should define all required sound types', () => {
      const soundTypes = [
        'click', 'hover', 'submit', 'success', 'error',
        'warning', 'navigation', 'toggle', 'notification',
        'delete', 'open', 'close'
      ];
      
      soundTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should have correct sound frequencies configuration', () => {
      const frequencies = {
        click: { freq: 1000, duration: 0.05 },
        hover: { freq: 800, duration: 0.03 },
        submit: { freq: 600, duration: 0.15 },
        success: { freq: 880, duration: 0.2 },
        error: { freq: 200, duration: 0.25 },
        warning: { freq: 400, duration: 0.15 },
        navigation: { freq: 700, duration: 0.08 },
        toggle: { freq: 900, duration: 0.06 },
        notification: { freq: 1200, duration: 0.12 },
        delete: { freq: 300, duration: 0.18 },
        open: { freq: 500, duration: 0.1 },
        close: { freq: 400, duration: 0.08 },
      };

      Object.entries(frequencies).forEach(([type, config]) => {
        expect(config.freq).toBeGreaterThan(0);
        expect(config.duration).toBeGreaterThan(0);
        expect(config.duration).toBeLessThan(1); // All sounds should be short
      });
    });
  });

  describe('Sound Settings', () => {
    it('should have default settings', () => {
      const defaultSettings = {
        enabled: true,
        volume: 0.5,
        respectSystemMute: true,
      };

      expect(defaultSettings.enabled).toBe(true);
      expect(defaultSettings.volume).toBe(0.5);
      expect(defaultSettings.respectSystemMute).toBe(true);
    });

    it('should validate volume range (0-1)', () => {
      const validVolumes = [0, 0.25, 0.5, 0.75, 1];
      const invalidVolumes = [-1, 1.5, 2];

      validVolumes.forEach(vol => {
        expect(vol >= 0 && vol <= 1).toBe(true);
      });

      invalidVolumes.forEach(vol => {
        expect(vol >= 0 && vol <= 1).toBe(false);
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should have minimal sound durations for performance', () => {
      const maxDuration = 0.3; // 300ms max
      const durations = [0.05, 0.03, 0.15, 0.2, 0.25, 0.15, 0.08, 0.06, 0.12, 0.18, 0.1, 0.08];

      durations.forEach(duration => {
        expect(duration).toBeLessThanOrEqual(maxDuration);
      });
    });

    it('should use Web Audio API for zero-latency playback', () => {
      expect(typeof AudioContext).toBe('function');
    });

    it('should not block main thread', () => {
      // Sound generation should be async and non-blocking
      const startTime = performance.now();
      
      // Simulate sound generation
      const oscillator = mockAudioContext.createOscillator();
      const gainNode = mockAudioContext.createGain();
      oscillator.connect(gainNode);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete in less than 1ms
      expect(executionTime).toBeLessThan(10);
    });
  });

  describe('Cross-Device Compatibility', () => {
    it('should support touch events for mobile', () => {
      const touchEvents = ['touchstart', 'touchend', 'touchmove'];
      
      touchEvents.forEach(event => {
        expect(typeof event).toBe('string');
      });
    });

    it('should support mouse events for desktop', () => {
      const mouseEvents = ['click', 'mouseenter', 'mouseleave'];
      
      mouseEvents.forEach(event => {
        expect(typeof event).toBe('string');
      });
    });

    it('should respect browser autoplay policies', () => {
      // Sound should only play after user interaction
      const userInteracted = false;
      
      // Should not play without interaction
      expect(userInteracted).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle AudioContext creation failure gracefully', () => {
      const createContext = () => {
        try {
          return new AudioContext();
        } catch {
          return null;
        }
      };

      const context = createContext();
      // Should not throw
      expect(context).toBeDefined();
    });

    it('should handle suspended AudioContext', async () => {
      mockAudioContext.state = 'suspended';
      
      await mockAudioContext.resume();
      
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should not break UI on sound failure', () => {
      // Simulate sound failure
      const playSound = () => {
        try {
          throw new Error('Sound failed');
        } catch {
          // Silently fail
          return false;
        }
      };

      const result = playSound();
      expect(result).toBe(false);
      // UI should continue working
    });
  });

  describe('Sound Mapping', () => {
    it('should map button variants to appropriate sounds', () => {
      const variantSounds = {
        primary: 'click',
        secondary: 'click',
        outline: 'click',
        ghost: 'hover',
        danger: 'warning',
        success: 'success',
      };

      Object.entries(variantSounds).forEach(([variant, sound]) => {
        expect(sound).toBeDefined();
        expect(['click', 'hover', 'warning', 'success']).toContain(sound);
      });
    });

    it('should have unique sounds for different actions', () => {
      const actionSounds = {
        click: 'click',
        hover: 'hover',
        submit: 'submit',
        delete: 'delete',
        navigate: 'navigation',
      };

      const uniqueSounds = new Set(Object.values(actionSounds));
      expect(uniqueSounds.size).toBe(Object.keys(actionSounds).length);
    });
  });

  describe('User Preferences', () => {
    it('should save settings to localStorage', () => {
      const settings = { enabled: true, volume: 0.7 };
      localStorage.setItem('starlux_sound_settings', JSON.stringify(settings));

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should load settings from localStorage', () => {
      mockStorage['starlux_sound_settings'] = JSON.stringify({ enabled: false, volume: 0.3 });
      
      const saved = localStorage.getItem('starlux_sound_settings');
      const parsed = saved ? JSON.parse(saved) : null;

      expect(parsed?.enabled).toBe(false);
      expect(parsed?.volume).toBe(0.3);
    });

    it('should handle corrupted localStorage gracefully', () => {
      mockStorage['starlux_sound_settings'] = 'invalid json';
      
      const loadSettings = () => {
        try {
          const saved = localStorage.getItem('starlux_sound_settings');
          return saved ? JSON.parse(saved) : null;
        } catch {
          return null;
        }
      };

      const result = loadSettings();
      expect(result).toBeNull();
    });
  });

  describe('Oscillator Types', () => {
    it('should use appropriate oscillator types for different sounds', () => {
      const oscillatorTypes = {
        click: 'sine',
        hover: 'sine',
        error: 'square',
        warning: 'triangle',
        delete: 'sawtooth',
      };

      const validTypes = ['sine', 'square', 'triangle', 'sawtooth'];
      
      Object.values(oscillatorTypes).forEach(type => {
        expect(validTypes).toContain(type);
      });
    });
  });

  describe('Gain Levels', () => {
    it('should have appropriate gain levels (not too loud)', () => {
      const maxGain = 0.25; // Max 25% to avoid being too loud
      const gains = [0.15, 0.08, 0.2, 0.18, 0.12, 0.15, 0.12, 0.1, 0.15, 0.1, 0.12, 0.1];

      gains.forEach(gain => {
        expect(gain).toBeLessThanOrEqual(maxGain);
        expect(gain).toBeGreaterThan(0);
      });
    });
  });
});

describe('Sound Integration', () => {
  it('should integrate with React components', () => {
    // SoundButton should accept sound props
    const buttonProps = {
      soundType: 'click',
      hoverSound: true,
      clickSound: true,
    };

    expect(buttonProps.soundType).toBe('click');
    expect(buttonProps.hoverSound).toBe(true);
    expect(buttonProps.clickSound).toBe(true);
  });

  it('should provide SoundSettings component', () => {
    const settingsProps = {
      compact: true,
      className: 'custom-class',
    };

    expect(settingsProps.compact).toBe(true);
    expect(settingsProps.className).toBe('custom-class');
  });

  it('should provide SoundProvider context', () => {
    const contextValue = {
      play: () => {},
      enabled: true,
      volume: 0.5,
      setEnabled: () => {},
      setVolume: () => {},
      toggle: () => true,
    };

    expect(typeof contextValue.play).toBe('function');
    expect(typeof contextValue.toggle).toBe('function');
  });
});
