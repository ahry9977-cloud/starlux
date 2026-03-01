/**
 * مركز الإشعارات المتقدم
 * STAR LUX Platform
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Settings,
  ShoppingCart,
  CreditCard,
  Wallet,
  Store,
  Calendar,
  Shield,
  MessageCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Volume2,
  Smartphone,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

type NotificationCategory = 'orders' | 'payments' | 'wallet' | 'store' | 'subscription' | 'system' | 'communication';

const categoryConfig: Record<NotificationCategory, { label: string; icon: React.ReactNode; color: string }> = {
  orders: { label: 'الطلبات', icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-blue-500' },
  payments: { label: 'المدفوعات', icon: <CreditCard className="h-4 w-4" />, color: 'bg-green-500' },
  wallet: { label: 'المحفظة', icon: <Wallet className="h-4 w-4" />, color: 'bg-yellow-500' },
  store: { label: 'المتجر', icon: <Store className="h-4 w-4" />, color: 'bg-purple-500' },
  subscription: { label: 'الاشتراك', icon: <Calendar className="h-4 w-4" />, color: 'bg-orange-500' },
  system: { label: 'النظام', icon: <Shield className="h-4 w-4" />, color: 'bg-gray-500' },
  communication: { label: 'التواصل', icon: <MessageCircle className="h-4 w-4" />, color: 'bg-pink-500' },
};

const priorityConfig = {
  low: { label: 'منخفضة', color: 'bg-gray-400' },
  normal: { label: 'عادية', color: 'bg-blue-400' },
  high: { label: 'عالية', color: 'bg-orange-400' },
  urgent: { label: 'عاجلة', color: 'bg-red-500' },
};

export default function NotificationCenterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  // جلب الإشعارات
  const { data: notificationsData, isLoading, refetch } = trpc.notifications.getAll.useQuery({
    limit,
    offset: page * limit,
    unreadOnly: showUnreadOnly,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    includeArchived: activeTab === 'archived',
  });

  // جلب إعدادات الإشعارات
  const { data: settings, refetch: refetchSettings } = trpc.notifications.getSettings.useQuery();

  // جلب العملات
  const { data: currencies } = trpc.notifications.getCurrencies.useQuery();

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('تم تحديد الإشعار كمقروء');
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    },
  });

  const archiveMutation = trpc.notifications.archive.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('تم أرشفة الإشعار');
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('تم حذف الإشعار');
    },
  });

  const deleteAllReadMutation = trpc.notifications.deleteAllRead.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`تم حذف ${data.deletedCount} إشعار`);
    },
  });

  const updateSettingsMutation = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      refetchSettings();
      toast.success('تم تحديث الإعدادات');
    },
  });

  // تحويل العملات
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('SAR');
  const [convertAmount, setConvertAmount] = useState('');
  const [conversionResult, setConversionResult] = useState<any>(null);

  const convertCurrencyMutation = trpc.notifications.convertCurrency.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setConversionResult(data);
        toast.success('تم التحويل بنجاح');
      } else {
        toast.error(data.error || 'فشل التحويل');
      }
    },
  });

  const handleConvert = () => {
    const amount = parseFloat(convertAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('أدخل مبلغاً صحيحاً');
      return;
    }
    convertCurrencyMutation.mutate({ fromCurrency, toCurrency, amount });
  };

  const notifications = notificationsData?.notifications || [];
  const total = notificationsData?.total || 0;
  const unreadCount = notificationsData?.unreadCount || 0;
  const totalPages = Math.ceil(total / limit);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return d.toLocaleDateString('ar-SA');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" />
              مركز الإشعارات
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة جميع إشعاراتك وإعداداتك
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {unreadCount} غير مقروء
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="gap-2">
              <Bell className="h-4 w-4" />
              الكل
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="h-4 w-4" />
              الأرشيف
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="currency" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              العملات
            </TabsTrigger>
          </TabsList>

          {/* قائمة الإشعارات */}
          <TabsContent value="all" className="space-y-4">
            {/* الفلاتر */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">فلترة:</span>
                  </div>
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="جميع الفئات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفئات</SelectItem>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="unread-only"
                      checked={showUnreadOnly}
                      onCheckedChange={setShowUnreadOnly}
                    />
                    <Label htmlFor="unread-only">غير المقروءة فقط</Label>
                  </div>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate({})}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4 ml-2" />
                    تحديد الكل كمقروء
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف المقروءة
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف الإشعارات المقروءة</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف جميع الإشعارات المقروءة؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAllReadMutation.mutate()}>
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            {/* قائمة الإشعارات */}
            <Card>
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      جاري التحميل...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">لا توجد إشعارات</p>
                    </div>
                  ) : (
                    notifications.map((notification: any) => {
                      const category = categoryConfig[notification.category as NotificationCategory] || categoryConfig.system;
                      const priority = priorityConfig[notification.priority as keyof typeof priorityConfig] || priorityConfig.normal;

                      return (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors ${
                            !notification.isRead ? 'bg-primary/5 border-r-4 border-r-primary' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${category.color} text-white`}>
                              {category.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{notification.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {category.label}
                                </Badge>
                                {notification.priority !== 'normal' && (
                                  <Badge className={`text-xs ${priority.color}`}>
                                    {priority.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{formatDate(notification.createdAt)}</span>
                                {notification.actionUrl && (
                                  <a
                                    href={notification.actionUrl}
                                    className="text-primary hover:underline"
                                  >
                                    {notification.actionLabel || 'عرض التفاصيل'}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                                  title="تحديد كمقروء"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => archiveMutation.mutate({ id: notification.id })}
                                title="أرشفة"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate({ id: notification.id })}
                                title="حذف"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    عرض {page * limit + 1} - {Math.min((page + 1) * limit, total)} من {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* الأرشيف */}
          <TabsContent value="archived">
            <Card>
              <CardHeader>
                <CardTitle>الإشعارات المؤرشفة</CardTitle>
                <CardDescription>الإشعارات التي قمت بأرشفتها</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  اختر "الكل" ثم فعّل خيار "الأرشيف" لعرض الإشعارات المؤرشفة
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الإعدادات */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  إشعارات البريد الإلكتروني
                </CardTitle>
                <CardDescription>تحكم في الإشعارات التي تصلك عبر البريد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل إشعارات البريد</Label>
                    <p className="text-sm text-muted-foreground">استلام الإشعارات عبر البريد الإلكتروني</p>
                  </div>
                  <Switch
                    checked={settings?.emailEnabled ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ emailEnabled: checked })}
                  />
                </div>
                <Separator />
                <div className="grid gap-4">
                  {[
                    { key: 'emailOrders', label: 'الطلبات', desc: 'إشعارات الطلبات الجديدة والتحديثات' },
                    { key: 'emailPayments', label: 'المدفوعات', desc: 'إشعارات المدفوعات والفواتير' },
                    { key: 'emailWallet', label: 'المحفظة', desc: 'إشعارات السحب والإيداع' },
                    { key: 'emailStore', label: 'المتجر', desc: 'إشعارات المنتجات والمتجر' },
                    { key: 'emailSubscription', label: 'الاشتراك', desc: 'إشعارات الاشتراك والتجديد' },
                    { key: 'emailSystem', label: 'النظام', desc: 'تنبيهات النظام والأمان' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <Label>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={(settings as any)?.[item.key] ?? true}
                        onCheckedChange={(checked) => updateSettingsMutation.mutate({ [item.key]: checked })}
                        disabled={!settings?.emailEnabled}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  إشعارات التطبيق
                </CardTitle>
                <CardDescription>تحكم في الإشعارات داخل التطبيق</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل الإشعارات</Label>
                    <p className="text-sm text-muted-foreground">عرض الإشعارات داخل التطبيق</p>
                  </div>
                  <Switch
                    checked={settings?.inAppEnabled ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ inAppEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الصوت</Label>
                    <p className="text-sm text-muted-foreground">تشغيل صوت عند وصول إشعار</p>
                  </div>
                  <Switch
                    checked={settings?.inAppSound ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ inAppSound: checked })}
                    disabled={!settings?.inAppEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  إشعارات الدفع
                </CardTitle>
                <CardDescription>إشعارات الهاتف المحمول</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل إشعارات الدفع</Label>
                    <p className="text-sm text-muted-foreground">استلام إشعارات على هاتفك</p>
                  </div>
                  <Switch
                    checked={settings?.pushEnabled ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ pushEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تحويل العملات */}
          <TabsContent value="currency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  محول العملات
                </CardTitle>
                <CardDescription>تحويل بين العملات المدعومة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>من العملة</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies?.map((c: any) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.nameAr} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المبلغ</Label>
                    <Input
                      type="number"
                      placeholder="أدخل المبلغ"
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>إلى العملة</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies?.map((c: any) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.nameAr} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleConvert} disabled={convertCurrencyMutation.isPending} className="w-full">
                  {convertCurrencyMutation.isPending ? 'جاري التحويل...' : 'تحويل'}
                </Button>

                {conversionResult && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <p className="text-2xl font-bold text-primary">
                          {conversionResult.convertedAmount?.toFixed(2)} {toCurrency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          سعر الصرف: 1 {fromCurrency} = {conversionResult.exchangeRate?.toFixed(4)} {toCurrency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          رسوم التحويل (1%): {conversionResult.fee?.toFixed(2)} {fromCurrency}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>العملات المدعومة</CardTitle>
                <CardDescription>قائمة العملات المتاحة للتحويل</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {currencies?.map((c: any) => (
                    <div key={c.code} className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold">{c.symbol}</div>
                      <div className="text-sm font-medium">{c.code}</div>
                      <div className="text-xs text-muted-foreground">{c.nameAr}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        1 USD = {Number(c.exchangeRate).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
