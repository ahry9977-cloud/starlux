import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRedirect from "./components/AdminRedirect";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2 } from "lucide-react";

// الصفحات الأساسية - تحميل فوري
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import UltraFastLogin from "./pages/UltraFastLogin";
import UltraFastRegister from "./pages/UltraFastRegister";
import PremiumLogin from "./pages/PremiumLogin";
import PremiumRegister from "./pages/PremiumRegister";

// الصفحات الثانوية - Lazy Loading لتحسين الأداء
const AccountTypePage = lazy(() => import("./pages/AccountTypePage"));
const BuyerRegisterPage = lazy(() => import("./pages/BuyerRegisterPage"));
const SellerRegisterPage = lazy(() => import("./pages/SellerRegisterPage"));
const Explore = lazy(() => import("./pages/Explore"));
const Categories = lazy(() => import("./pages/Categories"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const ChatBot = lazy(() => import("./components/ChatBot"));
const InstallPrompt = lazy(() => import("./components/InstallPrompt"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const SubscriptionPayment = lazy(() => import("./pages/SubscriptionPayment"));
const AdminPaymentsPage = lazy(() => import("./pages/AdminPaymentsPage"));
const SellerWalletPage = lazy(() => import("./pages/SellerWalletPage"));
const NotificationCenterPage = lazy(() => import("./pages/NotificationCenterPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const ProductReviews = lazy(() => import("./pages/ProductReviews"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthPageOptimized = lazy(() => import("./pages/AuthPageOptimized"));
const RegisterPageOptimized = lazy(() => import("./pages/RegisterPageOptimized"));
const SecurityDashboard = lazy(() => import("./pages/admin/SecurityDashboard"));
const RoleManagement = lazy(() => import("./pages/RoleManagement").then(module => ({
  default: module.RoleManagement,
})));

// الصفحات الثابتة - Lazy Loading
const StaticPages = lazy(() => import("./pages/StaticPages").then(module => ({
  default: () => null,
  AboutPage: module.AboutPage,
  PrivacyPage: module.PrivacyPage,
  TermsPage: module.TermsPage,
  ContactPage: module.ContactPage,
  HelpPage: module.HelpPage,
})));
const AboutPage = lazy(() => import("./pages/StaticPages").then(m => ({ default: m.AboutPage })));
const PrivacyPage = lazy(() => import("./pages/StaticPages").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/StaticPages").then(m => ({ default: m.TermsPage })));
const ContactPage = lazy(() => import("./pages/StaticPages").then(m => ({ default: m.ContactPage })));
const HelpPage = lazy(() => import("./pages/StaticPages").then(m => ({ default: m.HelpPage })));

// مكون التحميل الافتراضي
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
        <p className="text-white/70">جاري التحميل...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* الصفحات العامة - لا تحتاج تسجيل دخول */}
      <Route path={"/"} component={Home} />
      <Route path={"/auth"} component={PremiumLogin} />
      <Route path={"/login"} component={PremiumLogin} />
      <Route path={"/auth-old"} component={LoginPage} />
      <Route path={"/register"} component={AccountTypePage} />
      <Route path={"/account-type"} component={AccountTypePage} />
      <Route path={"/register/buyer"} component={BuyerRegisterPage} />
      <Route path={"/register/seller"} component={SellerRegisterPage} />
      <Route path={"/forgot-password"} component={ForgotPasswordPage} />
      <Route path={"/register-new"} component={PremiumRegister} />
      <Route path={"/welcome"} component={WelcomePage} />
      <Route path={"/explore"} component={Explore} />
      <Route path={"/categories"} component={Categories} />
      <Route path={"/product/:id"} component={ProductDetail} />
      
      {/* الصفحات الثابتة */}
      <Route path={"/about"} component={AboutPage} />
      <Route path={"/privacy"} component={PrivacyPage} />
      <Route path={"/terms"} component={TermsPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/help"} component={HelpPage} />
      <Route path={"/faq"} component={HelpPage} />
      <Route path={"/blog"}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">المدونة</h1>
            <p className="text-muted-foreground">قريباً...</p>
          </div>
        </div>
      </Route>
      <Route path={"/careers"}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">الوظائف</h1>
            <p className="text-muted-foreground">قريباً...</p>
          </div>
        </div>
      </Route>
      <Route path={"/cookies"} component={PrivacyPage} />
      
      {/* سلة التسوق */}
      <Route path={"/cart"} component={Cart} />
      
      {/* صفحة إتمام الطلب */}
      <Route path={"/checkout"}>
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      </Route>
      
      {/* صفحة الدفع بالبطاقة */}
      <Route path={"/payment"} component={PaymentPage} />
      <Route path={"/payment/:orderId"} component={PaymentPage} />
      
      {/* صفحة مراجعات المنتج */}
      <Route path={"/product/:id/reviews"} component={ProductReviews} />
      
      {/* دفع الاشتراك */}
      <Route path={"/subscription-payment"} component={SubscriptionPayment} />
      
      {/* لوحة تحكم المستخدم - تحتاج تسجيل دخول */}
      <Route path={"/dashboard"}>
        <ProtectedRoute allowedRoles={['user', 'seller', 'admin', 'sub_admin']}>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      {/* لوحة تحكم البائع - تحتاج صلاحية بائع أو أعلى */}
      <Route path={"/seller-dashboard"}>
        <ProtectedRoute allowedRoles={['seller', 'admin', 'sub_admin']}>
          <SellerDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* لوحة تحكم الأدمن - تحتاج صلاحية أدمن */}
      <Route path={"/admin-dashboard"}>
        <ProtectedRoute allowedRoles={['admin', 'sub_admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* لوحة تحكم الأمان - للأدمن */}
      <Route path={"/admin/security"}>
        <ProtectedRoute allowedRoles={['admin']}>
          <SecurityDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* إدارة الأدوار والصلاحيات - للأدمن */}
      <Route path={"/admin/roles"}>
        <ProtectedRoute allowedRoles={['admin', 'sub_admin']}>
          <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <RoleManagement />
          </Suspense>
        </ProtectedRoute>
      </Route>
      
      {/* إدارة المدفوعات - للأدمن */}
      <Route path={"/admin/payments"}>
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPaymentsPage />
        </ProtectedRoute>
      </Route>
      
      {/* محفظة البائع */}
      <Route path={"/seller/wallet"}>
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerWalletPage />
        </ProtectedRoute>
      </Route>
      
      {/* مركز الإشعارات */}
      <Route path={"/notifications"}>
        <ProtectedRoute>
          <NotificationCenterPage />
        </ProtectedRoute>
      </Route>
      
      {/* الرسائل - تحتاج تسجيل دخول */}
      <Route path={"/messages"}>
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      </Route>
      
      {/* صفحة 404 */}
      <Route path={"/404"} component={NotFound} />
      
      {/* Fallback لأي مسار غير موجود */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          {/* AdminRedirect يضمن توجيه الأدمن فوراً إلى لوحة التحكم */}
          <AdminRedirect>
            {/* Suspense لتحميل الصفحات بشكل آمن */}
            <Suspense fallback={<LoadingFallback />}>
              <Router />
            </Suspense>
          </AdminRedirect>
          <ChatBot />
          <InstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
