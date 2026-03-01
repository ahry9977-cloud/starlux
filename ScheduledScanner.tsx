/**
 * المؤقت الزمني للفحص الدوري - STAR LUX
 * جدولة الفحوصات الأمنية التلقائية
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Clock,
  Calendar,
  Play,
  Pause,
  Settings,
  Bell,
  Mail,
  Shield,
  CheckCircle,
  AlertTriangle,
  Timer,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// إعدادات الجدولة
interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM
  dayOfWeek?: number; // 0-6 للأسبوعي
  dayOfMonth?: number; // 1-31 للشهري
  notifyOnComplete: boolean;
  notifyOnVulnerability: boolean;
  emailNotification: boolean;
  autoFix: boolean;
}

// سجل الفحوصات
interface ScanHistory {
  id: string;
  scheduledAt: Date;
  executedAt: Date;
  duration: number; // بالثواني
  vulnerabilitiesFound: number;
  status: 'success' | 'failed' | 'cancelled';
}

const frequencyLabels: Record<string, string> = {
  hourly: 'كل ساعة',
  daily: 'يومياً',
  weekly: 'أسبوعياً',
  monthly: 'شهرياً',
};

const daysOfWeek = [
  { value: '0', label: 'الأحد' },
  { value: '1', label: 'الإثنين' },
  { value: '2', label: 'الثلاثاء' },
  { value: '3', label: 'الأربعاء' },
  { value: '4', label: 'الخميس' },
  { value: '5', label: 'الجمعة' },
  { value: '6', label: 'السبت' },
];

/**
 * مكون المؤقت الزمني للفحص الدوري
 */
export default function ScheduledScanner() {
  // حالة الإعدادات
  const [config, setConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    time: '03:00',
    dayOfWeek: 0,
    dayOfMonth: 1,
    notifyOnComplete: true,
    notifyOnVulnerability: true,
    emailNotification: false,
    autoFix: false,
  });

  // حالة المؤقت
  const [nextScan, setNextScan] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // حساب موعد الفحص التالي
  const calculateNextScan = useCallback(() => {
    if (!config.enabled) {
      setNextScan(null);
      return;
    }

    const now = new Date();
    const [hours, minutes] = config.time.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    switch (config.frequency) {
      case 'hourly':
        if (next <= now) {
          next.setHours(next.getHours() + 1);
        }
        break;

      case 'daily':
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case 'weekly':
        const targetDay = config.dayOfWeek ?? 0;
        const currentDay = next.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
          daysUntil += 7;
        }
        next.setDate(next.getDate() + daysUntil);
        break;

      case 'monthly':
        const targetDate = config.dayOfMonth ?? 1;
        next.setDate(targetDate);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
    }

    setNextScan(next);
  }, [config]);

  // تحديث العد التنازلي
  useEffect(() => {
    calculateNextScan();

    const interval = setInterval(() => {
      if (nextScan) {
        const now = new Date();
        const diff = nextScan.getTime() - now.getTime();

        if (diff <= 0) {
          // حان وقت الفحص
          runScheduledScan();
          calculateNextScan();
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextScan, calculateNextScan]);

  // تشغيل الفحص المجدول
  const runScheduledScan = useCallback(async () => {
    const scanId = Date.now().toString();
    const startTime = new Date();

    toast.info('بدء الفحص الأمني المجدول...');

    // محاكاة الفحص
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const vulnerabilitiesFound = Math.floor(Math.random() * 5);
    const endTime = new Date();

    const history: ScanHistory = {
      id: scanId,
      scheduledAt: nextScan || startTime,
      executedAt: startTime,
      duration: Math.round((endTime.getTime() - startTime.getTime()) / 1000),
      vulnerabilitiesFound,
      status: 'success',
    };

    setScanHistory((prev) => [history, ...prev.slice(0, 9)]);

    // إشعارات
    if (config.notifyOnComplete) {
      toast.success('اكتمل الفحص الأمني المجدول');
    }

    if (config.notifyOnVulnerability && vulnerabilitiesFound > 0) {
      toast.warning(`تم اكتشاف ${vulnerabilitiesFound} ثغرة!`);
    }
  }, [nextScan, config]);

  // حفظ الإعدادات
  const saveConfig = async () => {
    setIsSaving(true);
    try {
      // محاكاة الحفظ
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('تم حفظ إعدادات الجدولة');
      calculateNextScan();
    } catch (error) {
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  // تحديث إعداد
  const updateConfig = <K extends keyof ScheduleConfig>(key: K, value: ScheduleConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="h-6 w-6" />
            الفحص الدوري المجدول
          </h2>
          <p className="text-muted-foreground mt-1">
            جدولة الفحوصات الأمنية التلقائية
          </p>
        </div>
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          حفظ الإعدادات
        </Button>
      </div>

      {/* حالة الجدولة */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              حالة الجدولة
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="schedule-enabled">تفعيل</Label>
              <Switch
                id="schedule-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => updateConfig('enabled', checked)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {config.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">الفحص التالي</p>
                    <p className="text-sm text-muted-foreground">
                      {nextScan?.toLocaleString('ar-IQ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">{countdown}</p>
                  <p className="text-xs text-muted-foreground">متبقي</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  مفعّل
                </Badge>
                <Badge variant="outline">
                  {frequencyLabels[config.frequency]}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <div className="text-center">
                <Pause className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>الفحص الدوري معطّل</p>
                <p className="text-sm">فعّل الجدولة لبدء الفحوصات التلقائية</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إعدادات الجدولة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إعدادات الجدولة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التكرار</Label>
              <Select
                value={config.frequency}
                onValueChange={(value: any) => updateConfig('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">كل ساعة</SelectItem>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                  <SelectItem value="monthly">شهرياً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الوقت</Label>
              <input
                type="time"
                value={config.time}
                onChange={(e) => updateConfig('time', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {config.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>يوم الأسبوع</Label>
                <Select
                  value={config.dayOfWeek?.toString()}
                  onValueChange={(value) => updateConfig('dayOfWeek', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label>يوم الشهر</Label>
                <Select
                  value={config.dayOfMonth?.toString()}
                  onValueChange={(value) => updateConfig('dayOfMonth', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إعدادات الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>إشعار عند اكتمال الفحص</Label>
              <p className="text-sm text-muted-foreground">إرسال إشعار عند انتهاء كل فحص</p>
            </div>
            <Switch
              checked={config.notifyOnComplete}
              onCheckedChange={(checked) => updateConfig('notifyOnComplete', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>إشعار عند اكتشاف ثغرات</Label>
              <p className="text-sm text-muted-foreground">إشعار فوري عند اكتشاف أي ثغرة</p>
            </div>
            <Switch
              checked={config.notifyOnVulnerability}
              onCheckedChange={(checked) => updateConfig('notifyOnVulnerability', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>إشعار بالبريد الإلكتروني</Label>
              <p className="text-sm text-muted-foreground">إرسال تقرير مفصل بالبريد</p>
            </div>
            <Switch
              checked={config.emailNotification}
              onCheckedChange={(checked) => updateConfig('emailNotification', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>الإصلاح التلقائي</Label>
              <p className="text-sm text-muted-foreground">محاولة إصلاح الثغرات البسيطة تلقائياً</p>
            </div>
            <Switch
              checked={config.autoFix}
              onCheckedChange={(checked) => updateConfig('autoFix', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* سجل الفحوصات */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل الفحوصات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {scan.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {scan.executedAt.toLocaleString('ar-IQ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scan.duration} ثانية • {scan.vulnerabilitiesFound} ثغرة
                      </p>
                    </div>
                  </div>
                  <Badge variant={scan.status === 'success' ? 'default' : 'destructive'}>
                    {scan.status === 'success' ? 'ناجح' : 'فشل'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
