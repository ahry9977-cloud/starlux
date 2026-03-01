/**
 * نظام منع الأخطاء المستقبلية - STAR LUX
 * مراقبة وتحليل الأخطاء لمنع تكرارها
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Bug,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Lightbulb,
  Wrench,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// أنواع الأخطاء
interface ErrorPattern {
  id: string;
  type: string;
  pattern: string;
  occurrences: number;
  lastOccurrence: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'prevented' | 'monitoring';
  preventionRule?: string;
  autoFix: boolean;
}

// إحصائيات الأخطاء
interface ErrorStats {
  totalErrors: number;
  preventedErrors: number;
  activePatterns: number;
  preventionRate: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

// قواعد المنع
interface PreventionRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  action: 'block' | 'warn' | 'log' | 'fix';
  enabled: boolean;
  triggeredCount: number;
  lastTriggered?: Date;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const statusColors: Record<string, string> = {
  active: 'bg-red-500/10 text-red-500',
  prevented: 'bg-green-500/10 text-green-500',
  monitoring: 'bg-yellow-500/10 text-yellow-500',
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  prevented: 'تم المنع',
  monitoring: 'مراقبة',
};

/**
 * مكون نظام منع الأخطاء
 */
export default function ErrorPrevention() {
  // حالة الإحصائيات
  const [stats, setStats] = useState<ErrorStats>({
    totalErrors: 0,
    preventedErrors: 0,
    activePatterns: 0,
    preventionRate: 0,
    trend: 'stable',
    trendPercentage: 0,
  });

  // أنماط الأخطاء
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);

  // قواعد المنع
  const [preventionRules, setPreventionRules] = useState<PreventionRule[]>([
    {
      id: '1',
      name: 'منع SQL Injection',
      description: 'حظر محاولات حقن SQL',
      pattern: "SELECT|INSERT|UPDATE|DELETE|DROP|UNION|'|\"",
      action: 'block',
      enabled: true,
      triggeredCount: 156,
      lastTriggered: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      name: 'منع XSS',
      description: 'حظر سكربتات JavaScript الضارة',
      pattern: '<script|javascript:|onerror=|onload=',
      action: 'block',
      enabled: true,
      triggeredCount: 89,
      lastTriggered: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      name: 'تحديد معدل الطلبات',
      description: 'منع الطلبات المتكررة من نفس IP',
      pattern: 'rate_limit_exceeded',
      action: 'warn',
      enabled: true,
      triggeredCount: 234,
      lastTriggered: new Date(Date.now() - 1800000),
    },
    {
      id: '4',
      name: 'منع Path Traversal',
      description: 'حظر محاولات الوصول لملفات النظام',
      pattern: '../|..\\\\|/etc/|/var/',
      action: 'block',
      enabled: true,
      triggeredCount: 45,
    },
    {
      id: '5',
      name: 'تسجيل الأخطاء غير المتوقعة',
      description: 'تسجيل جميع الأخطاء للتحليل',
      pattern: 'uncaught_exception',
      action: 'log',
      enabled: true,
      triggeredCount: 12,
    },
  ]);

  // إعدادات النظام
  const [settings, setSettings] = useState({
    autoLearn: true,
    autoBlock: true,
    notifyOnBlock: true,
    adaptiveRules: true,
  });

  // تحميل البيانات
  useEffect(() => {
    // محاكاة تحميل البيانات
    setStats({
      totalErrors: 1247,
      preventedErrors: 1089,
      activePatterns: 23,
      preventionRate: 87.3,
      trend: 'down',
      trendPercentage: 12.5,
    });

    setErrorPatterns([
      {
        id: '1',
        type: 'SQL Injection',
        pattern: "' OR '1'='1",
        occurrences: 156,
        lastOccurrence: new Date(Date.now() - 3600000),
        severity: 'critical',
        status: 'prevented',
        preventionRule: 'منع SQL Injection',
        autoFix: true,
      },
      {
        id: '2',
        type: 'XSS Attack',
        pattern: '<script>alert(1)</script>',
        occurrences: 89,
        lastOccurrence: new Date(Date.now() - 7200000),
        severity: 'high',
        status: 'prevented',
        preventionRule: 'منع XSS',
        autoFix: true,
      },
      {
        id: '3',
        type: 'Rate Limit',
        pattern: '100+ requests/minute',
        occurrences: 234,
        lastOccurrence: new Date(Date.now() - 1800000),
        severity: 'medium',
        status: 'monitoring',
        autoFix: false,
      },
      {
        id: '4',
        type: 'Invalid Input',
        pattern: 'null byte injection',
        occurrences: 45,
        lastOccurrence: new Date(Date.now() - 86400000),
        severity: 'low',
        status: 'active',
        autoFix: false,
      },
    ]);
  }, []);

  // تبديل قاعدة المنع
  const toggleRule = (ruleId: string) => {
    setPreventionRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success('تم تحديث القاعدة');
  };

  // إضافة قاعدة جديدة
  const addRule = () => {
    toast.info('سيتم إضافة واجهة إنشاء قاعدة جديدة');
  };

  // تحديث إعداد
  const updateSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('تم تحديث الإعدادات');
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            نظام منع الأخطاء
          </h2>
          <p className="text-muted-foreground mt-1">
            مراقبة وتحليل الأخطاء لمنع تكرارها
          </p>
        </div>
        <Button onClick={addRule}>
          <Wrench className="h-4 w-4 mr-2" />
          إضافة قاعدة
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأخطاء</p>
                <p className="text-2xl font-bold">{stats.totalErrors.toLocaleString()}</p>
              </div>
              <Bug className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تم المنع</p>
                <p className="text-2xl font-bold text-green-500">
                  {stats.preventedErrors.toLocaleString()}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نسبة المنع</p>
                <p className="text-2xl font-bold">{stats.preventionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <Progress value={stats.preventionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الاتجاه</p>
                <div className="flex items-center gap-1">
                  {stats.trend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  ) : stats.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : (
                    <Activity className="h-5 w-5 text-yellow-500" />
                  )}
                  <span
                    className={cn(
                      'text-2xl font-bold',
                      stats.trend === 'down' ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {stats.trendPercentage}%
                  </span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إعدادات النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            إعدادات الذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label>التعلم التلقائي</Label>
                <p className="text-xs text-muted-foreground">تعلم أنماط جديدة تلقائياً</p>
              </div>
              <Switch
                checked={settings.autoLearn}
                onCheckedChange={() => updateSetting('autoLearn')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label>الحظر التلقائي</Label>
                <p className="text-xs text-muted-foreground">حظر التهديدات تلقائياً</p>
              </div>
              <Switch
                checked={settings.autoBlock}
                onCheckedChange={() => updateSetting('autoBlock')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label>إشعار عند الحظر</Label>
                <p className="text-xs text-muted-foreground">إرسال إشعار للأدمن</p>
              </div>
              <Switch
                checked={settings.notifyOnBlock}
                onCheckedChange={() => updateSetting('notifyOnBlock')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label>قواعد تكيفية</Label>
                <p className="text-xs text-muted-foreground">تعديل القواعد حسب السلوك</p>
              </div>
              <Switch
                checked={settings.adaptiveRules}
                onCheckedChange={() => updateSetting('adaptiveRules')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قواعد المنع */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            قواعد المنع ({preventionRules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {preventionRules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    rule.enabled
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-muted/30 border-border'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full',
                          rule.enabled ? 'bg-green-500/20' : 'bg-muted'
                        )}
                      >
                        <Shield
                          className={cn(
                            'h-4 w-4',
                            rule.enabled ? 'text-green-500' : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{rule.triggeredCount} مرة</p>
                        {rule.lastTriggered && (
                          <p className="text-xs text-muted-foreground">
                            آخر: {rule.lastTriggered.toLocaleString('ar-IQ')}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {rule.action === 'block' ? 'حظر' :
                       rule.action === 'warn' ? 'تحذير' :
                       rule.action === 'log' ? 'تسجيل' : 'إصلاح'}
                    </Badge>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{rule.pattern}</code>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* أنماط الأخطاء المكتشفة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            أنماط الأخطاء المكتشفة ({errorPatterns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {errorPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className={cn('p-4 rounded-lg border', severityColors[pattern.severity])}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[pattern.status]}>
                        {statusLabels[pattern.status]}
                      </Badge>
                      <div>
                        <p className="font-medium">{pattern.type}</p>
                        <code className="text-xs bg-muted/50 px-2 py-0.5 rounded">
                          {pattern.pattern}
                        </code>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{pattern.occurrences} مرة</p>
                      <p className="text-xs text-muted-foreground">
                        آخر: {pattern.lastOccurrence.toLocaleString('ar-IQ')}
                      </p>
                    </div>
                  </div>
                  {pattern.preventionRule && (
                    <div className="mt-2 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-muted-foreground">
                        محمي بواسطة: {pattern.preventionRule}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
