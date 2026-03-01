/**
 * Instant Load System - True Zero Delay
 * Pre-Execution + Cache Hydration + Predictive Prefetch
 */

// ============================================
// PERFORMANCE METRICS
// ============================================
export interface PerformanceMetrics {
  fcp: number;      // First Contentful Paint
  tti: number;      // Time to Interactive
  lcp: number;      // Largest Contentful Paint
  cls: number;      // Cumulative Layout Shift
  fid: number;      // First Input Delay
}

// ============================================
// CACHE SYSTEM
// ============================================
const CACHE_KEY = 'star_lux_instant_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

export const instantCache = {
  set: (key: string, data: any): void => {
    try {
      const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
      cache[key] = { data, timestamp: Date.now() };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      // Silent fail - cache is optional
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
      const entry: CacheEntry = cache[key];
      if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
        return entry.data as T;
      }
    } catch (e) {
      // Silent fail
    }
    return null;
  },

  clear: (): void => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // Silent fail
    }
  },

  isValid: (key: string): boolean => {
    return instantCache.get(key) !== null;
  }
};

// ============================================
// PREDICTIVE PREFETCH
// ============================================
const prefetchedUrls = new Set<string>();

export const prefetch = {
  // Prefetch a route
  route: (path: string): void => {
    if (prefetchedUrls.has(path)) return;
    prefetchedUrls.add(path);

    // Create invisible link for browser prefetch
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = 'document';
    document.head.appendChild(link);
  },

  // Prefetch critical routes on idle
  criticalRoutes: (): void => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetch.route('/auth');
        prefetch.route('/register-new');
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        prefetch.route('/auth');
        prefetch.route('/register-new');
      }, 100);
    }
  },

  // Prefetch on hover intent
  onHoverIntent: (element: HTMLElement, path: string): void => {
    let timeout: ReturnType<typeof setTimeout>;
    
    element.addEventListener('mouseenter', () => {
      timeout = setTimeout(() => prefetch.route(path), 50);
    });
    
    element.addEventListener('mouseleave', () => {
      clearTimeout(timeout);
    });
  }
};

// ============================================
// PERFORMANCE MONITORING
// ============================================
export const performanceMonitor = {
  metrics: {} as Partial<PerformanceMetrics>,

  // Measure FCP
  measureFCP: (): Promise<number> => {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntriesByName('first-contentful-paint');
          if (entries.length > 0) {
            const fcp = entries[0].startTime;
            performanceMonitor.metrics.fcp = fcp;
            resolve(fcp);
            observer.disconnect();
          }
        });
        observer.observe({ type: 'paint', buffered: true });
      } else {
        resolve(0);
      }
    });
  },

  // Measure TTI
  measureTTI: (): number => {
    if ('performance' in window) {
      const timing = performance.timing;
      const tti = timing.domInteractive - timing.navigationStart;
      performanceMonitor.metrics.tti = tti;
      return tti;
    }
    return 0;
  },

  // Get all metrics
  getMetrics: (): Partial<PerformanceMetrics> => {
    return { ...performanceMonitor.metrics };
  },

  // Check if performance is acceptable
  isAcceptable: (): boolean => {
    const { fcp, tti } = performanceMonitor.metrics;
    return (fcp || 0) < 300 && (tti || 0) < 500;
  },

  // Log performance warning
  logWarning: (metric: string, value: number, threshold: number): void => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] ${metric}: ${value}ms exceeds threshold of ${threshold}ms`);
    }
  }
};

// ============================================
// INSTANT RENDER HELPERS
// ============================================
export const instantRender = {
  // Force immediate paint
  forceRepaint: (): void => {
    // Trigger reflow
    document.body.offsetHeight;
  },

  // Schedule non-critical work
  scheduleIdle: (callback: () => void): void => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 1000 });
    } else {
      setTimeout(callback, 1);
    }
  },

  // High priority render
  priorityRender: (callback: () => void): void => {
    if ('requestAnimationFrame' in window) {
      requestAnimationFrame(callback);
    } else {
      callback();
    }
  }
};

// ============================================
// INITIALIZATION
// ============================================
export const initInstantLoad = (): void => {
  // Start measuring performance
  performanceMonitor.measureFCP();
  
  // Prefetch critical routes on idle
  prefetch.criticalRoutes();
  
  // Clear stale cache
  instantCache.clear();
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initInstantLoad();
}

export default {
  cache: instantCache,
  prefetch,
  monitor: performanceMonitor,
  render: instantRender
};
