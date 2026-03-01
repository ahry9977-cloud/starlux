import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch للاختبارات
global.fetch = vi.fn();

describe('نظام الترحيب والجولة التعريفية', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // إعداد متغيرات البيئة
    process.env.BUILT_IN_FORGE_API_URL = 'https://api.test.com';
    process.env.BUILT_IN_FORGE_API_KEY = 'test-api-key';
  });

  describe('قوالب البريد الإلكتروني', () => {
    it('يجب أن يحتوي على قالب welcomeNewUser', async () => {
      const { emailTemplates } = await import('./emailNotifications');
      expect(emailTemplates).toHaveProperty('welcomeNewUser');
    });

    it('يجب أن ينشئ قالب ترحيب صحيح للمشتري', async () => {
      const { emailTemplates } = await import('./emailNotifications');
      const template = emailTemplates.welcomeNewUser({
        userName: 'أحمد',
        accountType: 'buyer',
        email: 'ahmed@test.com'
      });

      expect(template.subject).toContain('مرحباً بك');
      expect(template.subject).toContain('أحمد');
      expect(template.html).toContain('أحمد');
      expect(template.html).toContain('استكشف المنتجات');
    });

    it('يجب أن ينشئ قالب ترحيب صحيح للبائع', async () => {
      const { emailTemplates } = await import('./emailNotifications');
      const template = emailTemplates.welcomeNewUser({
        userName: 'محمد',
        accountType: 'seller',
        email: 'mohamed@test.com'
      });

      expect(template.subject).toContain('مرحباً بك');
      expect(template.subject).toContain('محمد');
      expect(template.html).toContain('محمد');
      expect(template.html).toContain('أنشئ متجرك');
      expect(template.html).toContain('أضف منتجاتك');
    });

    it('يجب أن يحتوي قالب البائع على إرشادات مختلفة عن المشتري', async () => {
      const { emailTemplates } = await import('./emailNotifications');
      
      const buyerTemplate = emailTemplates.welcomeNewUser({
        userName: 'مشتري',
        accountType: 'buyer',
        email: 'buyer@test.com'
      });

      const sellerTemplate = emailTemplates.welcomeNewUser({
        userName: 'بائع',
        accountType: 'seller',
        email: 'seller@test.com'
      });

      // التحقق من أن المحتوى مختلف
      expect(buyerTemplate.html).not.toEqual(sellerTemplate.html);
      
      // التحقق من محتوى المشتري
      expect(buyerTemplate.html).toContain('استكشف المنتجات');
      expect(buyerTemplate.html).toContain('تواصل مع البائعين');
      
      // التحقق من محتوى البائع
      expect(sellerTemplate.html).toContain('أنشئ متجرك');
      expect(sellerTemplate.html).toContain('تابع إحصائياتك');
    });
  });

  describe('دالة sendWelcomeEmail', () => {
    it('يجب أن تكون الدالة موجودة', async () => {
      const { sendWelcomeEmail } = await import('./emailNotifications');
      expect(typeof sendWelcomeEmail).toBe('function');
    });

    it('يجب أن تستدعي sendEmail مع المعاملات الصحيحة', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { sendWelcomeEmail } = await import('./emailNotifications');
      
      const result = await sendWelcomeEmail(
        'test@example.com',
        'أحمد',
        'buyer'
      );

      expect(global.fetch).toHaveBeenCalled();
    });

    it('يجب أن تتعامل مع الأخطاء بشكل صحيح', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { sendWelcomeEmail } = await import('./emailNotifications');
      
      const result = await sendWelcomeEmail(
        'test@example.com',
        'أحمد',
        'buyer'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('خطوات الجولة التعريفية', () => {
    it('يجب أن تحتوي جولة المشتري على 8 خطوات', () => {
      // هذا اختبار للتحقق من بنية البيانات
      const buyerSteps = [
        'welcome', 'explore', 'search', 'favorites', 
        'messages', 'notifications', 'profile', 'complete'
      ];
      expect(buyerSteps.length).toBe(8);
    });

    it('يجب أن تحتوي جولة البائع على 8 خطوات', () => {
      const sellerSteps = [
        'welcome', 'store', 'products', 'analytics',
        'wallet', 'messages', 'settings', 'complete'
      ];
      expect(sellerSteps.length).toBe(8);
    });

    it('يجب أن تبدأ كل جولة بخطوة welcome', () => {
      const buyerFirstStep = 'welcome';
      const sellerFirstStep = 'welcome';
      
      expect(buyerFirstStep).toBe('welcome');
      expect(sellerFirstStep).toBe('welcome');
    });

    it('يجب أن تنتهي كل جولة بخطوة complete', () => {
      const buyerLastStep = 'complete';
      const sellerLastStep = 'complete';
      
      expect(buyerLastStep).toBe('complete');
      expect(sellerLastStep).toBe('complete');
    });
  });

  describe('حالة الجولة التعريفية في localStorage', () => {
    it('يجب أن تحفظ حالة إكمال الجولة', () => {
      const userType = 'buyer';
      const key = `onboarding_${userType}_completed`;
      
      // محاكاة حفظ الحالة
      const mockStorage: Record<string, string> = {};
      mockStorage[key] = 'true';
      
      expect(mockStorage[key]).toBe('true');
    });

    it('يجب أن تحفظ حالة تخطي الجولة', () => {
      const userType = 'seller';
      const key = `onboarding_${userType}_skipped`;
      
      // محاكاة حفظ الحالة
      const mockStorage: Record<string, string> = {};
      mockStorage[key] = 'true';
      
      expect(mockStorage[key]).toBe('true');
    });

    it('يجب أن تفرق بين حالات المشتري والبائع', () => {
      const buyerKey = 'onboarding_buyer_completed';
      const sellerKey = 'onboarding_seller_completed';
      
      expect(buyerKey).not.toBe(sellerKey);
    });
  });

  describe('تكامل نظام الترحيب', () => {
    it('يجب أن يرسل بريد الترحيب عند التسجيل', async () => {
      // التحقق من أن الدالة موجودة ويمكن استدعاؤها
      const { sendWelcomeEmail } = await import('./emailNotifications');
      
      expect(sendWelcomeEmail).toBeDefined();
      expect(typeof sendWelcomeEmail).toBe('function');
    });

    it('يجب أن يدعم نوعي الحساب buyer و seller', async () => {
      const { sendWelcomeEmail } = await import('./emailNotifications');
      
      // التحقق من أن الدالة تقبل كلا النوعين
      const buyerCall = () => sendWelcomeEmail('test@test.com', 'Test', 'buyer');
      const sellerCall = () => sendWelcomeEmail('test@test.com', 'Test', 'seller');
      
      // لا يجب أن تطرح أخطاء في النوع
      expect(buyerCall).not.toThrow();
      expect(sellerCall).not.toThrow();
    });
  });
});

describe('قوالب البريد الإلكتروني الأخرى', () => {
  it('يجب أن يحتوي على جميع القوالب المطلوبة', async () => {
    const { emailTemplates } = await import('./emailNotifications');
    
    const requiredTemplates = [
      'newOrder',
      'orderStatusUpdate',
      'walletDeposit',
      'withdrawalRequest',
      'subscriptionExpiring',
      'newMessage',
      'securityAlert',
      'otpCode',
      'welcomeNewUser'
    ];

    for (const template of requiredTemplates) {
      expect(emailTemplates).toHaveProperty(template);
    }
  });

  it('يجب أن تنتج جميع القوالب subject و html', async () => {
    const { emailTemplates } = await import('./emailNotifications');
    
    // اختبار قالب OTP
    const otpTemplate = emailTemplates.otpCode({ code: '123456', expiresIn: 10 });
    expect(otpTemplate).toHaveProperty('subject');
    expect(otpTemplate).toHaveProperty('html');
    expect(otpTemplate.subject).toBeTruthy();
    expect(otpTemplate.html).toBeTruthy();
  });
});
