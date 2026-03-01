/**
 * STAR LUX - AI Learning Engine
 * نظام التعلم المستمر
 * 
 * يتعلم من:
 * - الأخطاء السابقة
 * - محاولات الهجوم
 * - سلوك المستخدمين
 * - تقارير الأداء
 */

import crypto from 'crypto';
import { ThreatInfo, SeverityLevel, VulnerabilityType } from './SecurityEngine';
import { AutoFixResult } from './AutoHealer';

export interface ErrorPattern {
  fingerprint: string;
  errorType: string;
  category: 'security' | 'performance' | 'stability' | 'database' | 'network' | 'authentication' | 'authorization' | 'validation' | 'business_logic' | 'other';
  description: string;
  occurrenceCount: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  knownSolution?: string;
  autoFixable: boolean;
  autoFixType?: string;
  isBlocked: boolean;
  blockRule?: string;
}

export interface BehaviorPattern {
  userId?: number;
  ip: string;
  pattern: string;
  riskScore: number;
  actions: string[];
  firstSeen: Date;
  lastSeen: Date;
  frequency: number;
}

export interface AttackSignature {
  id: string;
  name: string;
  type: VulnerabilityType;
  patterns: RegExp[];
  severity: SeverityLevel;
  description: string;
  mitigation: string;
  detectionCount: number;
  lastDetected?: Date;
}

// ============= نظام التعلم =============

export class LearningEngine {
  private static instance: LearningEngine;
  
  // قاعدة بيانات الأنماط
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private behaviorPatterns: Map<string, BehaviorPattern> = new Map();
  private attackSignatures: Map<string, AttackSignature> = new Map();
  
  // إحصائيات التعلم
  private learnedPatterns: number = 0;
  private blockedPatterns: number = 0;
  private autoFixedCount: number = 0;

  private constructor() {
    this.initializeDefaultSignatures();
  }

  static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance = new LearningEngine();
    }
    return LearningEngine.instance;
  }

  // ============= تهيئة التوقيعات الافتراضية =============

  private initializeDefaultSignatures(): void {
    // توقيعات SQL Injection
    this.addAttackSignature({
      id: 'sql_union_select',
      name: 'SQL UNION SELECT Injection',
      type: 'sql_injection',
      patterns: [/UNION\s+SELECT/i, /UNION\s+ALL\s+SELECT/i],
      severity: 'critical',
      description: 'Attempt to extract data using UNION SELECT',
      mitigation: 'Use parameterized queries',
      detectionCount: 0,
    });

    this.addAttackSignature({
      id: 'sql_or_bypass',
      name: 'SQL OR Bypass',
      type: 'sql_injection',
      patterns: [/'\s*OR\s*'?\d+\s*=\s*'?\d+/i, /'\s*OR\s*'[^']+'\s*=\s*'[^']+'/i],
      severity: 'critical',
      description: 'Attempt to bypass authentication using OR condition',
      mitigation: 'Use parameterized queries and input validation',
      detectionCount: 0,
    });

    // توقيعات XSS
    this.addAttackSignature({
      id: 'xss_script_tag',
      name: 'XSS Script Tag Injection',
      type: 'xss',
      patterns: [/<script\b[^>]*>/i, /<\/script>/i],
      severity: 'high',
      description: 'Attempt to inject script tags',
      mitigation: 'Sanitize and escape user input',
      detectionCount: 0,
    });

    this.addAttackSignature({
      id: 'xss_event_handler',
      name: 'XSS Event Handler Injection',
      type: 'xss',
      patterns: [/on\w+\s*=\s*["']?[^"'>\s]+/i],
      severity: 'high',
      description: 'Attempt to inject event handlers',
      mitigation: 'Strip event handlers from user input',
      detectionCount: 0,
    });

    // توقيعات Path Traversal
    this.addAttackSignature({
      id: 'path_traversal',
      name: 'Path Traversal Attack',
      type: 'file_upload',
      patterns: [/\.\.\//g, /\.\.\\+/g, /%2e%2e%2f/gi],
      severity: 'high',
      description: 'Attempt to access files outside allowed directory',
      mitigation: 'Validate and sanitize file paths',
      detectionCount: 0,
    });

    // توقيعات Brute Force
    this.addAttackSignature({
      id: 'brute_force_login',
      name: 'Brute Force Login Attempt',
      type: 'authentication_bypass',
      patterns: [], // يتم الكشف عنه بناءً على السلوك
      severity: 'high',
      description: 'Multiple failed login attempts from same source',
      mitigation: 'Implement account lockout and CAPTCHA',
      detectionCount: 0,
    });
  }

  // ============= إدارة توقيعات الهجمات =============

  /**
   * إضافة توقيع هجوم جديد
   */
  addAttackSignature(signature: AttackSignature): void {
    this.attackSignatures.set(signature.id, signature);
    this.learnedPatterns++;
  }

  /**
   * تحديث توقيع هجوم
   */
  updateAttackSignature(id: string, updates: Partial<AttackSignature>): boolean {
    const signature = this.attackSignatures.get(id);
    if (!signature) return false;

    Object.assign(signature, updates);
    return true;
  }

  /**
   * الحصول على جميع توقيعات الهجمات
   */
  getAttackSignatures(): AttackSignature[] {
    return Array.from(this.attackSignatures.values());
  }

  // ============= التعلم من الأخطاء =============

  /**
   * تسجيل خطأ جديد والتعلم منه
   */
  learnFromError(error: {
    type: string;
    category: ErrorPattern['category'];
    description: string;
    stackTrace?: string;
    endpoint?: string;
    component?: string;
  }): ErrorPattern {
    // توليد بصمة للخطأ
    const fingerprint = this.generateFingerprint({
      type: error.type,
      category: error.category,
      description: error.description.substring(0, 100),
    });

    // البحث عن نمط موجود
    let pattern = this.errorPatterns.get(fingerprint);

    if (pattern) {
      // تحديث النمط الموجود
      pattern.occurrenceCount++;
      pattern.lastOccurrence = new Date();
    } else {
      // إنشاء نمط جديد
      pattern = {
        fingerprint,
        errorType: error.type,
        category: error.category,
        description: error.description,
        occurrenceCount: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        autoFixable: false,
        isBlocked: false,
      };
      this.errorPatterns.set(fingerprint, pattern);
      this.learnedPatterns++;
    }

    // تحليل إمكانية الإصلاح التلقائي
    this.analyzeAutoFixability(pattern);

    return pattern;
  }

  /**
   * تحليل إمكانية الإصلاح التلقائي
   */
  private analyzeAutoFixability(pattern: ErrorPattern): void {
    // أنماط يمكن إصلاحها تلقائياً
    const autoFixableCategories = ['security', 'authentication', 'authorization'];
    
    if (autoFixableCategories.includes(pattern.category)) {
      pattern.autoFixable = true;
      
      // تحديد نوع الإصلاح
      switch (pattern.category) {
        case 'security':
          pattern.autoFixType = 'block_ip';
          pattern.knownSolution = 'Block the source IP and sanitize input';
          break;
        case 'authentication':
          pattern.autoFixType = 'force_reauth';
          pattern.knownSolution = 'Force re-authentication and invalidate session';
          break;
        case 'authorization':
          pattern.autoFixType = 'invalidate_session';
          pattern.knownSolution = 'Invalidate session and log the attempt';
          break;
      }
    }

    // إذا تكرر الخطأ كثيراً، اقترح حظره
    if (pattern.occurrenceCount >= 10 && !pattern.isBlocked) {
      pattern.knownSolution = `Consider blocking this pattern. Occurred ${pattern.occurrenceCount} times.`;
    }
  }

  // ============= التعلم من السلوك =============

  /**
   * تسجيل سلوك مستخدم
   */
  recordBehavior(behavior: {
    userId?: number;
    ip: string;
    action: string;
    endpoint?: string;
    timestamp?: Date;
  }): BehaviorPattern {
    const key = behavior.userId ? `user_${behavior.userId}` : `ip_${behavior.ip}`;
    let pattern = this.behaviorPatterns.get(key);

    if (pattern) {
      pattern.actions.push(behavior.action);
      pattern.lastSeen = behavior.timestamp || new Date();
      pattern.frequency++;
      
      // الاحتفاظ بآخر 100 إجراء فقط
      if (pattern.actions.length > 100) {
        pattern.actions = pattern.actions.slice(-100);
      }
    } else {
      pattern = {
        userId: behavior.userId,
        ip: behavior.ip,
        pattern: 'normal',
        riskScore: 0,
        actions: [behavior.action],
        firstSeen: behavior.timestamp || new Date(),
        lastSeen: behavior.timestamp || new Date(),
        frequency: 1,
      };
      this.behaviorPatterns.set(key, pattern);
    }

    // تحليل السلوك
    this.analyzeBehavior(pattern);

    return pattern;
  }

  /**
   * تحليل سلوك مستخدم
   */
  private analyzeBehavior(pattern: BehaviorPattern): void {
    // حساب نقاط المخاطر
    let riskScore = 0;

    // التردد العالي يزيد المخاطر
    if (pattern.frequency > 100) riskScore += 20;
    if (pattern.frequency > 500) riskScore += 30;

    // الإجراءات المشبوهة
    const suspiciousActions = ['failed_login', 'unauthorized_access', 'rate_limit_exceeded'];
    const suspiciousCount = pattern.actions.filter(a => suspiciousActions.includes(a)).length;
    riskScore += suspiciousCount * 5;

    // تحديد نمط السلوك
    if (riskScore >= 70) {
      pattern.pattern = 'malicious';
    } else if (riskScore >= 40) {
      pattern.pattern = 'suspicious';
    } else {
      pattern.pattern = 'normal';
    }

    pattern.riskScore = Math.min(100, riskScore);
  }

  /**
   * الحصول على أنماط السلوك المشبوهة
   */
  getSuspiciousBehaviors(): BehaviorPattern[] {
    return Array.from(this.behaviorPatterns.values())
      .filter(p => p.pattern !== 'normal')
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  // ============= التعلم من التهديدات =============

  /**
   * التعلم من تهديد مكتشف
   */
  learnFromThreat(threat: ThreatInfo, wasBlocked: boolean): void {
    // البحث عن توقيع مطابق
    const signatures = Array.from(this.attackSignatures.values());
    for (const signature of signatures) {
      if (signature.type === threat.type) {
        signature.detectionCount++;
        signature.lastDetected = new Date();
        
        // تحديث شدة التوقيع إذا لزم الأمر
        if (signature.detectionCount > 100 && signature.severity !== 'critical') {
          signature.severity = 'critical';
        }
      }
    }

    // إنشاء توقيع جديد إذا كان التهديد جديداً
    if (threat.payload) {
      const newSignatureId = this.generateFingerprint({
        type: threat.type,
        payload: threat.payload.substring(0, 50),
      });

      if (!this.attackSignatures.has(newSignatureId)) {
        // محاولة استخراج نمط من الحمولة
        const extractedPattern = this.extractPattern(threat.payload);
        if (extractedPattern) {
          this.addAttackSignature({
            id: newSignatureId,
            name: `Learned ${threat.type} pattern`,
            type: threat.type,
            patterns: [extractedPattern],
            severity: threat.severity,
            description: `Auto-learned pattern from detected threat`,
            mitigation: threat.suggestedFix || 'Review and apply appropriate mitigation',
            detectionCount: 1,
            lastDetected: new Date(),
          });
        }
      }
    }
  }

  /**
   * استخراج نمط من نص
   */
  private extractPattern(text: string): RegExp | null {
    try {
      // تنظيف النص وإنشاء نمط بسيط
      const escaped = text
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .substring(0, 50);
      return new RegExp(escaped, 'i');
    } catch {
      return null;
    }
  }

  // ============= التعلم من الإصلاحات =============

  /**
   * التعلم من نتيجة إصلاح
   */
  learnFromFix(fix: AutoFixResult, wasEffective: boolean): void {
    if (wasEffective) {
      this.autoFixedCount++;
      
      // تحديث أنماط الأخطاء ذات الصلة
      const patterns = Array.from(this.errorPatterns.values());
      for (const pattern of patterns) {
        if (pattern.autoFixType === fix.fixType) {
          pattern.autoFixable = true;
          pattern.knownSolution = fix.description;
        }
      }
    }
  }

  // ============= الحظر والمنع =============

  /**
   * حظر نمط خطأ
   */
  blockPattern(fingerprint: string, rule: string): boolean {
    const pattern = this.errorPatterns.get(fingerprint);
    if (!pattern) return false;

    pattern.isBlocked = true;
    pattern.blockRule = rule;
    this.blockedPatterns++;

    return true;
  }

  /**
   * إلغاء حظر نمط خطأ
   */
  unblockPattern(fingerprint: string): boolean {
    const pattern = this.errorPatterns.get(fingerprint);
    if (!pattern) return false;

    pattern.isBlocked = false;
    pattern.blockRule = undefined;
    this.blockedPatterns--;

    return true;
  }

  /**
   * فحص إذا كان النمط محظوراً
   */
  isPatternBlocked(fingerprint: string): boolean {
    const pattern = this.errorPatterns.get(fingerprint);
    return pattern?.isBlocked || false;
  }

  // ============= أدوات مساعدة =============

  /**
   * توليد بصمة
   */
  private generateFingerprint(data: any): string {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 32);
  }

  // ============= الإحصائيات =============

  /**
   * الحصول على إحصائيات التعلم
   */
  getStats(): {
    learnedPatterns: number;
    blockedPatterns: number;
    autoFixedCount: number;
    errorPatterns: number;
    behaviorPatterns: number;
    attackSignatures: number;
    suspiciousBehaviors: number;
  } {
    return {
      learnedPatterns: this.learnedPatterns,
      blockedPatterns: this.blockedPatterns,
      autoFixedCount: this.autoFixedCount,
      errorPatterns: this.errorPatterns.size,
      behaviorPatterns: this.behaviorPatterns.size,
      attackSignatures: this.attackSignatures.size,
      suspiciousBehaviors: this.getSuspiciousBehaviors().length,
    };
  }

  /**
   * الحصول على أكثر الأخطاء تكراراً
   */
  getMostFrequentErrors(limit: number = 10): ErrorPattern[] {
    return Array.from(this.errorPatterns.values())
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, limit);
  }

  /**
   * الحصول على أحدث التوقيعات المكتشفة
   */
  getRecentDetections(limit: number = 10): AttackSignature[] {
    return Array.from(this.attackSignatures.values())
      .filter(s => s.lastDetected)
      .sort((a, b) => (b.lastDetected?.getTime() || 0) - (a.lastDetected?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * تصدير البيانات المتعلمة
   */
  exportLearningData(): {
    errorPatterns: ErrorPattern[];
    attackSignatures: AttackSignature[];
    stats: ReturnType<LearningEngine['getStats']>;
  } {
    return {
      errorPatterns: Array.from(this.errorPatterns.values()),
      attackSignatures: Array.from(this.attackSignatures.values()),
      stats: this.getStats(),
    };
  }
}

// تصدير instance واحد
export const learningEngine = LearningEngine.getInstance();
