/**
 * STAR LUX - Performance Optimizer
 * Extreme Performance - Zero Layout Shift - Zero Flicker
 */

// ============================================
// PERFORMANCE MONITORING
// ============================================
export interface PerformanceMetrics {
  fcp: number;    // First Contentful Paint
  lcp: number;    // Largest Contentful Paint
  fid: number;    // First Input Delay
  cls: number;    // Cumulative Layout Shift
  ttfb: number;   // Time to First Byte
  tti: number;    // Time to Interactive
}

class PerformanceOptimizer {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initObservers();
    }
  }

  private initObservers() {
    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      // Observer not supported
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      // Observer not supported
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const fidEntry = entry as PerformanceEventTiming;
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      // Observer not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShift;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            this.metrics.cls = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      // Observer not supported
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    // Add TTFB
    if (typeof window !== 'undefined' && window.performance) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
      }
    }
    return { ...this.metrics };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// ============================================
// LAZY LOADING UTILITIES
// ============================================
export function lazyLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function preloadImage(src: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

export function preloadFont(href: string, type: string = 'font/woff2'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = type;
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// ============================================
// INTERSECTION OBSERVER HOOK
// ============================================
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================
// REQUEST IDLE CALLBACK POLYFILL
// ============================================
export const requestIdleCallback = 
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback): number => {
        const start = Date.now();
        return window.setTimeout(() => {
          cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, 1) as unknown as number;
      };

export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number): void => {
        clearTimeout(id);
      };

// ============================================
// MEMORY MANAGEMENT
// ============================================
export function cleanupMemory(): void {
  // Clear any cached data
  if (typeof window !== 'undefined') {
    // Suggest garbage collection (won't force it)
    if ('gc' in window) {
      try {
        (window as unknown as { gc: () => void }).gc();
      } catch (e) {
        // GC not available
      }
    }
  }
}

// ============================================
// RESOURCE HINTS
// ============================================
export function addResourceHint(
  rel: 'preconnect' | 'dns-prefetch' | 'preload' | 'prefetch',
  href: string,
  options?: { as?: string; type?: string; crossOrigin?: string }
): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  
  if (options?.as) link.as = options.as;
  if (options?.type) link.type = options.type;
  if (options?.crossOrigin) link.crossOrigin = options.crossOrigin;
  
  document.head.appendChild(link);
}

// ============================================
// CRITICAL RESOURCE LOADER
// ============================================
export function loadCriticalResources(): void {
  // Preconnect to critical origins
  addResourceHint('preconnect', 'https://fonts.googleapis.com');
  addResourceHint('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  
  // DNS prefetch for potential resources
  addResourceHint('dns-prefetch', 'https://api.manus.im');
}

// ============================================
// EXPORT SINGLETON
// ============================================
export const performanceOptimizer = new PerformanceOptimizer();

// Type declarations for Layout Shift API
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}
