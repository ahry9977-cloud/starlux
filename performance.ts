/**
 * Performance Optimization Utilities
 * تحسينات الأداء للتحميل الفوري
 */

// قياس أداء التحميل
export interface PerformanceMetrics {
  fcp: number;  // First Contentful Paint
  tti: number;  // Time to Interactive
  fpl: number;  // Full Page Load
  timestamp: number;
}

// تسجيل مقاييس الأداء
export function measurePerformance(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
  const tti = navigation?.domInteractive || 0;
  const fpl = navigation?.loadEventEnd || 0;

  return {
    fcp,
    tti,
    fpl,
    timestamp: Date.now()
  };
}

// التحقق من معايير الأداء
export function checkPerformanceThresholds(metrics: PerformanceMetrics): {
  passed: boolean;
  details: { metric: string; value: number; threshold: number; passed: boolean }[];
} {
  const thresholds = {
    fcp: 300,   // 0.3 ثانية
    tti: 500,   // 0.5 ثانية
    fpl: 800    // 0.8 ثانية
  };

  const details = [
    { metric: 'FCP', value: metrics.fcp, threshold: thresholds.fcp, passed: metrics.fcp <= thresholds.fcp },
    { metric: 'TTI', value: metrics.tti, threshold: thresholds.tti, passed: metrics.tti <= thresholds.tti },
    { metric: 'FPL', value: metrics.fpl, threshold: thresholds.fpl, passed: metrics.fpl <= thresholds.fpl }
  ];

  return {
    passed: details.every(d => d.passed),
    details
  };
}

// Preload للموارد الحرجة
export function preloadCriticalResources(resources: { href: string; as: string; type?: string }[]) {
  if (typeof document === 'undefined') return;

  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) {
      link.type = resource.type;
    }
    document.head.appendChild(link);
  });
}

// Prefetch للصفحات المحتملة
export function prefetchPages(urls: string[]) {
  if (typeof document === 'undefined') return;

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

// تأخير تحميل الموارد غير الحرجة
export function deferNonCritical(callback: () => void) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 100);
  }
}

// تحسين الصور
export function optimizeImage(src: string, options: { width?: number; quality?: number } = {}): string {
  const { width = 800, quality = 80 } = options;
  
  // إذا كان الرابط من CDN معروف، أضف معاملات التحسين
  if (src.includes('cloudinary.com')) {
    return src.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  }
  
  if (src.includes('imgix.net')) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}&q=${quality}&auto=format`;
  }

  return src;
}

// مراقب الأداء
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];

  private constructor() {
    this.setupObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupObservers() {
    if (typeof window === 'undefined') return;

    // مراقبة تحميل الصفحة
    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = measurePerformance();
        if (metrics) {
          this.recordMetrics(metrics);
        }
      }, 100);
    });

    // مراقبة التنقل
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const metrics = measurePerformance();
              if (metrics) {
                this.recordMetrics(metrics);
              }
            }
          }
        });
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        // تجاهل الأخطاء في المتصفحات القديمة
      }
    }
  }

  private recordMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);
    this.observers.forEach(cb => cb(metrics));
    
    // تسجيل في console للتطوير
    if (process.env.NODE_ENV === 'development') {
      const check = checkPerformanceThresholds(metrics);
      console.log('📊 Performance Metrics:', {
        fcp: `${metrics.fcp.toFixed(0)}ms`,
        tti: `${metrics.tti.toFixed(0)}ms`,
        fpl: `${metrics.fpl.toFixed(0)}ms`,
        passed: check.passed
      });
    }
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce((acc, m) => ({
      fcp: acc.fcp + m.fcp,
      tti: acc.tti + m.tti,
      fpl: acc.fpl + m.fpl,
      timestamp: 0
    }), { fcp: 0, tti: 0, fpl: 0, timestamp: 0 });

    return {
      fcp: sum.fcp / this.metrics.length,
      tti: sum.tti / this.metrics.length,
      fpl: sum.fpl / this.metrics.length,
      timestamp: Date.now()
    };
  }
}

// تصدير instance واحد
export const performanceMonitor = typeof window !== 'undefined' 
  ? PerformanceMonitor.getInstance() 
  : null;

// Hook لاستخدام مقاييس الأداء في React
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    if (!performanceMonitor) return;

    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    
    // الحصول على آخر قياس
    const latest = performanceMonitor.getLatestMetrics();
    if (latest) {
      setMetrics(latest);
    }

    return unsubscribe;
  }, []);

  return metrics;
}

// استيراد React للـ Hook
import React from 'react';
