/**
 * نظام الإشعارات للبائعين
 * STAR LUX Platform
 */

import { getDb } from "./db";
import { notifications, notificationQueue } from "./drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// أنواع الإشعارات
export type NotificationType = 
  | 'new_order'           // طلب جديد
  | 'order_cancelled'     // إلغاء طلب
  | 'payment_received'    // استلام دفعة
  | 'subscription_expiring' // اشتراك قارب على الانتهاء
  | 'subscription_expired'  // اشتراك منتهي
  | 'product_low_stock'   // مخزون منخفض
  | 'new_review'          // تقييم جديد
  | 'store_verified'      // تم التحقق من المتجر
  | 'delivery_reminder'   // تذكير بالتوصيل
  | 'commission_deducted' // خصم عمولة
  | 'system_update'       // تحديث النظام
  | 'legal_notice';       // إشعار قانوني

// قوالب الإشعارات
const notificationTemplates: Record<NotificationType, { title: string; template: string }> = {
  new_order: {
    title: '🛒 طلب جديد',
    template: 'لديك طلب جديد رقم #{orderId} بقيمة {amount} {currency}. يرجى مراجعة الطلب وتأكيده.',
  },
  order_cancelled: {
    title: '❌ إلغاء طلب',
    template: 'تم إلغاء الطلب رقم #{orderId}. السبب: {reason}',
  },
  payment_received: {
    title: '💰 استلام دفعة',
    template: 'تم استلام دفعة بقيمة {amount} {currency} للطلب رقم #{orderId}. العمولة: {commission} {currency}. صافي الربح: {netAmount} {currency}',
  },
  subscription_expiring: {
    title: '⚠️ اشتراكك قارب على الانتهاء',
    template: 'اشتراكك في خطة {planName} سينتهي خلال {daysLeft} أيام. قم بالتجديد للاستمرار في البيع.',
  },
  subscription_expired: {
    title: '🔴 انتهى اشتراكك',
    template: 'انتهى اشتراكك في خطة {planName}. قم بالتجديد الآن لاستعادة صلاحيات البيع.',
  },
  product_low_stock: {
    title: '📦 مخزون منخفض',
    template: 'المنتج "{productName}" وصل لمخزون منخفض ({stock} قطعة متبقية). قم بإعادة التعبئة.',
  },
  new_review: {
    title: '⭐ تقييم جديد',
    template: 'حصلت على تقييم جديد ({rating}/5) من {buyerName} على المنتج "{productName}".',
  },
  store_verified: {
    title: '✅ تم التحقق من متجرك',
    template: 'تهانينا! تم التحقق من متجرك "{storeName}" وأصبح موثوقاً.',
  },
  delivery_reminder: {
    title: '🚚 تذكير بالتوصيل',
    template: 'تذكير: الطلب رقم #{orderId} بانتظار التوصيل. يرجى شحنه في أقرب وقت.',
  },
  commission_deducted: {
    title: '💳 خصم عمولة',
    template: 'تم خصم عمولة المنصة ({commissionRate}%) بقيمة {commission} {currency} من الطلب رقم #{orderId}.',
  },
  system_update: {
    title: '🔔 تحديث النظام',
    template: '{message}',
  },
  legal_notice: {
    title: '⚖️ إشعار قانوني مهم',
    template: '⚠️ تنبيه: أنت كبائع مسؤول قانونياً عن توصيل المنتجات للمشترين. أي تأخير أو إخلال بالتوصيل قد يعرضك للمساءلة القانونية. يرجى الالتزام بمواعيد التوصيل المحددة.',
  },
};

// إنشاء إشعار
export async function createNotification(
  userId: number,
  type: NotificationType,
  data: Record<string, any> = {}
): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const template = notificationTemplates[type];
  if (!template) return undefined;

  // استبدال المتغيرات في القالب
  let content = template.template;
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }

  const result = await db.insert(notifications).values({
    userId,
    title: template.title,
    message: content,
    type,
    isRead: false,
    category: 'system',
    priority: 'normal',
  });

  return result[0]?.insertId;
}

// إرسال إشعار للبائع عند طلب جديد
export async function notifySellerNewOrder(
  sellerId: number,
  orderId: number,
  amount: number,
  currency: string = 'USD'
) {
  return createNotification(sellerId, 'new_order', { orderId, amount, currency });
}

// إرسال إشعار استلام دفعة مع العمولة
export async function notifySellerPaymentReceived(
  sellerId: number,
  orderId: number,
  amount: number,
  commission: number,
  netAmount: number,
  currency: string = 'USD'
) {
  // إشعار استلام الدفعة
  await createNotification(sellerId, 'payment_received', {
    orderId,
    amount,
    commission,
    netAmount,
    currency,
  });

  // إشعار خصم العمولة
  await createNotification(sellerId, 'commission_deducted', {
    orderId,
    commission,
    commissionRate: 5,
    currency,
  });
}

// إرسال إشعار قانوني للبائع
export async function sendLegalNoticeToSeller(sellerId: number) {
  return createNotification(sellerId, 'legal_notice', {});
}

// إرسال إشعار انتهاء الاشتراك
export async function notifySubscriptionExpiring(
  sellerId: number,
  planName: string,
  daysLeft: number
) {
  return createNotification(sellerId, 'subscription_expiring', { planName, daysLeft });
}

// إرسال إشعار مخزون منخفض
export async function notifyLowStock(
  sellerId: number,
  productName: string,
  stock: number
) {
  return createNotification(sellerId, 'product_low_stock', { productName, stock });
}

// الحصول على إشعارات المستخدم
export async function getUserNotifications(
  userId: number,
  limit: number = 50,
  unreadOnly: boolean = false
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return db.select()
    .from(notifications)
    .where(and(...conditions))
    .limit(limit)
    .orderBy(desc(notifications.createdAt));
}

// تحديد الإشعار كمقروء
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

// تحديد جميع الإشعارات كمقروءة
export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

// عدد الإشعارات غير المقروءة
export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select()
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));

  return result.length;
}

// إضافة إشعار لقائمة الانتظار (للإرسال المجدول)
export async function queueNotification(
  userId: number,
  type: NotificationType,
  data: Record<string, any>,
  scheduledAt: Date
) {
  const db = await getDb();
  if (!db) return undefined;

  const template = notificationTemplates[type];
  if (!template) return undefined;

  let content = template.template;
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }

  const result = await db.insert(notificationQueue).values({
    userId,
    title: template.title,
    content,
    type,
    channel: 'in_app',
    scheduledAt,
    status: 'pending',
  });

  return result[0]?.insertId;
}
