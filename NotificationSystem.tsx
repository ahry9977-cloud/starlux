/**
 * نظام الإشعارات الفورية المتطور - STAR LUX
 * Real-time Notifications with WebSocket support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  ShoppingCart,
  Shield,
  AlertTriangle,
  Info,
  Package,
  Store,
  Users,
  CreditCard,
  Star,
  MessageSquare,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// أنواع الإشعارات
export type NotificationType = 
  | 'system' 
  | 'order' 
  | 'security' 
  | 'update' 
  | 'message' 
  | 'payment' 
  | 'review' 
  | 'store' 
  | 'product';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
  actionUrl?: string;
}

// أيقونات الإشعارات حسب النوع
const notificationIcons: Record<NotificationType, React.ComponentType<any>> = {
  system: Info,
  order: ShoppingCart,
  security: Shield,
  update: RefreshCw,
  message: MessageSquare,
  payment: CreditCard,
  review: Star,
  store: Store,
  product: Package,
};

// ألوان الإشعارات حسب الأولوية
const priorityColors: Record<NotificationPriority, string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
};

// مكون الإشعار الفردي
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}) {
  const Icon = notificationIcons[notification.type] || Info;
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer hover:bg-accent/50',
        !notification.isRead && 'bg-accent/30'
      )}
      onClick={() => onClick(notification)}
    >
      <div className={cn('p-2 rounded-full border', priorityColors[notification.priority])}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn('text-sm font-medium truncate', !notification.isRead && 'font-semibold')}>
            {notification.title}
          </h4>
          {!notification.isRead && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <span className="text-xs text-muted-foreground/70 mt-1 block">
          {timeAgo}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// حساب الوقت المنقضي
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return new Date(date).toLocaleDateString('ar-IQ');
}

// المكون الرئيسي لنظام الإشعارات
export default function NotificationSystem() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC queries
  const notificationsQuery = trpc.notifications.getAll.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000, // كل 30 ثانية
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteMutation = trpc.notifications.delete.useMutation();
  // deleteAll mutation removed - use delete individually

  // تحديث الإشعارات من الخادم
  useEffect(() => {
    if (notificationsQuery.data?.notifications) {
      const newNotifications = notificationsQuery.data.notifications.map((n: any) => ({
        id: n.id.toString(),
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        priority: n.priority as NotificationPriority,
        isRead: n.isRead,
        createdAt: new Date(n.createdAt),
        data: n.data ? JSON.parse(n.data) : undefined,
        actionUrl: n.actionUrl,
      }));

      // التحقق من وجود إشعارات جديدة
      const hasNewNotifications = newNotifications.some(
        (n: Notification) => !n.isRead && !notifications.find((old) => old.id === n.id)
      );

      if (hasNewNotifications && soundEnabled) {
        playNotificationSound();
      }

      setNotifications(newNotifications);
    }
  }, [notificationsQuery.data]);

  // تشغيل صوت الإشعار
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // تحديد إشعار كمقروء
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync({ id: parseInt(id) });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error('فشل في تحديث الإشعار');
    }
  };

  // تحديد جميع الإشعارات كمقروءة
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (error) {
      toast.error('فشل في تحديث الإشعارات');
    }
  };

  // حذف إشعار
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id: parseInt(id) });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      toast.error('فشل في حذف الإشعار');
    }
  };

  // حذف جميع الإشعارات
  const handleDeleteAll = async () => {
    try {
      // Delete all notifications one by one
      for (const n of notifications) {
        await deleteMutation.mutateAsync({ id: parseInt(n.id) });
      }
      setNotifications([]);
      toast.success('تم حذف جميع الإشعارات');
    } catch (error) {
      toast.error('فشل في حذف الإشعارات');
    }
  };

  // النقر على إشعار
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  // تحديث الإشعارات يدوياً
  const handleRefresh = () => {
    setIsLoading(true);
    notificationsQuery.refetch().finally(() => setIsLoading(false));
  };

  if (!user) return null;

  return (
    <>
      {/* صوت الإشعار */}
      <audio
        ref={audioRef}
        src="/notification-sound.mp3"
        preload="auto"
      />

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 animate-pulse" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[380px] p-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-semibold">الإشعارات</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} جديد
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'إيقاف الصوت' : 'تفعيل الصوت'}
              >
                {soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                تحديد الكل كمقروء
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleDeleteAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                حذف الكل
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Bell className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/notifications';
              }}
            >
              عرض جميع الإشعارات
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

// مكون إشعار Toast فوري
export function showNotification(notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
  const Icon = notificationIcons[notification.type] || Info;
  
  toast.custom(
    (t) => (
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-background max-w-md',
          priorityColors[notification.priority]
        )}
      >
        <div className={cn('p-2 rounded-full', priorityColors[notification.priority])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => toast.dismiss(t)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    ),
    {
      duration: notification.priority === 'critical' ? 10000 : 5000,
    }
  );
}

// Hook لاستخدام الإشعارات
export function useNotifications() {
  const { user } = useAuth();
  const notificationsQuery = trpc.notifications.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  const unreadCount = notificationsQuery.data?.notifications?.filter((n: any) => !n.isRead).length || 0;

  return {
    notifications: notificationsQuery.data || [],
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    refetch: notificationsQuery.refetch,
  };
}
