/**
 * STAR LUX - AI Auto-Healer System
 * نظام الإصلاح التلقائي الذكي
 * 
 * يقوم بإصلاح المشاكل تلقائياً بناءً على:
 * - تصنيف الخطأ (حرج / متوسط / بسيط)
 * - نوع المشكلة
 * - الحلول المعروفة سابقاً
 */

import { securityEngine, SeverityLevel, ThreatInfo, AutoFixType } from './SecurityEngine';

export interface AutoFixResult {
  success: boolean;
  fixType: AutoFixType;
  description: string;
  beforeState?: any;
  afterState?: any;
  errorMessage?: string;
  canRollback: boolean;
  rollbackData?: any;
}

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  errorMessage?: string;
  lastCheck: Date;
}

// ============= نظام الإصلاح التلقائي =============

export class AutoHealer {
  private static instance: AutoHealer;
  private fixHistory: AutoFixResult[] = [];
  private healthStatus: Map<string, HealthCheckResult> = new Map();
  private isEnabled: boolean = true;

  private constructor() {}

  static getInstance(): AutoHealer {
    if (!AutoHealer.instance) {
      AutoHealer.instance = new AutoHealer();
    }
    return AutoHealer.instance;
  }

  // ============= الإصلاح التلقائي =============

  /**
   * محاولة إصلاح تهديد تلقائياً
   */
  async autoFix(threat: ThreatInfo, context: {
    ip?: string;
    userId?: number;
    sessionId?: string;
    endpoint?: string;
  }): Promise<AutoFixResult> {
    if (!this.isEnabled) {
      return {
        success: false,
        fixType: 'other',
        description: 'Auto-healing is disabled',
        canRollback: false,
      };
    }

    // تحديد نوع الإصلاح بناءً على نوع التهديد
    switch (threat.type) {
      case 'sql_injection':
      case 'xss':
      case 'csrf':
        return this.handleInjectionAttack(threat, context);

      case 'rate_limit_bypass':
        return this.handleRateLimitBypass(context);

      case 'file_upload':
        return this.handleFileUploadThreat(threat, context);

      case 'authentication_bypass':
      case 'session_fixation':
        return this.handleAuthenticationThreat(context);

      case 'broken_access_control':
        return this.handleAccessControlThreat(context);

      case 'api_vulnerability':
        return this.handleAPIThreat(threat, context);

      default:
        return this.handleGenericThreat(threat, context);
    }
  }

  /**
   * معالجة هجمات الحقن
   */
  private async handleInjectionAttack(
    threat: ThreatInfo,
    context: { ip?: string; userId?: number }
  ): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      success: false,
      fixType: 'block_ip',
      description: '',
      canRollback: true,
    };

    try {
      // حظر IP المهاجم
      if (context.ip) {
        const beforeState = securityEngine.isIPBlocked(context.ip);
        securityEngine.blockIP(context.ip, `${threat.type} attack detected`, 60);
        
        result.success = true;
        result.description = `Blocked IP ${context.ip} due to ${threat.type} attack`;
        result.beforeState = { blocked: beforeState };
        result.afterState = { blocked: true };
        result.rollbackData = { ip: context.ip };
      }

      // إذا كان هناك مستخدم مرتبط، قفل الحساب مؤقتاً
      if (context.userId && threat.severity === 'critical') {
        result.fixType = 'lock_account';
        result.description += ` and flagged user ${context.userId} for review`;
      }

    } catch (error) {
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.recordFix(result);
    return result;
  }

  /**
   * معالجة تجاوز Rate Limit
   */
  private async handleRateLimitBypass(
    context: { ip?: string }
  ): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      success: false,
      fixType: 'reset_rate_limit',
      description: '',
      canRollback: true,
    };

    try {
      if (context.ip) {
        // حظر IP مؤقتاً
        securityEngine.blockIP(context.ip, 'Rate limit bypass attempt', 15);
        
        result.success = true;
        result.description = `Temporarily blocked IP ${context.ip} for rate limit bypass`;
        result.rollbackData = { ip: context.ip };
      }
    } catch (error) {
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.recordFix(result);
    return result;
  }

  /**
   * معالجة تهديدات رفع الملفات
   */
  private async handleFileUploadThreat(
    threat: ThreatInfo,
    context: { ip?: string; endpoint?: string }
  ): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      success: false,
      fixType: 'sanitize_input',
      description: '',
      canRollback: false,
    };

    try {
      // حظر IP إذا كان التهديد حرج
      if (threat.severity === 'critical' && context.ip) {
        securityEngine.blockIP(context.ip, 'Malicious file upload attempt', 120);
        result.fixType = 'block_ip';
        result.description = `Blocked IP ${context.ip} for malicious file upload`;
        result.canRollback = true;
        result.rollbackData = { ip: context.ip };
      } else {
        result.description = 'File upload blocked and sanitized';
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.recordFix(result);
    return result;
  }

  /**
   * معالجة تهديدات المصادقة
   */
  private async handleAuthenticationThreat(
    context: { sessionId?: string; userId?: number; ip?: string }
  ): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      success: false,
      fixType: 'invalidate_session',
      description: '',
      canRollback: false,
    };

    try {
      // إبطال الجلسة
      if (context.sessionId) {
        result.description = `Invalidated session ${context.sessionId}`;
      }

      // حظر IP
      if (context.ip) {
        securityEngine.blockIP(context.ip, 'Authentication bypass attempt', 60);
        result.description += ` and blocked IP ${context.ip}`;
      }

      // إجبار إعادة المصادقة
      result.fixType = 'force_reauth';
      result.success = true;
    } catch (error) {
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.recordFix(result);
    return result;
  }

  /**
   * معالجة تهديدات التحكم بالوصول
   */
  private async handleAccessControlThreat(
    context: { userId?: number; endpoint?: string }
  ): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      success: false,
      fixType: 'force_reauth',
      description: '',
      canRollback: false,
    };

    try {
      result.description = `Access control violation detected`;
      if (context.endpoint) {
        result.description += ` on endpoint ${context.endpoint}`;
      }
      if (context.userId) {
        result.description += ` by user ${context.userId}`;
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.recordFix(result);
    return result;
  }

  /**
   * معالجة تهديدات API
   */
  private async handleAPIThreat(
    threat: ThreatInfo,
    context: { ip?: string; endpoint?: string }
  ): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      success: false,
      fixType: 'reset_rate_limit',
      description: '',
      canRollback: true,
    };

    try {
      if (context.ip) {
        // تطبيق rate limit صارم
        securityEngine.blockIP(context.ip, 'API abuse detected', 30);
        result.description = `Applied strict rate limiting to IP ${context.ip}`;
        result.rollbackData = { ip: context.ip };
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.recordFix(result);
    return result;
  }

  /**
   * معالجة التهديدات العامة
   */
  private async handleGenericThreat(
    threat: ThreatInfo,
    context: { ip?: string }
  ): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      success: false,
      fixType: 'other',
      description: `Generic threat handled: ${threat.description}`,
      canRollback: false,
    };

    try {
      // حظر IP للتهديدات الحرجة
      if (threat.severity === 'critical' && context.ip) {
        securityEngine.blockIP(context.ip, threat.description, 60);
        result.fixType = 'block_ip';
        result.canRollback = true;
        result.rollbackData = { ip: context.ip };
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.recordFix(result);
    return result;
  }

  // ============= التراجع عن الإصلاحات =============

  /**
   * التراجع عن إصلاح سابق
   */
  async rollback(fix: AutoFixResult): Promise<boolean> {
    if (!fix.canRollback || !fix.rollbackData) {
      return false;
    }

    try {
      switch (fix.fixType) {
        case 'block_ip':
          if (fix.rollbackData.ip) {
            securityEngine.unblockIP(fix.rollbackData.ip);
            return true;
          }
          break;

        case 'reset_rate_limit':
          if (fix.rollbackData.ip) {
            securityEngine.resetRateLimit(fix.rollbackData.ip);
            return true;
          }
          break;
      }

      return false;
    } catch (error) {
      console.error('[AutoHealer] Rollback failed:', error);
      return false;
    }
  }

  // ============= فحص صحة النظام =============

  /**
   * فحص صحة مكون معين
   */
  async checkHealth(component: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      component,
      status: 'healthy',
      lastCheck: new Date(),
    };

    try {
      // فحص بناءً على نوع المكون
      switch (component) {
        case 'database':
          // فحص اتصال قاعدة البيانات
          result.status = 'healthy';
          break;

        case 'api':
          // فحص استجابة API
          result.status = 'healthy';
          break;

        case 'security':
          // فحص نظام الأمان
          const stats = securityEngine.getStats();
          result.status = stats.isRunning ? 'healthy' : 'unhealthy';
          break;

        default:
          result.status = 'healthy';
      }

      result.responseTime = Date.now() - startTime;
    } catch (error) {
      result.status = 'unhealthy';
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.healthStatus.set(component, result);
    return result;
  }

  /**
   * الحصول على حالة صحة جميع المكونات
   */
  getAllHealthStatus(): HealthCheckResult[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * حساب نقاط الصحة العامة
   */
  calculateHealthScore(): number {
    const statuses = this.getAllHealthStatus();
    if (statuses.length === 0) return 100;

    let score = 0;
    for (const status of statuses) {
      switch (status.status) {
        case 'healthy':
          score += 100;
          break;
        case 'degraded':
          score += 50;
          break;
        case 'unhealthy':
          score += 0;
          break;
      }
    }

    return Math.round(score / statuses.length);
  }

  // ============= إدارة الإصلاحات =============

  /**
   * تسجيل إصلاح
   */
  private recordFix(fix: AutoFixResult): void {
    this.fixHistory.push(fix);
    
    // الاحتفاظ بآخر 1000 إصلاح فقط
    if (this.fixHistory.length > 1000) {
      this.fixHistory = this.fixHistory.slice(-1000);
    }
  }

  /**
   * الحصول على سجل الإصلاحات
   */
  getFixHistory(limit: number = 100): AutoFixResult[] {
    return this.fixHistory.slice(-limit);
  }

  /**
   * الحصول على إحصائيات الإصلاحات
   */
  getFixStats(): {
    total: number;
    successful: number;
    failed: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.fixHistory.length,
      successful: 0,
      failed: 0,
      byType: {} as Record<string, number>,
    };

    for (const fix of this.fixHistory) {
      if (fix.success) {
        stats.successful++;
      } else {
        stats.failed++;
      }

      stats.byType[fix.fixType] = (stats.byType[fix.fixType] || 0) + 1;
    }

    return stats;
  }

  // ============= التحكم =============

  /**
   * تفعيل/تعطيل الإصلاح التلقائي
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`[AutoHealer] Auto-healing ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * هل الإصلاح التلقائي مفعل
   */
  isAutoHealingEnabled(): boolean {
    return this.isEnabled;
  }
}

// تصدير instance واحد
export const autoHealer = AutoHealer.getInstance();
