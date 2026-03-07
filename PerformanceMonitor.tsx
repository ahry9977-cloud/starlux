import React, { useEffect, useState, useCallback } from 'react';
import { measurePerformance, checkPerformanceThresholds, type PerformanceMetrics } from '@/lib/performance';

interface PerformanceMonitorProps {
  /** إظهار المراقب في وضع التطوير فقط */
  devOnly?: boolean;
  /** موضع المراقب */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** إظهار التفاصيل */
  showDetails?: boolean;
  /** callback عند تجاوز الحدود */
  onThresholdExceeded?: (metrics: PerformanceMetrics) => void;
}

/**
 * مكون مراقبة الأداء التلقائي
 * يعرض مقاييس الأداء في الوقت الفعلي
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  devOnly = true,
  position = 'bottom-right',
  showDetails = false,
  onThresholdExceeded
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(showDetails);

  // قياس الأداء عند التحميل
  useEffect(() => {
    // التحقق من وضع التطوير
    if (devOnly && process.env.NODE_ENV !== 'development') {
      return;
    }

    const measureAndUpdate = () => {
      const perf = measurePerformance();
      if (perf) {
        setMetrics(perf);
        setIsVisible(true);

        // التحقق من الحدود
        const check = checkPerformanceThresholds(perf);
        if (!check.passed && onThresholdExceeded) {
          onThresholdExceeded(perf);
        }
      }
    };

    // قياس بعد التحميل الكامل
    if (document.readyState === 'complete') {
      setTimeout(measureAndUpdate, 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(measureAndUpdate, 100);
      });
    }

    // إعادة القياس عند التنقل
    const handleNavigation = () => {
      setTimeout(measureAndUpdate, 100);
    };

    window.addEventListener('popstate', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [devOnly, onThresholdExceeded]);

  // إخفاء المراقب
  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  // إذا لم يكن مرئياً أو لا توجد مقاييس
  if (!isVisible || !metrics) {
    return null;
  }

  const check = checkPerformanceThresholds(metrics);
  const statusColor = check.passed ? '#22c55e' : '#ef4444';
  const statusText = check.passed ? 'ممتاز' : 'يحتاج تحسين';

  // تحديد الموضع
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 99999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        direction: 'ltr'
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          padding: isExpanded ? 16 : 8,
          color: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${statusColor}40`,
          minWidth: isExpanded ? 200 : 'auto',
          transition: 'all 0.2s ease'
        }}
      >
        {/* الشريط العلوي */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              cursor: 'pointer'
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: statusColor,
                animation: check.passed ? 'none' : 'pulse 1s infinite'
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {isExpanded ? statusText : `${Number((metrics as any).fcp ?? 0).toFixed(0)}ms`}
            </span>
          </div>
          
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: 2,
              fontSize: 14,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* التفاصيل */}
        {isExpanded && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              {check.details.map((detail: any) => (
                <div key={detail.metric} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{detail.metric}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>{detail.value.toFixed(0)}ms</span>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: detail.passed ? '#22c55e' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* شريط التقدم */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>الأداء العام</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                  {check.details.filter((d: any) => d.passed).length}/{check.details.length}
                </span>
              </div>
              <div style={{ 
                height: 4, 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(check.details.filter((d: any) => d.passed).length / check.details.length) * 100}%`,
                  background: statusColor,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* معايير القبول */}
            <div style={{ marginTop: 12, padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>معايير القبول</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                FCP ≤ 300ms | TTI ≤ 500ms | FPL ≤ 800ms
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS للـ animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

/**
 * Hook لمراقبة الأداء برمجياً
 */
export function usePerformanceMonitor(options?: {
  onMeasure?: (metrics: PerformanceMetrics) => void;
  onThresholdExceeded?: (metrics: PerformanceMetrics) => void;
}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [status, setStatus] = useState<'loading' | 'passed' | 'failed'>('loading');

  useEffect(() => {
    const measure = () => {
      const perf = measurePerformance();
      if (perf) {
        setMetrics(perf);
        const check = checkPerformanceThresholds(perf);
        setStatus(check.passed ? 'passed' : 'failed');
        
        options?.onMeasure?.(perf);
        if (!check.passed) {
          options?.onThresholdExceeded?.(perf);
        }
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(measure, 100);
    } else {
      window.addEventListener('load', () => setTimeout(measure, 100));
    }
  }, [options]);

  return { metrics, status };
}

export default PerformanceMonitor;
