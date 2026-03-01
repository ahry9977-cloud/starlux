/**
 * لوحة تحكم المستخدم العادي - STAR LUX
 * تعرض: الطلبات، المفضلة، الإعدادات
 */

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  User,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Home,
  Menu,
  X,
  ChevronRight,
  Bell,
  CreditCard,
  MapPin,
  Loader2,
} from 'lucide-react';

// القائمة الجانبية
const menuItems = [
  { id: 'overview', label: 'نظرة عامة', icon: Home },
  { id: 'orders', label: 'طلباتي', icon: ShoppingBag },
  { id: 'favorites', label: 'المفضلة', icon: Heart },
  { id: 'addresses', label: 'العناوين', icon: MapPin },
  { id: 'payments', label: 'طرق الدفع', icon: CreditCard },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // معالجة تسجيل الخروج
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/');
    } catch (error) {
      toast.error('فشل تسجيل الخروج');
    }
  };

  // حالة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-white/70">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" dir="rtl">
      {/* الشريط الجانبي - Desktop */}
      <aside className={`fixed top-0 right-0 h-full bg-white/5 backdrop-blur-xl border-l border-white/10 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
        {/* الشعار */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-white">
                STAR <span className="text-amber-400">LUX</span>
              </h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* معلومات المستخدم */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-white font-medium text-sm">{user?.name || 'مستخدم'}</p>
                <p className="text-white/50 text-xs">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* القائمة */}
        <nav className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all mb-1 ${
                activeSection === item.id
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-64 bg-slate-900 border-l border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">
                STAR <span className="text-amber-400">LUX</span>
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all mb-1 ${
                    activeSection === item.id
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-64' : 'lg:mr-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-white/70"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold text-white">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-white"
            >
              <Home className="w-4 h-4 ml-2" />
              الرئيسية
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/70">طلباتي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-white/50">طلب</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/70">المفضلة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-white/50">منتج</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/70">العناوين</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-white/50">عنوان</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* آخر الطلبات */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    آخر الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-white/50">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد طلبات حتى الآن</p>
                    <Button
                      onClick={() => navigate('/explore')}
                      className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      تصفح المنتجات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'orders' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">طلباتي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-white/50">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد طلبات حتى الآن</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'favorites' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">المفضلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-white/50">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد منتجات في المفضلة</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'addresses' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">العناوين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-white/50">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد عناوين محفوظة</p>
                  <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white">
                    إضافة عنوان
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'payments' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">طرق الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-white/50">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد طرق دفع محفوظة</p>
                  <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white">
                    إضافة طريقة دفع
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">الإشعارات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-white/50">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد إشعارات</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'settings' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">الإعدادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">الاسم</p>
                      <p className="text-white/50 text-sm">{user?.name || 'غير محدد'}</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-white/20 text-white">
                      تعديل
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">البريد الإلكتروني</p>
                      <p className="text-white/50 text-sm">{user?.email}</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-white/20 text-white">
                      تعديل
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">كلمة المرور</p>
                      <p className="text-white/50 text-sm">••••••••</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-white/20 text-white">
                      تغيير
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
