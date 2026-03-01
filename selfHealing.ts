/**
 * Self-Healing System - Auto Error Detection & Recovery
 * Zero Downtime - No Manual Intervention
 */

// ============================================
// ERROR TYPES
// ============================================
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorRecord {
  type: string;
  message: string;
  stack?: string;
  timestamp: number;
  severity: ErrorSeverity;
  recovered: boolean;
}

// ============================================
// ERROR REGISTRY
// ============================================
const errorRegistry: ErrorRecord[] = [];
const MAX_ERRORS = 50;

// ============================================
// RECOVERY STRATEGIES
// ============================================
const recoveryStrategies: Record<string, () => void> = {
  // Network error recovery
  'NetworkError': () => {
    // Retry with exponential backoff is handled by tRPC
  },
  
  // Chunk load error recovery
  'ChunkLoadError': () => {
    // Force reload the page
    window.location.reload();
  },
  
  // State corruption recovery
  'StateError': () => {
    // Clear local storage and reload
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  },
  
  // Render error recovery
  'RenderError': () => {
    // Error boundary will handle this
  }
};

// ============================================
// ERROR DETECTION
// ============================================
export const selfHealing = {
  // Initialize error listeners
  init: (): void => {
    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      selfHealing.handleError({
        type: error?.name || 'Error',
        message: String(message),
        stack: error?.stack,
        timestamp: Date.now(),
        severity: 'high',
        recovered: false
      });
      return false; // Don't prevent default handling
    };

    // Unhandled promise rejection handler
    window.onunhandledrejection = (event) => {
      selfHealing.handleError({
        type: 'UnhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now(),
        severity: 'medium',
        recovered: false
      });
    };

    // Chunk load error detection
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as HTMLElement).tagName === 'SCRIPT') {
        selfHealing.handleError({
          type: 'ChunkLoadError',
          message: 'Failed to load script chunk',
          timestamp: Date.now(),
          severity: 'critical',
          recovered: false
        });
      }
    }, true);
  },

  // Handle and attempt recovery
  handleError: (error: ErrorRecord): void => {
    // Add to registry
    errorRegistry.push(error);
    if (errorRegistry.length > MAX_ERRORS) {
      errorRegistry.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[SelfHealing] Error detected:', error);
    }

    // Attempt recovery
    const strategy = recoveryStrategies[error.type];
    if (strategy) {
      try {
        strategy();
        error.recovered = true;
      } catch (e) {
        // Recovery failed
      }
    }

    // Check for error storm (too many errors in short time)
    selfHealing.checkErrorStorm();
  },

  // Detect error storm
  checkErrorStorm: (): void => {
    const recentErrors = errorRegistry.filter(
      e => Date.now() - e.timestamp < 5000
    );
    
    if (recentErrors.length >= 5) {
      // Too many errors - force reload
      console.warn('[SelfHealing] Error storm detected, reloading...');
      window.location.reload();
    }
  },

  // Get error statistics
  getStats: () => ({
    total: errorRegistry.length,
    recovered: errorRegistry.filter(e => e.recovered).length,
    critical: errorRegistry.filter(e => e.severity === 'critical').length,
    recent: errorRegistry.filter(e => Date.now() - e.timestamp < 60000).length
  }),

  // Clear error history
  clearHistory: (): void => {
    errorRegistry.length = 0;
  },

  // Health check
  isHealthy: (): boolean => {
    const stats = selfHealing.getStats();
    return stats.critical === 0 && stats.recent < 3;
  }
};

// ============================================
// PERFORMANCE GUARD
// ============================================
export const performanceGuard = {
  // Monitor long tasks
  monitorLongTasks: (): void => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Long task detected
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[PerformanceGuard] Long task: ${entry.duration}ms`);
            }
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Not supported
      }
    }
  },

  // Monitor memory
  monitorMemory: (): void => {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('[PerformanceGuard] High memory usage detected');
        }
      }, 30000);
    }
  }
};

// ============================================
// AUTO INITIALIZATION
// ============================================
if (typeof window !== 'undefined') {
  selfHealing.init();
  performanceGuard.monitorLongTasks();
}

export default selfHealing;
