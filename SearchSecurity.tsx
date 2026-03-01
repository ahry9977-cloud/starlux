/**
 * Search Security Module
 * نظام أمان البحث - يوفر حماية شاملة من الهجمات
 */

// Rate Limiting Configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 30, // الحد الأقصى للطلبات
  windowMs: 60000, // نافذة زمنية (دقيقة واحدة)
  blockDurationMs: 300000, // مدة الحظر (5 دقائق)
};

// Request tracking
interface RequestTracker {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockedUntil: number;
}

const requestTrackers = new Map<string, RequestTracker>();

/**
 * تنظيف وتعقيم مدخلات البحث
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // إزالة علامات HTML
    .replace(/<[^>]*>/g, '')
    // إزالة أحرف خاصة خطيرة
    .replace(/[<>\"'&;`\\]/g, '')
    // إزالة محاولات SQL Injection
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/gi, '')
    // إزالة محاولات XSS
    .replace(/(javascript|vbscript|expression|onload|onerror|onclick|onmouseover):/gi, '')
    // إزالة التعليقات
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--/g, '')
    // تنظيف المسافات
    .replace(/\s+/g, ' ')
    .trim()
    // تحديد الطول الأقصى
    .substring(0, 200);
}

/**
 * التحقق من صحة استعلام البحث
 */
export function validateSearchQuery(query: string): {
  isValid: boolean;
  error?: string;
  sanitized: string;
} {
  const sanitized = sanitizeSearchInput(query);

  // التحقق من الطول
  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: 'يرجى إدخال كلمة بحث',
      sanitized: '',
    };
  }

  if (sanitized.length < 1) {
    return {
      isValid: false,
      error: 'كلمة البحث قصيرة جداً',
      sanitized,
    };
  }

  if (sanitized.length > 200) {
    return {
      isValid: false,
      error: 'كلمة البحث طويلة جداً',
      sanitized: sanitized.substring(0, 200),
    };
  }

  // التحقق من الأنماط المشبوهة
  const suspiciousPatterns = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b/i,
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /\.\.\//,
    /\0/,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(query)) {
      console.warn('[Search Security] Suspicious pattern detected:', query);
      return {
        isValid: false,
        error: 'استعلام غير صالح',
        sanitized: '',
      };
    }
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * التحقق من Rate Limiting
 */
export function checkRateLimit(identifier: string = 'anonymous'): {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  error?: string;
} {
  const now = Date.now();
  let tracker = requestTrackers.get(identifier);

  // إنشاء tracker جديد إذا لم يكن موجوداً
  if (!tracker) {
    tracker = {
      count: 0,
      firstRequest: now,
      blocked: false,
      blockedUntil: 0,
    };
    requestTrackers.set(identifier, tracker);
  }

  // التحقق من الحظر
  if (tracker.blocked) {
    if (now < tracker.blockedUntil) {
      const remainingBlock = Math.ceil((tracker.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: tracker.blockedUntil,
        error: `تم تجاوز الحد المسموح. يرجى الانتظار ${remainingBlock} ثانية`,
      };
    }
    // إلغاء الحظر
    tracker.blocked = false;
    tracker.count = 0;
    tracker.firstRequest = now;
  }

  // إعادة تعيين العداد إذا انتهت النافذة الزمنية
  if (now - tracker.firstRequest > RATE_LIMIT_CONFIG.windowMs) {
    tracker.count = 0;
    tracker.firstRequest = now;
  }

  // زيادة العداد
  tracker.count++;

  // التحقق من تجاوز الحد
  if (tracker.count > RATE_LIMIT_CONFIG.maxRequests) {
    tracker.blocked = true;
    tracker.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    console.warn('[Search Security] Rate limit exceeded for:', identifier);
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: tracker.blockedUntil,
      error: 'تم تجاوز الحد المسموح من عمليات البحث',
    };
  }

  return {
    allowed: true,
    remainingRequests: RATE_LIMIT_CONFIG.maxRequests - tracker.count,
    resetTime: tracker.firstRequest + RATE_LIMIT_CONFIG.windowMs,
  };
}

/**
 * تسجيل محاولة بحث مشبوهة
 */
export function logSuspiciousSearch(query: string, reason: string): void {
  console.warn('[Search Security] Suspicious search attempt:', {
    query: query.substring(0, 50),
    reason,
    timestamp: new Date().toISOString(),
  });
  
  // يمكن إرسال هذا إلى الخادم للتسجيل
  // sendToSecurityLog({ query, reason });
}

/**
 * إنشاء معرف فريد للمستخدم (للـ Rate Limiting)
 */
export function generateUserIdentifier(): string {
  // استخدام مزيج من المعلومات المتاحة
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ];
  
  // إنشاء hash بسيط
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `user_${Math.abs(hash).toString(36)}`;
}

/**
 * التحقق من أمان البحث الكامل
 */
export function performSecurityCheck(query: string): {
  passed: boolean;
  sanitizedQuery: string;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. التحقق من Rate Limiting
  const rateLimitCheck = checkRateLimit(generateUserIdentifier());
  if (!rateLimitCheck.allowed) {
    errors.push(rateLimitCheck.error || 'تم تجاوز الحد المسموح');
  }
  
  // 2. التحقق من صحة الاستعلام
  const validationResult = validateSearchQuery(query);
  if (!validationResult.isValid) {
    errors.push(validationResult.error || 'استعلام غير صالح');
  }
  
  // 3. التحقق من الأنماط المشبوهة
  if (query.length > 100) {
    warnings.push('استعلام طويل - قد يؤثر على الأداء');
  }
  
  if (/[^\u0000-\u007F]/.test(query) && !/[\u0600-\u06FF]/.test(query)) {
    warnings.push('يحتوي على أحرف غير معتادة');
  }
  
  return {
    passed: errors.length === 0,
    sanitizedQuery: validationResult.sanitized,
    errors,
    warnings,
  };
}

/**
 * Debounce function للبحث
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function للبحث
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export default {
  sanitizeSearchInput,
  validateSearchQuery,
  checkRateLimit,
  logSuspiciousSearch,
  generateUserIdentifier,
  performSecurityCheck,
  debounce,
  throttle,
};
