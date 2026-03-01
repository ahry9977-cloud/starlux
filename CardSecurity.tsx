import { useCallback, useRef, useState } from 'react';
import { CardFormData } from './CardInputFields';

// ============= واجهات الأمان =============

export interface TokenizedCard {
  token: string;
  lastFour: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  fingerprint: string;
}

export interface SecurityConfig {
  enableTokenization: boolean;
  enableEncryption: boolean;
  preventDoubleSubmission: boolean;
  maxRetries: number;
  sessionTimeout: number;
}

// ============= دوال التشفير =============

/**
 * تشفير البيانات باستخدام AES-256-GCM
 * ملاحظة: في الإنتاج، يجب استخدام مفتاح من الخادم
 */
export async function encryptCardData(data: string): Promise<string> {
  // توليد مفتاح عشوائي للتشفير
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // توليد IV عشوائي
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // تشفير البيانات
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  // تحويل البيانات المشفرة إلى Base64
  const encryptedArray = new Uint8Array(encryptedData);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

/**
 * توليد Token للبطاقة
 * في الإنتاج، يجب أن يتم هذا على الخادم
 */
export function generateCardToken(cardData: CardFormData): string {
  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(16));
  const randomHex = Array.from(random)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `tok_${timestamp}_${randomHex}`;
}

/**
 * توليد بصمة للبطاقة (للكشف عن التكرار)
 */
export async function generateCardFingerprint(cardNumber: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(cardNumber.replace(/\s/g, ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ============= حماية من CSRF =============

/**
 * توليد CSRF Token
 */
export function generateCSRFToken(): string {
  const random = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(random)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * التحقق من CSRF Token
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  
  // مقارنة آمنة زمنياً
  if (token.length !== storedToken.length) return false;
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

// ============= حماية من XSS =============

/**
 * تنظيف المدخلات من XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * التحقق من صحة المدخلات
 */
export function validateInput(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

// ============= حماية من Double Submission =============

/**
 * Hook لمنع الإرسال المزدوج
 */
export function useDoubleSubmitPrevention() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionIdRef = useRef<string | null>(null);

  const startSubmission = useCallback(() => {
    if (isSubmitting) return null;
    
    const submissionId = crypto.getRandomValues(new Uint8Array(16))
      .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
    
    submissionIdRef.current = submissionId;
    setIsSubmitting(true);
    
    return submissionId;
  }, [isSubmitting]);

  const endSubmission = useCallback((submissionId: string) => {
    if (submissionIdRef.current === submissionId) {
      setIsSubmitting(false);
      submissionIdRef.current = null;
    }
  }, []);

  const cancelSubmission = useCallback(() => {
    setIsSubmitting(false);
    submissionIdRef.current = null;
  }, []);

  return {
    isSubmitting,
    startSubmission,
    endSubmission,
    cancelSubmission,
  };
}

// ============= Rate Limiting =============

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

/**
 * Hook للحد من معدل المحاولات
 */
export function useRateLimiting(config: RateLimitConfig = { maxAttempts: 3, windowMs: 60000 }) {
  const attemptsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // تنظيف المحاولات القديمة
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < config.windowMs
    );
    
    // التحقق من الحد
    if (attemptsRef.current.length >= config.maxAttempts) {
      return false;
    }
    
    // تسجيل المحاولة الجديدة
    attemptsRef.current.push(now);
    return true;
  }, [config.maxAttempts, config.windowMs]);

  const getRemainingAttempts = useCallback((): number => {
    const now = Date.now();
    const validAttempts = attemptsRef.current.filter(
      timestamp => now - timestamp < config.windowMs
    );
    return Math.max(0, config.maxAttempts - validAttempts.length);
  }, [config.maxAttempts, config.windowMs]);

  const getTimeUntilReset = useCallback((): number => {
    if (attemptsRef.current.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attemptsRef.current);
    const resetTime = oldestAttempt + config.windowMs;
    return Math.max(0, resetTime - Date.now());
  }, [config.windowMs]);

  const resetAttempts = useCallback(() => {
    attemptsRef.current = [];
  }, []);

  return {
    checkRateLimit,
    getRemainingAttempts,
    getTimeUntilReset,
    resetAttempts,
  };
}

// ============= Session Security =============

/**
 * Hook لإدارة أمان الجلسة
 */
export function useSessionSecurity(timeoutMs: number = 300000) { // 5 دقائق افتراضياً
  const [isSessionValid, setIsSessionValid] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsSessionValid(true);
    
    // إعادة تعيين المؤقت
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsSessionValid(false);
    }, timeoutMs);
  }, [timeoutMs]);

  const checkSession = useCallback((): boolean => {
    const elapsed = Date.now() - lastActivityRef.current;
    const valid = elapsed < timeoutMs;
    setIsSessionValid(valid);
    return valid;
  }, [timeoutMs]);

  const endSession = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSessionValid(false);
  }, []);

  return {
    isSessionValid,
    updateActivity,
    checkSession,
    endSession,
  };
}

// ============= Tokenization Service =============

/**
 * خدمة Tokenization للبطاقات
 */
export class CardTokenizationService {
  private static instance: CardTokenizationService;
  private tokens: Map<string, TokenizedCard> = new Map();

  private constructor() {}

  static getInstance(): CardTokenizationService {
    if (!CardTokenizationService.instance) {
      CardTokenizationService.instance = new CardTokenizationService();
    }
    return CardTokenizationService.instance;
  }

  async tokenize(cardData: CardFormData): Promise<TokenizedCard> {
    const token = generateCardToken(cardData);
    const fingerprint = await generateCardFingerprint(cardData.cardNumber);
    const lastFour = cardData.cardNumber.replace(/\s/g, '').slice(-4);
    const [expiryMonth, expiryYear] = cardData.expiryDate.split('/');

    // تحديد نوع البطاقة
    let brand = 'unknown';
    const cleanNumber = cardData.cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) brand = 'visa';
    else if (/^5[1-5]/.test(cleanNumber)) brand = 'mastercard';
    else if (/^3[47]/.test(cleanNumber)) brand = 'amex';
    else if (/^6(?:011|5)/.test(cleanNumber)) brand = 'discover';

    const tokenizedCard: TokenizedCard = {
      token,
      lastFour,
      brand,
      expiryMonth,
      expiryYear: `20${expiryYear}`,
      fingerprint,
    };

    // تخزين Token (في الذاكرة فقط - لا يتم تخزين بيانات البطاقة الفعلية)
    this.tokens.set(token, tokenizedCard);

    return tokenizedCard;
  }

  getTokenInfo(token: string): TokenizedCard | null {
    return this.tokens.get(token) || null;
  }

  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  clearAllTokens(): void {
    this.tokens.clear();
  }
}

// ============= Hook الأمان الشامل =============

export interface UseCardSecurityOptions {
  enableTokenization?: boolean;
  enableEncryption?: boolean;
  maxRetries?: number;
  sessionTimeout?: number;
  rateLimitAttempts?: number;
  rateLimitWindow?: number;
}

export function useCardSecurity(options: UseCardSecurityOptions = {}) {
  const {
    enableTokenization = true,
    enableEncryption = true,
    maxRetries = 3,
    sessionTimeout = 300000,
    rateLimitAttempts = 3,
    rateLimitWindow = 60000,
  } = options;

  const doubleSubmit = useDoubleSubmitPrevention();
  const rateLimit = useRateLimiting({ maxAttempts: rateLimitAttempts, windowMs: rateLimitWindow });
  const session = useSessionSecurity(sessionTimeout);
  const csrfTokenRef = useRef(generateCSRFToken());

  const processPayment = useCallback(async (
    cardData: CardFormData,
    onProcess: (data: { token?: string; encrypted?: string }) => Promise<void>
  ) => {
    // التحقق من الجلسة
    if (!session.checkSession()) {
      throw new Error('انتهت صلاحية الجلسة');
    }

    // التحقق من Rate Limit
    if (!rateLimit.checkRateLimit()) {
      const waitTime = Math.ceil(rateLimit.getTimeUntilReset() / 1000);
      throw new Error(`تجاوزت الحد المسموح. انتظر ${waitTime} ثانية`);
    }

    // منع الإرسال المزدوج
    const submissionId = doubleSubmit.startSubmission();
    if (!submissionId) {
      throw new Error('جاري معالجة طلب سابق');
    }

    try {
      let processedData: { token?: string; encrypted?: string } = {};

      // Tokenization
      if (enableTokenization) {
        const tokenService = CardTokenizationService.getInstance();
        const tokenized = await tokenService.tokenize(cardData);
        processedData.token = tokenized.token;
      }

      // التشفير
      if (enableEncryption) {
        const sensitiveData = JSON.stringify({
          number: cardData.cardNumber,
          cvv: cardData.cvv,
        });
        processedData.encrypted = await encryptCardData(sensitiveData);
      }

      // تحديث النشاط
      session.updateActivity();

      // معالجة الدفع
      await onProcess(processedData);

    } finally {
      doubleSubmit.endSubmission(submissionId);
    }
  }, [
    session,
    rateLimit,
    doubleSubmit,
    enableTokenization,
    enableEncryption,
  ]);

  return {
    processPayment,
    isSubmitting: doubleSubmit.isSubmitting,
    isSessionValid: session.isSessionValid,
    remainingAttempts: rateLimit.getRemainingAttempts(),
    csrfToken: csrfTokenRef.current,
    updateActivity: session.updateActivity,
    cancelSubmission: doubleSubmit.cancelSubmission,
  };
}

export default useCardSecurity;
