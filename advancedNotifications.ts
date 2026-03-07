/**
 * نظام الإشعارات المتقدم
 * STAR LUX Platform
 */

import { getDb } from "./db";
import { notifications, notificationSettings, notificationLogs, supportedCurrencies, currencyConversions } from "./drizzle/schema";
import { eq, and, desc, sql, inArray, lt, isNull, or } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// ============= أنواع الإشعارات =============
export type NotificationCategory = 
  | 'orders'
  | 'payments'
  | 'wallet'
  | 'store'
  | 'subscription'
  | 'system'
  | 'communication';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationType = 
  // الطلبات
  | 'order_new'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_refunded'
  // المدفوعات
  | 'payment_received'
  | 'payment_failed'
  | 'commission_deducted'
  // المحفظة والسحب
  | 'wallet_credited'
  | 'withdrawal_requested'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'withdrawal_completed'
  | 'withdrawal_failed'
  // المتجر
  | 'store_approved'
  | 'store_suspended'
  | 'product_approved'
  | 'product_rejected'
  | 'low_stock'
  // الاشتراك
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'subscription_renewed'
  // النظام
  | 'system_alert'
  | 'system_update'
  | 'security_alert'
  | 'promotion'
  // التواصل
  | 'new_message'
  | 'review_received'
  | 'support_reply';

// قوالب الإشعارات
const notificationTemplates: Record<NotificationType, {
  title: string;
  template: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  icon: string;
}> = {
  // الطلبات
  order_new: {
    title: '🛒 طلب جديد',
    template: 'لديك طلب جديد رقم #{orderId} بقيمة {amount} {currency}',
    category: 'orders',
    priority: 'high',
    icon: 'shopping-cart'
  },
  order_confirmed: {
    title: '✅ تم تأكيد الطلب',
    template: 'تم تأكيد طلبك رقم #{orderId}',
    category: 'orders',
    priority: 'normal',
    icon: 'check-circle'
  },
  order_shipped: {
    title: '🚚 تم شحن الطلب',
    template: 'تم شحن طلبك رقم #{orderId}. رقم التتبع: {trackingNumber}',
    category: 'orders',
    priority: 'normal',
    icon: 'truck'
  },
  order_delivered: {
    title: '📦 تم التسليم',
    template: 'تم تسليم طلبك رقم #{orderId} بنجاح',
    category: 'orders',
    priority: 'normal',
    icon: 'package'
  },
  order_cancelled: {
    title: '❌ إلغاء الطلب',
    template: 'تم إلغاء الطلب رقم #{orderId}. السبب: {reason}',
    category: 'orders',
    priority: 'high',
    icon: 'x-circle'
  },
  order_refunded: {
    title: '💸 استرداد المبلغ',
    template: 'تم استرداد {amount} {currency} للطلب رقم #{orderId}',
    category: 'orders',
    priority: 'high',
    icon: 'refresh-cw'
  },
  
  // المدفوعات
  payment_received: {
    title: '💰 استلام دفعة',
    template: 'تم استلام {amount} {currency} للطلب رقم #{orderId}',
    category: 'payments',
    priority: 'high',
    icon: 'dollar-sign'
  },
  payment_failed: {
    title: '⚠️ فشل الدفع',
    template: 'فشل الدفع للطلب رقم #{orderId}. السبب: {reason}',
    category: 'payments',
    priority: 'urgent',
    icon: 'alert-triangle'
  },
  commission_deducted: {
    title: '💳 خصم العمولة',
    template: 'تم خصم عمولة {commissionRate}% بقيمة {commission} {currency}',
    category: 'payments',
    priority: 'normal',
    icon: 'percent'
  },
  
  // المحفظة والسحب
  wallet_credited: {
    title: '💵 إضافة للمحفظة',
    template: 'تمت إضافة {amount} {currency} لمحفظتك',
    category: 'wallet',
    priority: 'high',
    icon: 'wallet'
  },
  withdrawal_requested: {
    title: '📤 طلب سحب جديد',
    template: 'تم استلام طلب سحب بقيمة {amount} {currency}',
    category: 'wallet',
    priority: 'normal',
    icon: 'upload'
  },
  withdrawal_approved: {
    title: '✅ الموافقة على السحب',
    template: 'تمت الموافقة على طلب السحب بقيمة {amount} {currency}',
    category: 'wallet',
    priority: 'high',
    icon: 'check'
  },
  withdrawal_rejected: {
    title: '❌ رفض طلب السحب',
    template: 'تم رفض طلب السحب. السبب: {reason}',
    category: 'wallet',
    priority: 'high',
    icon: 'x'
  },
  withdrawal_completed: {
    title: '🎉 اكتمال التحويل',
    template: 'تم تحويل {amount} {currency} إلى حسابك بنجاح',
    category: 'wallet',
    priority: 'high',
    icon: 'check-circle'
  },
  withdrawal_failed: {
    title: '⚠️ فشل التحويل',
    template: 'فشل تحويل {amount} {currency}. السبب: {reason}',
    category: 'wallet',
    priority: 'urgent',
    icon: 'alert-circle'
  },
  
  // المتجر
  store_approved: {
    title: '🏪 تم اعتماد المتجر',
    template: 'تهانينا! تم اعتماد متجرك "{storeName}"',
    category: 'store',
    priority: 'high',
    icon: 'store'
  },
  store_suspended: {
    title: '🚫 تعليق المتجر',
    template: 'تم تعليق متجرك "{storeName}". السبب: {reason}',
    category: 'store',
    priority: 'urgent',
    icon: 'ban'
  },
  product_approved: {
    title: '✅ اعتماد المنتج',
    template: 'تم اعتماد منتجك "{productName}"',
    category: 'store',
    priority: 'normal',
    icon: 'check'
  },
  product_rejected: {
    title: '❌ رفض المنتج',
    template: 'تم رفض منتجك "{productName}". السبب: {reason}',
    category: 'store',
    priority: 'high',
    icon: 'x'
  },
  low_stock: {
    title: '📦 مخزون منخفض',
    template: 'المنتج "{productName}" وصل لـ {stock} قطعة فقط',
    category: 'store',
    priority: 'high',
    icon: 'alert-triangle'
  },
  
  // الاشتراك
  subscription_expiring: {
    title: '⏰ اشتراك قارب على الانتهاء',
    template: 'اشتراكك سينتهي خلال {daysLeft} أيام',
    category: 'subscription',
    priority: 'high',
    icon: 'clock'
  },
  subscription_expired: {
    title: '🔴 انتهى الاشتراك',
    template: 'انتهى اشتراكك. قم بالتجديد للاستمرار',
    category: 'subscription',
    priority: 'urgent',
    icon: 'alert-circle'
  },
  subscription_renewed: {
    title: '🎉 تجديد الاشتراك',
    template: 'تم تجديد اشتراكك حتى {expiryDate}',
    category: 'subscription',
    priority: 'normal',
    icon: 'refresh-cw'
  },
  
  // النظام
  system_alert: {
    title: '🔔 تنبيه النظام',
    template: '{message}',
    category: 'system',
    priority: 'normal',
    icon: 'bell'
  },
  system_update: {
    title: '🆕 تحديث جديد',
    template: '{message}',
    category: 'system',
    priority: 'low',
    icon: 'info'
  },
  security_alert: {
    title: '🔒 تنبيه أمني',
    template: '{message}',
    category: 'system',
    priority: 'urgent',
    icon: 'shield'
  },
  promotion: {
    title: '🎁 عرض خاص',
    template: '{message}',
    category: 'system',
    priority: 'low',
    icon: 'gift'
  },
  
  // التواصل
  new_message: {
    title: '💬 رسالة جديدة',
    template: 'لديك رسالة جديدة من {senderName}',
    category: 'communication',
    priority: 'normal',
    icon: 'message-circle'
  },
  review_received: {
    title: '⭐ تقييم جديد',
    template: 'حصلت على تقييم {rating}/5 من {buyerName}',
    category: 'communication',
    priority: 'normal',
    icon: 'star'
  },
  support_reply: {
    title: '📩 رد الدعم',
    template: 'تم الرد على تذكرتك رقم #{ticketId}',
    category: 'communication',
    priority: 'normal',
    icon: 'mail'
  }
};

// ============= وظائف الإشعارات =============

/**
 * إنشاء إشعار جديد
 */
export async function createAdvancedNotification(
  userId: number,
  type: NotificationType,
  data: Record<string, any> = {},
  options: {
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: Date;
    sendEmail?: boolean;
  } = {}
): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const template = notificationTemplates[type];
  if (!template) return undefined;

  // استبدال المتغيرات في القالب
  let message = template.template;
  for (const [key, value] of Object.entries(data)) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }

  const inserted = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title: template.title,
      message,
      data: JSON.stringify(data),
      category: template.category,
      priority: template.priority,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      expiresAt: options.expiresAt,
      isRead: false,
      isArchived: false,
      emailSent: false,
    } as any)
    .returning({ id: (notifications as any).id });

  const notificationId = Number((inserted as any)?.[0]?.id ?? 0) || undefined;

  // إرسال بريد إلكتروني إذا مطلوب
  if (options.sendEmail && notificationId) {
    await sendNotificationEmail(userId, notificationId, template.title, message);
  }

  return notificationId;
}

/**
 * إرسال إشعار بالبريد الإلكتروني
 */
async function sendNotificationEmail(
  userId: number,
  notificationId: number,
  title: string,
  message: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // تسجيل محاولة الإرسال
    await db.insert(notificationLogs).values({
      notificationId,
      userId,
      status: 'pending',
    });

    // إرسال البريد عبر نظام الإشعارات
    const sent = await notifyOwner({
      title,
      content: message,
    });

    // تحديث حالة الإرسال
    if (Boolean(sent)) {
      await db.update(notifications as any)
        .set({ emailSent: true, emailSentAt: new Date() })
        .where(eq((notifications as any).id, notificationId));

      await db.update(notificationLogs as any)
        .set({ status: 'sent', sentAt: new Date() })
        .where(and(
          eq((notificationLogs as any).notificationId, notificationId)
        ));
    }

    return Boolean(sent);
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

/**
 * الحصول على إشعارات المستخدم
 */
export async function getUserNotifications(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: NotificationCategory;
    includeArchived?: boolean;
  } = {}
) {
  const db = await getDb();
  if (!db) return { notifications: [], total: 0, unreadCount: 0 };

  const {
    limit = 50,
    offset = 0,
    unreadOnly = false,
    category,
    includeArchived = false,
  } = options;

  const conditions: any[] = [eq(notifications.userId, userId)];

  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  if (category) {
    conditions.push(eq((notifications as any).category, category));
  }

  if (!includeArchived) {
    conditions.push(eq((notifications as any).isArchived, false));
  }

  // إزالة الإشعارات المنتهية الصلاحية
  conditions.push(
    or(
      isNull((notifications as any).expiresAt),
      sql`${(notifications as any).expiresAt} > NOW()`
    )
  );

  const [notificationsList, totalResult, unreadResult] = await Promise.all([
    db.select()
      .from(notifications as any)
      .where(and(...conditions))
      .orderBy(desc((notifications as any).createdAt))
      .limit(limit)
      .offset(offset),
    
    db.select({ count: sql<number>`COUNT(*)` })
      .from(notifications as any)
      .where(and(...conditions)),
    
    db.select({ count: sql<number>`COUNT(*)` })
      .from(notifications as any)
      .where(and(
        eq((notifications as any).userId, userId),
        eq((notifications as any).isRead, false),
        eq((notifications as any).isArchived, false)
      ))
  ]);

  return {
    notifications: notificationsList,
    total: totalResult[0]?.count || 0,
    unreadCount: unreadResult[0]?.count || 0,
  };
}

/**
 * تحديد إشعار كمقروء
 */
export async function markAsRead(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));

  return true;
}

/**
 * تحديد جميع الإشعارات كمقروءة
 */
export async function markAllAsRead(userId: number, category?: NotificationCategory): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const conditions: any[] = [
    eq(notifications.userId, userId),
    eq(notifications.isRead, false)
  ];

  if (category) {
    conditions.push(eq((notifications as any).category, category));
  }

  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(...conditions));

  return true;
}

/**
 * أرشفة إشعار
 */
export async function archiveNotification(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(notifications)
    .set({ isArchived: true })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));

  return true;
}

/**
 * حذف إشعار
 */
export async function deleteNotification(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(notifications)
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));

  return true;
}

/**
 * حذف جميع الإشعارات المقروءة
 */
export async function deleteAllRead(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const countRes = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications as any)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, true)));
  const count = Number((countRes as any)?.[0]?.count ?? 0);

  await db
    .delete(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, true)));

  return count;
}

// ============= إعدادات الإشعارات =============

/**
 * الحصول على إعدادات الإشعارات للمستخدم
 */
export async function getNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const settings = await db.select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    // إنشاء إعدادات افتراضية
    await db.insert(notificationSettings).values({ userId });
    return getNotificationSettings(userId);
  }

  return settings[0];
}

/**
 * تحديث إعدادات الإشعارات
 */
export async function updateNotificationSettings(
  userId: number,
  settings: Partial<{
    emailEnabled: boolean;
    emailOrders: boolean;
    emailPayments: boolean;
    emailWallet: boolean;
    emailStore: boolean;
    emailSubscription: boolean;
    emailSystem: boolean;
    emailCommunication: boolean;
    inAppEnabled: boolean;
    inAppSound: boolean;
    pushEnabled: boolean;
  }>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // التأكد من وجود إعدادات للمستخدم
  await getNotificationSettings(userId);

  await db.update(notificationSettings)
    .set(settings)
    .where(eq(notificationSettings.userId, userId));

  return true;
}

// ============= العملات =============

/**
 * الحصول على العملات المدعومة
 */
export async function getSupportedCurrencies() {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(supportedCurrencies)
    .where(eq(supportedCurrencies.isActive, true))
    .orderBy(supportedCurrencies.code);
}

/**
 * تحويل العملة
 */
export async function convertCurrency(
  userId: number,
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<{
  success: boolean;
  convertedAmount?: number;
  exchangeRate?: number;
  fee?: number;
  error?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database connection failed' };

  try {
    // الحصول على أسعار الصرف
    const currencies = await db.select()
      .from(supportedCurrencies)
      .where(inArray(supportedCurrencies.code, [fromCurrency, toCurrency]));

    const fromRate = currencies.find((c: any) => c.code === fromCurrency)?.exchangeRate;
    const toRate = currencies.find((c: any) => c.code === toCurrency)?.exchangeRate;

    if (!fromRate || !toRate) {
      return { success: false, error: 'Currency not supported' };
    }

    // حساب سعر الصرف
    const exchangeRate = Number(toRate) / Number(fromRate);
    const fee = amount * 0.01; // رسوم 1%
    const convertedAmount = (amount - fee) * exchangeRate;

    // تسجيل التحويل
    await db.insert(currencyConversions).values({
      userId,
      fromCurrency,
      toCurrency,
      fromAmount: String(amount),
      toAmount: String(convertedAmount),
      exchangeRate: String(exchangeRate),
      fee: String(fee),
      status: 'completed',
    });

    return {
      success: true,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      exchangeRate: Math.round(exchangeRate * 1000000) / 1000000,
      fee: Math.round(fee * 100) / 100,
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    return { success: false, error: 'Conversion failed' };
  }
}

/**
 * الحصول على سجل تحويلات العملات
 */
export async function getCurrencyConversionHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(currencyConversions)
    .where(eq((currencyConversions as any).userId, userId))
    .orderBy(desc((currencyConversions as any).createdAt))
    .limit(limit);
}

// ============= إشعارات مخصصة للعمليات المالية =============

/**
 * إشعار طلب سحب جديد (للأدمن)
 */
export async function notifyAdminWithdrawalRequest(
  adminId: number,
  sellerId: number,
  amount: number,
  currency: string
) {
  return createAdvancedNotification(adminId, 'withdrawal_requested', {
    sellerId,
    amount,
    currency,
  }, {
    actionUrl: '/admin/payments',
    actionLabel: 'مراجعة الطلب',
    sendEmail: true,
  });
}

/**
 * إشعار الموافقة على السحب (للبائع)
 */
export async function notifySellerWithdrawalApproved(
  sellerId: number,
  amount: number,
  currency: string
) {
  return createAdvancedNotification(sellerId, 'withdrawal_approved', {
    amount,
    currency,
  }, {
    actionUrl: '/seller/wallet',
    actionLabel: 'عرض المحفظة',
    sendEmail: true,
  });
}

/**
 * إشعار رفض السحب (للبائع)
 */
export async function notifySellerWithdrawalRejected(
  sellerId: number,
  amount: number,
  currency: string,
  reason: string
) {
  return createAdvancedNotification(sellerId, 'withdrawal_rejected', {
    amount,
    currency,
    reason,
  }, {
    actionUrl: '/seller/wallet',
    actionLabel: 'عرض المحفظة',
    sendEmail: true,
  });
}

/**
 * إشعار اكتمال التحويل (للبائع)
 */
export async function notifySellerWithdrawalCompleted(
  sellerId: number,
  amount: number,
  currency: string
) {
  return createAdvancedNotification(sellerId, 'withdrawal_completed', {
    amount,
    currency,
  }, {
    actionUrl: '/seller/wallet',
    actionLabel: 'عرض المحفظة',
    sendEmail: true,
  });
}

/**
 * إشعار إضافة رصيد للمحفظة (للبائع)
 */
export async function notifySellerWalletCredited(
  sellerId: number,
  amount: number,
  currency: string,
  orderId: number
) {
  return createAdvancedNotification(sellerId, 'wallet_credited', {
    amount,
    currency,
    orderId,
  }, {
    actionUrl: '/seller/wallet',
    actionLabel: 'عرض المحفظة',
  });
}

/**
 * إشعار خصم العمولة (للبائع)
 */
export async function notifySellerCommissionDeducted(
  sellerId: number,
  commission: number,
  commissionRate: number,
  currency: string,
  orderId: number
) {
  return createAdvancedNotification(sellerId, 'commission_deducted', {
    commission,
    commissionRate,
    currency,
    orderId,
  });
}
