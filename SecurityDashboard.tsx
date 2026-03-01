/**
 * STAR LUX - Security Dashboard
 * لوحة تحكم الأمان للأدمن
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  Download,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Database,
  Globe,
  Clock,
  Users,
  FileWarning,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Bug,
  Wrench,
  Brain,
  Target
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

// ============= أنواع البيانات =============

interface SecurityStats {
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  totalEvents: number;
  criticalEvents: number;
  blockedIPs: number;
  autoFixes: number;
  vulnerabilities: {
    open: number;
    fixed: number;
    total: number;
  };
  performance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

interface SecurityEvent {
  id: number;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  ipAddress?: string;
  userId?: number;
  createdAt: string;
  actionTaken: boolean;
}

interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: string;
  expiresAt: string;
}

interface Vulnerability {
  id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'fixed';
  title: string;
  description: string;
  autoFixed: boolean;
  createdAt: string;
}

// ============= مكونات فرعية =============

const HealthScoreCard = ({ score, status }: { score: number; status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'excellent': return <ShieldCheck className="w-8 h-8" />;
      case 'good': return <Shield className="w-8 h-8" />;
      case 'fair': return <ShieldAlert className="w-8 h-8" />;
      case 'poor': return <ShieldOff className="w-8 h-8" />;
      case 'critical': return <AlertTriangle className="w-8 h-8" />;
      default: return <Shield className="w-8 h-8" />;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <div className={getStatusColor()}>{getStatusIcon()}</div>
          نقاط الصحة
        </CardTitle>
        <CardDescription>الحالة العامة للمنصة</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-5xl font-bold ${getStatusColor()}`}>{score}</span>
          <Badge variant={status === 'excellent' || status === 'good' ? 'default' : 'destructive'}>
            {status === 'excellent' ? 'ممتاز' :
             status === 'good' ? 'جيد' :
             status === 'fair' ? 'متوسط' :
             status === 'poor' ? 'ضعيف' : 'حرج'}
          </Badge>
        </div>
        <Progress value={score} className="h-3" />
      </CardContent>
    </Card>
  );
};

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'cyan'
}: { 
  title: string; 
  value: number | string; 
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-500/10`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const EventRow = ({ event }: { event: SecurityEvent }) => {
  const getSeverityColor = () => {
    switch (event.severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityText = () => {
    switch (event.severity) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'معلومات';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${getSeverityColor()}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{event.description}</p>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>{event.eventType}</span>
          {event.ipAddress && (
            <>
              <span>•</span>
              <span>{event.ipAddress}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{getSeverityText()}</Badge>
        {event.actionTaken && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(event.createdAt).toLocaleString('ar-IQ')}
      </span>
    </div>
  );
};

const VulnerabilityCard = ({ vulnerability }: { vulnerability: Vulnerability }) => {
  const getSeverityColor = () => {
    switch (vulnerability.severity) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  const getStatusBadge = () => {
    switch (vulnerability.status) {
      case 'open': return <Badge variant="destructive">مفتوح</Badge>;
      case 'in_progress': return <Badge variant="secondary">قيد المعالجة</Badge>;
      case 'fixed': return <Badge variant="default">تم الإصلاح</Badge>;
    }
  };

  return (
    <Card className={`border-r-4 ${getSeverityColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              <span className="font-medium">{vulnerability.title}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{vulnerability.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{vulnerability.type}</Badge>
              {vulnerability.autoFixed && (
                <Badge variant="secondary" className="gap-1">
                  <Wrench className="w-3 h-3" />
                  إصلاح تلقائي
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <span className="text-xs text-muted-foreground">
              {new Date(vulnerability.createdAt).toLocaleDateString('ar-IQ')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============= المكون الرئيسي =============

export default function SecurityDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // بيانات تجريبية (سيتم استبدالها بـ tRPC)
  const [stats] = useState<SecurityStats>({
    healthScore: 92,
    healthStatus: 'excellent',
    totalEvents: 1247,
    criticalEvents: 3,
    blockedIPs: 15,
    autoFixes: 47,
    vulnerabilities: {
      open: 2,
      fixed: 45,
      total: 47,
    },
    performance: {
      avgResponseTime: 145,
      uptime: 99.97,
      errorRate: 0.03,
    },
  });

  const [events] = useState<SecurityEvent[]>([
    {
      id: 1,
      eventType: 'sql_injection_attempt',
      severity: 'critical',
      description: 'محاولة حقن SQL مكتشفة ومحظورة',
      ipAddress: '192.168.1.100',
      createdAt: new Date().toISOString(),
      actionTaken: true,
    },
    {
      id: 2,
      eventType: 'rate_limit_exceeded',
      severity: 'medium',
      description: 'تجاوز حد الطلبات من IP معين',
      ipAddress: '10.0.0.50',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      actionTaken: true,
    },
    {
      id: 3,
      eventType: 'login_failure',
      severity: 'low',
      description: 'محاولة تسجيل دخول فاشلة متكررة',
      ipAddress: '172.16.0.25',
      userId: 123,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      actionTaken: false,
    },
  ]);

  const [vulnerabilities] = useState<Vulnerability[]>([
    {
      id: 1,
      type: 'xss',
      severity: 'high',
      status: 'fixed',
      title: 'ثغرة XSS في حقل التعليقات',
      description: 'تم اكتشاف إمكانية حقن سكريبت في حقل التعليقات',
      autoFixed: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 2,
      type: 'csrf',
      severity: 'medium',
      status: 'in_progress',
      title: 'حماية CSRF غير مفعلة',
      description: 'بعض النماذج تفتقر لحماية CSRF',
      autoFixed: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // محاكاة التحديث
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // التحقق من صلاحيات الأدمن
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldOff className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground">
              هذه الصفحة متاحة للمسؤولين فقط
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-500" />
            لوحة تحكم الأمان
          </h1>
          <p className="text-muted-foreground mt-1">
            نظام الذكاء الاصطناعي للحماية والاستقرار
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 ml-2" />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <HealthScoreCard score={stats.healthScore} status={stats.healthStatus} />
        <StatCard 
          title="الأحداث الأمنية" 
          value={stats.totalEvents} 
          icon={Activity}
          trend="down"
          trendValue="-12% من الأسبوع الماضي"
        />
        <StatCard 
          title="IPs المحظورة" 
          value={stats.blockedIPs} 
          icon={Lock}
          color="orange"
        />
        <StatCard 
          title="الإصلاحات التلقائية" 
          value={stats.autoFixes} 
          icon={Wrench}
          trend="up"
          trendValue="+8 هذا الأسبوع"
          color="green"
        />
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متوسط زمن الاستجابة</p>
                <p className="text-2xl font-bold">{stats.performance.avgResponseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Server className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نسبة التشغيل</p>
                <p className="text-2xl font-bold">{stats.performance.uptime}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">معدل الأخطاء</p>
                <p className="text-2xl font-bold">{stats.performance.errorRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Activity className="w-4 h-4" />
            الأحداث
          </TabsTrigger>
          <TabsTrigger value="vulnerabilities" className="gap-2">
            <Bug className="w-4 h-4" />
            الثغرات
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-2">
            <Brain className="w-4 h-4" />
            التعلم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  أحدث الأحداث
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {events.slice(0, 5).map(event => (
                  <EventRow key={event.id} event={event} />
                ))}
              </CardContent>
            </Card>

            {/* Vulnerabilities Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  ملخص الثغرات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>مفتوحة</span>
                    <Badge variant="destructive">{stats.vulnerabilities.open}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تم إصلاحها</span>
                    <Badge variant="default">{stats.vulnerabilities.fixed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الإجمالي</span>
                    <Badge variant="outline">{stats.vulnerabilities.total}</Badge>
                  </div>
                  <Progress 
                    value={(stats.vulnerabilities.fixed / stats.vulnerabilities.total) * 100} 
                    className="h-2 mt-4"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {Math.round((stats.vulnerabilities.fixed / stats.vulnerabilities.total) * 100)}% من الثغرات تم إصلاحها
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>سجل الأحداث الأمنية</CardTitle>
              <CardDescription>جميع الأحداث الأمنية المسجلة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {events.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities">
          <div className="space-y-4">
            {vulnerabilities.map(vuln => (
              <VulnerabilityCard key={vuln.id} vulnerability={vuln} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="learning">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  إحصائيات التعلم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>الأنماط المتعلمة</span>
                    <Badge>156</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الأنماط المحظورة</span>
                    <Badge variant="destructive">23</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الإصلاحات الناجحة</span>
                    <Badge variant="default">47</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>توقيعات الهجمات</span>
                    <Badge variant="outline">89</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  أكثر الأخطاء تكراراً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">Rate Limit Exceeded</span>
                    <Badge variant="outline">342</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">Invalid Token</span>
                    <Badge variant="outline">128</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">SQL Injection Attempt</span>
                    <Badge variant="outline">45</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
