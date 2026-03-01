/**
 * نظام Logging مركزي - STAR LUX
 * يسجل جميع الأحداث والأخطاء للمراقبة والتحليل
 * مع إشعارات فورية للإدارة عند حدوث أخطاء حرجة
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: number;
  requestId?: string;
  stack?: string;
}

// ألوان للـ console
const colors = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

// مستوى التسجيل الحالي
const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// تخزين مؤقت للأخطاء (للتحليل)
const errorBuffer: LogEntry[] = [];
const MAX_ERROR_BUFFER = 100;

/**
 * تسجيل رسالة
 */
function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  // تجاهل الرسائل أقل من المستوى المحدد
  if (LOG_LEVELS[level] < LOG_LEVELS[LOG_LEVEL]) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  // إضافة stack trace للأخطاء
  if (level === 'error' && context?.error instanceof Error) {
    entry.stack = context.error.stack;
  }

  // تخزين الأخطاء في الـ buffer
  if (level === 'error') {
    errorBuffer.push(entry);
    if (errorBuffer.length > MAX_ERROR_BUFFER) {
      errorBuffer.shift();
    }
  }

  // طباعة للـ console
  const color = colors[level];
  const prefix = `${color}[${level.toUpperCase()}]${colors.reset}`;
  const timestamp = `\x1b[90m${entry.timestamp}\x1b[0m`;
  
  console.log(`${timestamp} ${prefix} ${message}`);
  
  if (context && Object.keys(context).length > 0) {
    console.log('  Context:', JSON.stringify(context, null, 2));
  }
}

/**
 * Logger API
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  
  /**
   * تسجيل خطأ مع معلومات إضافية
   */
  logError: (error: Error, context?: Record<string, unknown>) => {
    log('error', error.message, {
      ...context,
      error,
      name: error.name,
    });
  },

  /**
   * تسجيل طلب HTTP
   */
  logRequest: (method: string, path: string, statusCode: number, duration: number, userId?: number) => {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    log(level, `${method} ${path} ${statusCode} ${duration}ms`, { userId });
  },

  /**
   * تسجيل عملية قاعدة بيانات
   */
  logDbOperation: (operation: string, table: string, duration: number, success: boolean) => {
    const level: LogLevel = success ? 'debug' : 'error';
    log(level, `DB ${operation} on ${table} - ${duration}ms`, { success });
  },

  /**
   * تسجيل حدث أمني
   */
  logSecurity: (event: string, details: Record<string, unknown>) => {
    log('warn', `[SECURITY] ${event}`, details);
  },

  /**
   * تسجيل حدث مصادقة
   */
  logAuth: (event: 'login' | 'logout' | 'register' | 'failed_login', userId?: number, email?: string) => {
    log('info', `[AUTH] ${event}`, { userId, email });
  },

  /**
   * الحصول على آخر الأخطاء
   */
  getRecentErrors: (count: number = 10): LogEntry[] => {
    return errorBuffer.slice(-count);
  },

  /**
   * مسح buffer الأخطاء
   */
  clearErrors: () => {
    errorBuffer.length = 0;
  },
};

export default logger;


// ============= Error Categories =============
export type ErrorCategory = 
  | 'auth'           // أخطاء المصادقة
  | 'payment'        // أخطاء الدفع
  | 'database'       // أخطاء قاعدة البيانات
  | 'validation'     // أخطاء التحقق
  | 'network'        // أخطاء الشبكة
  | 'permission'     // أخطاء الصلاحيات
  | 'business'       // أخطاء منطق العمل
  | 'system'         // أخطاء النظام
  | 'unknown';       // أخطاء غير معروفة

// ============= Error Tracking =============
interface ErrorStats {
  category: ErrorCategory;
  count: number;
  lastOccurred: Date;
  messages: string[];
}

const errorStats: Map<ErrorCategory, ErrorStats> = new Map();

/**
 * تتبع الأخطاء حسب الفئة
 */
export function trackError(category: ErrorCategory, message: string) {
  const existing = errorStats.get(category);
  if (existing) {
    existing.count++;
    existing.lastOccurred = new Date();
    if (existing.messages.length < 10) {
      existing.messages.push(message);
    }
  } else {
    errorStats.set(category, {
      category,
      count: 1,
      lastOccurred: new Date(),
      messages: [message],
    });
  }
}

/**
 * الحصول على إحصائيات الأخطاء
 */
export function getErrorStats(): ErrorStats[] {
  return Array.from(errorStats.values());
}

/**
 * إعادة تعيين إحصائيات الأخطاء
 */
export function resetErrorStats() {
  errorStats.clear();
}

// ============= Structured Error Logging =============

/**
 * تسجيل خطأ مصادقة
 */
export function logAuthError(message: string, context?: { email?: string; ip?: string; reason?: string }) {
  trackError('auth', message);
  logger.error(`[AUTH ERROR] ${message}`, context);
}

/**
 * تسجيل خطأ دفع
 */
export function logPaymentError(message: string, context?: { orderId?: number; amount?: number; method?: string }) {
  trackError('payment', message);
  logger.error(`[PAYMENT ERROR] ${message}`, context);
}

/**
 * تسجيل خطأ قاعدة بيانات
 */
export function logDatabaseError(message: string, context?: { table?: string; operation?: string }) {
  trackError('database', message);
  logger.error(`[DATABASE ERROR] ${message}`, context);
}

/**
 * تسجيل خطأ صلاحيات
 */
export function logPermissionError(message: string, context?: { userId?: number; resource?: string; action?: string }) {
  trackError('permission', message);
  logger.error(`[PERMISSION ERROR] ${message}`, context);
}

/**
 * تسجيل خطأ تحقق
 */
export function logValidationError(message: string, context?: { field?: string; value?: unknown; rule?: string }) {
  trackError('validation', message);
  logger.warn(`[VALIDATION ERROR] ${message}`, context);
}

// ============= Performance Monitoring =============

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
}

const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000;

/**
 * تسجيل مقياس أداء
 */
export function logPerformance(name: string, duration: number) {
  performanceMetrics.push({
    name,
    duration,
    timestamp: new Date(),
  });
  
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics.shift();
  }
  
  // تحذير إذا كانت العملية بطيئة
  if (duration > 5000) {
    logger.warn(`[SLOW OPERATION] ${name} took ${duration}ms`);
  }
}

/**
 * الحصول على مقاييس الأداء
 */
export function getPerformanceMetrics(name?: string): PerformanceMetric[] {
  if (name) {
    return performanceMetrics.filter(m => m.name === name);
  }
  return [...performanceMetrics];
}

/**
 * حساب متوسط وقت العملية
 */
export function getAveragePerformance(name: string): number {
  const metrics = performanceMetrics.filter(m => m.name === name);
  if (metrics.length === 0) return 0;
  return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
}
