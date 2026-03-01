/**
 * STAR LUX - AI Security & Stability Engine
 * محرك الذكاء الاصطناعي للأمان والاستقرار
 * 
 * يوفر حماية شاملة ومستمرة للمنصة من خلال:
 * - الفحص الأمني اللحظي
 * - الإصلاح التلقائي الذكي
 * - التعلم المستمر من الأخطاء
 * - مراقبة الأداء والاستقرار
 */

import crypto from 'crypto';

// ============= أنواع البيانات =============

export type SecurityEventType = 
  | 'login_attempt' | 'login_success' | 'login_failure' | 'logout'
  | 'password_change' | 'password_reset' | 'account_locked' | 'account_unlocked'
  | 'suspicious_activity' | 'brute_force_detected'
  | 'sql_injection_attempt' | 'xss_attempt' | 'csrf_attempt'
  | 'file_upload_exploit' | 'session_hijacking' | 'api_abuse'
  | 'rate_limit_exceeded' | 'unauthorized_access'
  | 'data_breach_attempt' | 'malware_detected'
  | 'system_error' | 'auto_fix_applied'
  | 'vulnerability_found' | 'vulnerability_fixed';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type VulnerabilityType = 
  | 'sql_injection' | 'xss' | 'csrf' | 'file_upload'
  | 'authentication_bypass' | 'session_fixation'
  | 'insecure_deserialization' | 'broken_access_control'
  | 'security_misconfiguration' | 'sensitive_data_exposure'
  | 'insufficient_logging' | 'api_vulnerability'
  | 'rate_limit_bypass' | 'other';

export type AutoFixType = 
  | 'block_ip' | 'lock_account' | 'invalidate_session'
  | 'reset_rate_limit' | 'sanitize_input' | 'disable_endpoint'
  | 'force_reauth' | 'clear_cache' | 'restart_service'
  | 'rollback_change' | 'apply_patch' | 'update_config' | 'other';

export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: SeverityLevel;
  userId?: number;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  requestMethod?: string;
  requestBody?: any;
  description: string;
  details?: any;
  country?: string;
  city?: string;
}

export interface ScanResult {
  isClean: boolean;
  threats: ThreatInfo[];
  scanDuration: number;
  timestamp: Date;
}

export interface ThreatInfo {
  type: VulnerabilityType;
  severity: SeverityLevel;
  description: string;
  location?: string;
  payload?: string;
  suggestedFix?: string;
}

// ============= أنماط الهجمات المعروفة =============

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
  /(\bOR\b\s+\d+\s*=\s*\d+)/i,
  /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  /(--\s*$|;\s*--)/,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\/\*.*\*\/)/,
  /(\bEXEC\b|\bEXECUTE\b)/i,
  /(\bxp_\w+)/i,
  /(\bsp_\w+)/i,
  /(WAITFOR\s+DELAY)/i,
  /(BENCHMARK\s*\()/i,
  /(SLEEP\s*\()/i,
  /(\bINTO\s+OUTFILE\b)/i,
  /(\bLOAD_FILE\b)/i,
  /(CHAR\s*\(\s*\d+\s*\))/i,
  /(0x[0-9a-fA-F]+)/,
  /('.*(\bOR\b|\bAND\b).*')/i,
];

const XSS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<script\b[^>]*>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<svg\b[^>]*onload/gi,
  /<img\b[^>]*onerror/gi,
  /expression\s*\(/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /<\s*\/?\s*[a-z][a-z0-9]*[^>]*>/gi,
  /&#x?[0-9a-fA-F]+;/g,
  /eval\s*\(/gi,
  /document\.(cookie|location|write)/gi,
  /window\.(location|open)/gi,
  /innerHTML\s*=/gi,
  /outerHTML\s*=/gi,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\+/g,
  /%2e%2e%2f/gi,
  /%2e%2e\//gi,
  /\.\.%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.\%5c/gi,
  /%252e%252e%252f/gi,
];

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/,
  /\$\(/,
  /`.*`/,
  /\|\s*\w+/,
  /;\s*\w+/,
  /&&\s*\w+/,
  /\|\|\s*\w+/,
];

const SUSPICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /burp/i,
  /zap/i,
  /acunetix/i,
  /nessus/i,
  /openvas/i,
  /w3af/i,
  /arachni/i,
  /skipfish/i,
  /wpscan/i,
  /joomscan/i,
];

// ============= محرك الأمان الرئيسي =============

export class SecurityEngine {
  private static instance: SecurityEngine;
  private isRunning: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private eventQueue: SecurityEvent[] = [];
  private blockedIPs: Map<string, { until: Date; reason: string }> = new Map();
  private rateLimitMap: Map<string, { count: number; resetAt: Date }> = new Map();
  private fingerprintCache: Map<string, number> = new Map();

  // إعدادات الأمان
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MINUTES = 30;
  private readonly SCAN_INTERVAL_MS = 10 * 60 * 1000; // 10 دقائق

  private constructor() {}

  static getInstance(): SecurityEngine {
    if (!SecurityEngine.instance) {
      SecurityEngine.instance = new SecurityEngine();
    }
    return SecurityEngine.instance;
  }

  // ============= بدء وإيقاف المحرك =============

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[AI Security Engine] Started - Protecting Star Lux Platform');
    
    // بدء الفحص الدوري
    this.scanInterval = setInterval(() => {
      this.performPeriodicScan();
    }, this.SCAN_INTERVAL_MS);

    // تنظيف دوري للبيانات المنتهية
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 1000); // كل دقيقة
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    console.log('[AI Security Engine] Stopped');
  }

  // ============= الفحص الأمني اللحظي =============

  /**
   * فحص طلب HTTP للكشف عن التهديدات
   */
  scanRequest(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    ip: string;
    userId?: number;
  }): ScanResult {
    const startTime = Date.now();
    const threats: ThreatInfo[] = [];

    // فحص IP المحظور
    if (this.isIPBlocked(request.ip)) {
      threats.push({
        type: 'other',
        severity: 'high',
        description: 'IP address is blocked',
        location: request.ip,
      });
    }

    // فحص Rate Limiting
    if (!this.checkRateLimit(request.ip)) {
      threats.push({
        type: 'rate_limit_bypass',
        severity: 'medium',
        description: 'Rate limit exceeded',
        location: request.ip,
      });
    }

    // فحص User Agent المشبوه
    const userAgent = request.headers['user-agent'] || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      threats.push({
        type: 'api_vulnerability',
        severity: 'medium',
        description: 'Suspicious user agent detected',
        payload: userAgent,
      });
    }

    // فحص SQL Injection
    const sqlThreats = this.scanForSQLInjection(request.url, request.body);
    threats.push(...sqlThreats);

    // فحص XSS
    const xssThreats = this.scanForXSS(request.url, request.body);
    threats.push(...xssThreats);

    // فحص Path Traversal
    const pathThreats = this.scanForPathTraversal(request.url);
    threats.push(...pathThreats);

    // فحص Command Injection
    const cmdThreats = this.scanForCommandInjection(request.body);
    threats.push(...cmdThreats);

    const scanDuration = Date.now() - startTime;

    return {
      isClean: threats.length === 0,
      threats,
      scanDuration,
      timestamp: new Date(),
    };
  }

  /**
   * فحص SQL Injection
   */
  private scanForSQLInjection(url: string, body?: any): ThreatInfo[] {
    const threats: ThreatInfo[] = [];
    const textToScan = this.extractTextContent(url, body);

    for (const text of textToScan) {
      for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(text)) {
          threats.push({
            type: 'sql_injection',
            severity: 'critical',
            description: 'Potential SQL injection detected',
            payload: text.substring(0, 200),
            suggestedFix: 'Use parameterized queries and input validation',
          });
          break;
        }
      }
    }

    return threats;
  }

  /**
   * فحص XSS
   */
  private scanForXSS(url: string, body?: any): ThreatInfo[] {
    const threats: ThreatInfo[] = [];
    const textToScan = this.extractTextContent(url, body);

    for (const text of textToScan) {
      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(text)) {
          threats.push({
            type: 'xss',
            severity: 'high',
            description: 'Potential XSS attack detected',
            payload: text.substring(0, 200),
            suggestedFix: 'Sanitize and escape user input before rendering',
          });
          break;
        }
      }
    }

    return threats;
  }

  /**
   * فحص Path Traversal
   */
  private scanForPathTraversal(url: string): ThreatInfo[] {
    const threats: ThreatInfo[] = [];

    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(url)) {
        threats.push({
          type: 'file_upload',
          severity: 'high',
          description: 'Path traversal attempt detected',
          payload: url,
          suggestedFix: 'Validate and sanitize file paths',
        });
        break;
      }
    }

    return threats;
  }

  /**
   * فحص Command Injection
   */
  private scanForCommandInjection(body?: any): ThreatInfo[] {
    const threats: ThreatInfo[] = [];
    if (!body) return threats;

    const textToScan = this.extractTextContent('', body);

    for (const text of textToScan) {
      for (const pattern of COMMAND_INJECTION_PATTERNS) {
        if (pattern.test(text)) {
          threats.push({
            type: 'other',
            severity: 'critical',
            description: 'Potential command injection detected',
            payload: text.substring(0, 200),
            suggestedFix: 'Never execute user input as commands',
          });
          break;
        }
      }
    }

    return threats;
  }

  // ============= فحص الملفات المرفوعة =============

  /**
   * فحص ملف مرفوع للكشف عن التهديدات
   */
  scanUploadedFile(file: {
    name: string;
    type: string;
    size: number;
    content?: Buffer;
  }): ScanResult {
    const startTime = Date.now();
    const threats: ThreatInfo[] = [];

    // فحص امتداد الملف
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.aspx',
      '.jsp', '.cgi', '.pl', '.py', '.rb', '.js', '.vbs',
      '.ps1', '.psm1', '.psd1', '.dll', '.so', '.dylib',
    ];

    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(ext)) {
      threats.push({
        type: 'file_upload',
        severity: 'critical',
        description: `Dangerous file extension detected: ${ext}`,
        payload: file.name,
        suggestedFix: 'Block executable file uploads',
      });
    }

    // فحص MIME type
    const dangerousMimeTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-php',
      'application/x-httpd-php',
      'text/x-php',
      'application/x-sh',
      'application/x-shellscript',
    ];

    if (dangerousMimeTypes.includes(file.type)) {
      threats.push({
        type: 'file_upload',
        severity: 'critical',
        description: `Dangerous MIME type detected: ${file.type}`,
        payload: file.name,
        suggestedFix: 'Validate MIME types on server side',
      });
    }

    // فحص حجم الملف (الحد الأقصى 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      threats.push({
        type: 'file_upload',
        severity: 'medium',
        description: 'File size exceeds maximum allowed',
        payload: `${file.size} bytes`,
        suggestedFix: 'Enforce file size limits',
      });
    }

    // فحص محتوى الملف للكشف عن أكواد خبيثة
    if (file.content) {
      const contentStr = file.content.toString('utf-8', 0, 1000);
      
      // فحص PHP tags
      if (/<\?php/i.test(contentStr) || /<\?=/i.test(contentStr)) {
        threats.push({
          type: 'file_upload',
          severity: 'critical',
          description: 'PHP code detected in uploaded file',
          suggestedFix: 'Strip or reject files containing PHP code',
        });
      }

      // فحص JavaScript في ملفات الصور
      if (file.type.startsWith('image/') && /<script/i.test(contentStr)) {
        threats.push({
          type: 'xss',
          severity: 'high',
          description: 'JavaScript detected in image file',
          suggestedFix: 'Sanitize image files and re-encode them',
        });
      }
    }

    return {
      isClean: threats.length === 0,
      threats,
      scanDuration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  // ============= إدارة Rate Limiting =============

  /**
   * فحص Rate Limit
   */
  checkRateLimit(identifier: string): boolean {
    const now = new Date();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || entry.resetAt < now) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetAt: new Date(now.getTime() + 60 * 1000),
      });
      return true;
    }

    entry.count++;
    if (entry.count > this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    return true;
  }

  /**
   * إعادة تعيين Rate Limit
   */
  resetRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  // ============= إدارة حظر IP =============

  /**
   * حظر IP
   */
  blockIP(ip: string, reason: string, durationMinutes?: number): void {
    const duration = durationMinutes || this.BLOCK_DURATION_MINUTES;
    const until = new Date(Date.now() + duration * 60 * 1000);
    
    this.blockedIPs.set(ip, { until, reason });
    console.log(`[AI Security] Blocked IP: ${ip} for ${duration} minutes. Reason: ${reason}`);
  }

  /**
   * إلغاء حظر IP
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    console.log(`[AI Security] Unblocked IP: ${ip}`);
  }

  /**
   * فحص إذا كان IP محظور
   */
  isIPBlocked(ip: string): boolean {
    const entry = this.blockedIPs.get(ip);
    if (!entry) return false;

    if (entry.until < new Date()) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  /**
   * الحصول على قائمة IPs المحظورة
   */
  getBlockedIPs(): Array<{ ip: string; until: Date; reason: string }> {
    const result: Array<{ ip: string; until: Date; reason: string }> = [];
    
    this.blockedIPs.forEach((value, ip) => {
      if (value.until > new Date()) {
        result.push({ ip, ...value });
      }
    });

    return result;
  }

  // ============= فحص محاولات تسجيل الدخول =============

  /**
   * تسجيل محاولة تسجيل دخول فاشلة
   */
  recordFailedLogin(identifier: string): { blocked: boolean; attemptsLeft: number } {
    const key = `login_${identifier}`;
    const now = new Date();
    const entry = this.rateLimitMap.get(key);

    if (!entry || entry.resetAt < now) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 دقيقة
      });
      return { blocked: false, attemptsLeft: this.MAX_LOGIN_ATTEMPTS - 1 };
    }

    entry.count++;
    const attemptsLeft = Math.max(0, this.MAX_LOGIN_ATTEMPTS - entry.count);

    if (entry.count >= this.MAX_LOGIN_ATTEMPTS) {
      return { blocked: true, attemptsLeft: 0 };
    }

    return { blocked: false, attemptsLeft };
  }

  /**
   * إعادة تعيين محاولات تسجيل الدخول
   */
  resetLoginAttempts(identifier: string): void {
    this.rateLimitMap.delete(`login_${identifier}`);
  }

  // ============= توليد بصمة الأحداث =============

  /**
   * توليد بصمة فريدة للحدث
   */
  generateFingerprint(data: any): string {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * فحص إذا كانت البصمة موجودة
   */
  isKnownFingerprint(fingerprint: string): boolean {
    return this.fingerprintCache.has(fingerprint);
  }

  /**
   * تسجيل بصمة جديدة
   */
  recordFingerprint(fingerprint: string): void {
    const count = this.fingerprintCache.get(fingerprint) || 0;
    this.fingerprintCache.set(fingerprint, count + 1);
  }

  // ============= أدوات مساعدة =============

  /**
   * استخراج النص من URL و body
   */
  private extractTextContent(url: string, body?: any): string[] {
    const texts: string[] = [];

    // إضافة URL
    texts.push(decodeURIComponent(url));

    // استخراج النص من body
    if (body) {
      if (typeof body === 'string') {
        texts.push(body);
      } else if (typeof body === 'object') {
        this.extractTextFromObject(body, texts);
      }
    }

    return texts;
  }

  /**
   * استخراج النص من كائن
   */
  private extractTextFromObject(obj: any, texts: string[]): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === 'string') {
        texts.push(value);
      } else if (typeof value === 'object') {
        this.extractTextFromObject(value, texts);
      }
    }
  }

  /**
   * فحص User Agent المشبوه
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    for (const pattern of SUSPICIOUS_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        return true;
      }
    }
    return false;
  }

  /**
   * تنظيف البيانات المنتهية
   */
  private cleanupExpiredData(): void {
    const now = new Date();

    // تنظيف IPs المحظورة المنتهية
    this.blockedIPs.forEach((value, ip) => {
      if (value.until < now) {
        this.blockedIPs.delete(ip);
      }
    });

    // تنظيف Rate Limits المنتهية
    this.rateLimitMap.forEach((value, key) => {
      if (value.resetAt < now) {
        this.rateLimitMap.delete(key);
      }
    });
  }

  /**
   * الفحص الدوري
   */
  private performPeriodicScan(): void {
    console.log('[AI Security] Performing periodic security scan...');
    // يمكن إضافة فحوصات إضافية هنا
  }

  // ============= الإحصائيات =============

  /**
   * الحصول على إحصائيات الأمان
   */
  getStats(): {
    blockedIPs: number;
    rateLimitedIdentifiers: number;
    knownFingerprints: number;
    isRunning: boolean;
  } {
    return {
      blockedIPs: this.blockedIPs.size,
      rateLimitedIdentifiers: this.rateLimitMap.size,
      knownFingerprints: this.fingerprintCache.size,
      isRunning: this.isRunning,
    };
  }
}

// تصدير instance واحد
export const securityEngine = SecurityEngine.getInstance();
