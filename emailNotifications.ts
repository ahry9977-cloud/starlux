/**
 * نظام إشعارات البريد الإلكتروني
 * STAR LUX Platform
 */

import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

type EmailOptions = {
  to: string;
}

// قوالب البريد الإلكتروني
const emailTemplates = {
  // إشعار طلب جديد
  newOrder: (data: { orderNumber: string; total: number; buyerName: string }) => ({
    subject: `طلب جديد #${data.orderNumber} - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
          <p style="color: #888; margin: 5px 0;">منصة التجارة الإلكترونية</p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #00d4ff; margin-top: 0;">🎉 طلب جديد!</h2>
          <p>لديك طلب جديد من <strong>${data.buyerName}</strong></p>
          <div style="background: rgba(0,212,255,0.1); padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>رقم الطلب:</strong> #${data.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>المبلغ الإجمالي:</strong> $${data.total.toFixed(2)}</p>
          </div>
          <a href="https://starlux.manus.space/seller-dashboard" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0099cc); color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">عرض الطلب</a>
        </div>
        <div style="text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 STAR LUX - جميع الحقوق محفوظة</p>
        </div>
      </div>
    `,
  }),

  // إشعار تحديث حالة الطلب
  orderStatusUpdate: (data: { orderNumber: string; status: string; statusAr: string }) => ({
    subject: `تحديث حالة الطلب #${data.orderNumber} - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h2 style="color: #00d4ff; margin-top: 0;">📦 تحديث حالة الطلب</h2>
          <p>تم تحديث حالة طلبك رقم <strong>#${data.orderNumber}</strong></p>
          <div style="background: rgba(0,212,255,0.1); padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
            <p style="font-size: 24px; margin: 0; color: #00d4ff;">${data.statusAr}</p>
          </div>
          <a href="https://starlux.manus.space/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0099cc); color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">تتبع الطلب</a>
        </div>
      </div>
    `,
  }),

  // إشعار إيداع في المحفظة
  walletDeposit: (data: { amount: number; newBalance: number }) => ({
    subject: `تم إيداع $${data.amount.toFixed(2)} في محفظتك - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h2 style="color: #10b981; margin-top: 0;">💰 إيداع جديد!</h2>
          <p>تم إيداع مبلغ في محفظتك</p>
          <div style="background: rgba(16,185,129,0.1); padding: 20px; border-radius: 5px; margin: 15px 0; text-align: center;">
            <p style="font-size: 32px; margin: 0; color: #10b981;">+$${data.amount.toFixed(2)}</p>
            <p style="color: #888; margin: 10px 0 0;">الرصيد الجديد: $${data.newBalance.toFixed(2)}</p>
          </div>
          <a href="https://starlux.manus.space/seller/wallet" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">عرض المحفظة</a>
        </div>
      </div>
    `,
  }),

  // إشعار طلب سحب
  withdrawalRequest: (data: { amount: number; status: string; statusAr: string }) => ({
    subject: `تحديث طلب السحب - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h2 style="color: #00d4ff; margin-top: 0;">💳 تحديث طلب السحب</h2>
          <div style="background: rgba(0,212,255,0.1); padding: 20px; border-radius: 5px; margin: 15px 0; text-align: center;">
            <p style="font-size: 24px; margin: 0;">$${data.amount.toFixed(2)}</p>
            <p style="color: ${data.status === 'completed' ? '#10b981' : data.status === 'rejected' ? '#ef4444' : '#f59e0b'}; margin: 10px 0 0; font-weight: bold;">${data.statusAr}</p>
          </div>
          <a href="https://starlux.manus.space/seller/wallet" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0099cc); color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">عرض التفاصيل</a>
        </div>
      </div>
    `,
  }),

  // إشعار انتهاء الاشتراك
  subscriptionExpiring: (data: { daysLeft: number; planName: string }) => ({
    subject: `اشتراكك ينتهي قريباً - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h2 style="color: #f59e0b; margin-top: 0;">⚠️ تنبيه الاشتراك</h2>
          <p>اشتراكك في باقة <strong>${data.planName}</strong> ينتهي خلال <strong>${data.daysLeft} أيام</strong></p>
          <div style="background: rgba(245,158,11,0.1); padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0;">جدد اشتراكك الآن للاستمرار في الاستفادة من جميع المميزات</p>
          </div>
          <a href="https://starlux.manus.space/subscription-payment" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">تجديد الاشتراك</a>
        </div>
      </div>
    `,
  }),

  // إشعار رسالة جديدة
  newMessage: (data: { senderName: string; preview: string }) => ({
    subject: `رسالة جديدة من ${data.senderName} - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <h2 style="color: #00d4ff; margin-top: 0;">💬 رسالة جديدة</h2>
          <p>لديك رسالة جديدة من <strong>${data.senderName}</strong></p>
          <div style="background: rgba(0,212,255,0.1); padding: 15px; border-radius: 5px; margin: 15px 0; border-right: 3px solid #00d4ff;">
            <p style="margin: 0; color: #ccc;">"${data.preview.substring(0, 100)}${data.preview.length > 100 ? '...' : ''}"</p>
          </div>
          <a href="https://starlux.manus.space/messages" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0099cc); color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">عرض الرسالة</a>
        </div>
      </div>
    `,
  }),

  // إشعار أمني
  securityAlert: (data: { action: string; ip: string; device: string }) => ({
    subject: `تنبيه أمني - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
        </div>
        <div style="background: rgba(239,68,68,0.1); padding: 20px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.3);">
          <h2 style="color: #ef4444; margin-top: 0;">🔒 تنبيه أمني</h2>
          <p>تم رصد نشاط على حسابك:</p>
          <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>النشاط:</strong> ${data.action}</p>
            <p style="margin: 5px 0;"><strong>عنوان IP:</strong> ${data.ip}</p>
            <p style="margin: 5px 0;"><strong>الجهاز:</strong> ${data.device}</p>
          </div>
          <p style="color: #f87171;">إذا لم تكن أنت من قام بهذا النشاط، يرجى تغيير كلمة المرور فوراً.</p>
          <a href="https://starlux.manus.space/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">مراجعة الحساب</a>
        </div>
      </div>
    `,
  }),

  // رسالة ترحيب للمستخدمين الجدد
  welcomeNewUser: (data: { userName: string; accountType: 'buyer' | 'seller'; email: string }) => ({
    subject: `مرحباً بك في STAR LUX، ${data.userName}! ✨`,
    html: `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #0a0a0a;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4B00FF 0%, #FF00FF 50%, #00ffff 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 30px 30px;">
          <h1 style="color: #fff; margin: 0; font-size: 32px; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">STAR LUX ⭐</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">منصة التجارة الإلكترونية العالمية</p>
        </div>
        
        <!-- Welcome Message -->
        <div style="padding: 40px 30px; background: #0a0a0a;">
          <div style="background: linear-gradient(135deg, rgba(75,0,255,0.1) 0%, rgba(255,0,255,0.1) 100%); border: 1px solid rgba(75,0,255,0.3); border-radius: 20px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: #fff; margin: 0 0 15px; font-size: 24px;">مرحباً بك، ${data.userName}! 🎉</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 16px; line-height: 1.8;">
              ${data.accountType === 'seller' 
                ? 'تم إنشاء حسابك كبائع بنجاح! أنت الآن جزء من مجتمع البائعين المحترفين في STAR LUX.' 
                : 'تم إنشاء حسابك بنجاح! استعد لاستكشاف آلاف المنتجات المميزة.'}
            </p>
          </div>
          
          <!-- Quick Start Guide -->
          <h3 style="color: #4B00FF; margin: 0 0 20px; font-size: 18px;">🚀 ابدأ رحلتك الآن</h3>
          
          ${data.accountType === 'seller' ? `
          <!-- Seller Guide -->
          <div style="display: grid; gap: 15px;">
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border-right: 4px solid #4B00FF;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 24px;">🏪</span>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px; font-size: 16px;">أنشئ متجرك</h4>
                  <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">صمم متجرك وأضف شعارك ووصفك</p>
                </div>
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border-right: 4px solid #FF00FF;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 24px;">📦</span>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px; font-size: 16px;">أضف منتجاتك</h4>
                  <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">ارفع صور ومعلومات منتجاتك</p>
                </div>
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border-right: 4px solid #00ffff;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 24px;">📈</span>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px; font-size: 16px;">تابع إحصائياتك</h4>
                  <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">راقب المبيعات والزيارات</p>
                </div>
              </div>
            </div>
          </div>
          ` : `
          <!-- Buyer Guide -->
          <div style="display: grid; gap: 15px;">
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border-right: 4px solid #4B00FF;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 24px;">🛒</span>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px; font-size: 16px;">استكشف المنتجات</h4>
                  <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">تصفح آلاف المنتجات من مختلف الأقسام</p>
                </div>
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border-right: 4px solid #FF00FF;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 24px;">💬</span>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px; font-size: 16px;">تواصل مع البائعين</h4>
                  <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">راسل البائعين مباشرة للاستفسار</p>
                </div>
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border-right: 4px solid #00ffff;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 24px;">⭐</span>
                <div>
                  <h4 style="color: #fff; margin: 0 0 5px; font-size: 16px;">قيّم تجربتك</h4>
                  <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">شارك رأيك وساعد الآخرين</p>
                </div>
              </div>
            </div>
          </div>
          `}
          
          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://starlux.manus.space/${data.accountType === 'seller' ? 'seller-dashboard' : 'explore'}" 
               style="display: inline-block; background: linear-gradient(135deg, #4B00FF, #FF00FF); color: #fff; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 20px rgba(75,0,255,0.4);">
              ${data.accountType === 'seller' ? 'الذهاب للوحة التحكم' : 'استكشف المنتجات'}
            </a>
          </div>
          
          <!-- Tip Box -->
          <div style="background: linear-gradient(135deg, rgba(75,0,255,0.1), rgba(255,0,255,0.1)); border-radius: 15px; padding: 20px; margin-top: 30px; border: 1px solid rgba(75,0,255,0.2);">
            <p style="color: #4B00FF; margin: 0 0 10px; font-weight: bold;">💡 نصيحة سريعة</p>
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px; line-height: 1.6;">
              ${data.accountType === 'seller' 
                ? 'أضف صوراً عالية الجودة لمنتجاتك لزيادة فرص البيع بنسبة 40%!' 
                : 'فعّل الإشعارات لتكون أول من يعرف عن العروض والخصومات الحصرية!'}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: rgba(255,255,255,0.02); padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: rgba(255,255,255,0.5); margin: 0 0 15px; font-size: 14px;">
            هل لديك أسئلة؟ تواصل معنا عبر <a href="mailto:support@starlux.com" style="color: #4B00FF;">الدعم الفني</a>
          </p>
          <div style="margin-bottom: 15px;">
            <a href="#" style="color: rgba(255,255,255,0.4); text-decoration: none; margin: 0 10px; font-size: 13px;">سياسة الخصوصية</a>
            <a href="#" style="color: rgba(255,255,255,0.4); text-decoration: none; margin: 0 10px; font-size: 13px;">الشروط والأحكام</a>
            <a href="#" style="color: rgba(255,255,255,0.4); text-decoration: none; margin: 0 10px; font-size: 13px;">إلغاء الاشتراك</a>
          </div>
          <p style="color: rgba(255,255,255,0.3); margin: 0; font-size: 12px;">© 2024 STAR LUX - جميع الحقوق محفوظة</p>
        </div>
      </div>
    `,
  }),

  // رمز التحقق OTP
  otpCode: (data: { code: string; expiresIn: number }) => ({
    subject: `رمز التحقق الخاص بك - STAR LUX`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00d4ff; margin: 0;">⭐ STAR LUX</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="color: #00d4ff; margin-top: 0;">🔐 رمز التحقق</h2>
          <p>استخدم الرمز التالي للتحقق من هويتك:</p>
          <div style="background: rgba(0,212,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #00d4ff;">${data.code}</p>
          </div>
          <p style="color: #888; font-size: 14px;">صالح لمدة ${data.expiresIn} دقائق</p>
          <p style="color: #f87171; font-size: 12px; margin-top: 20px;">⚠️ لا تشارك هذا الرمز مع أي شخص</p>
        </div>
      </div>
    `,
  }),
};

// إرسال البريد الإلكتروني
export async function sendEmail(
  to: string,
  template: keyof typeof emailTemplates,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html } = emailTemplates[template](data);
    
    // استخدام Manus Notification API
    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/notification/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send error:', error);
      return { success: false, error };
    }

    // تسجيل الإرسال
    const db = await getDb();
    if (db) {
      const { notificationLogs } = await import('../drizzle/schema');
      await db.insert(notificationLogs).values({
        notificationId: 0,
        userId: 0,
        channel: 'email',
        status: 'sent',
        sentAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: String(error) };
  }
}

// إرسال إشعار للمستخدم عبر البريد
export async function notifyUserByEmail(
  userId: number,
  template: keyof typeof emailTemplates,
  data: any
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const { users, notificationSettings } = await import('../drizzle/schema');
    
    // جلب بيانات المستخدم
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.email) return false;

    // التحقق من إعدادات الإشعارات
    const [settings] = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId)).limit(1);
    if (settings && !settings.emailEnabled) return false;

    // إرسال البريد
    const result = await sendEmail(user.email, template, data);
    return result.success;
  } catch (error) {
    console.error('Notify user by email error:', error);
    return false;
  }
}

// إرسال إشعار للأدمن
export async function notifyAdminByEmail(
  template: keyof typeof emailTemplates,
  data: any
): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'a07501261239@gmail.com';
    const result = await sendEmail(adminEmail, template, data);
    return result.success;
  } catch (error) {
    console.error('Notify admin by email error:', error);
    return false;
  }
}

// إرسال بريد الترحيب للمستخدمين الجدد
export async function sendWelcomeEmail(
  email: string,
  userName: string,
  accountType: 'buyer' | 'seller'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Welcome Email] Sending welcome email to ${email} (${accountType})`);
    
    const result = await sendEmail(email, 'welcomeNewUser', {
      userName,
      accountType,
      email,
    });
    
    if (result.success) {
      console.log(`[Welcome Email] Successfully sent to ${email}`);
    } else {
      console.error(`[Welcome Email] Failed to send to ${email}:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('[Welcome Email] Error:', error);
    return { success: false, error: String(error) };
  }
}

export { emailTemplates };
