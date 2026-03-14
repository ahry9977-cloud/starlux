import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStarLuxSound, useAdminSound, useModalSound, useFormSound } from '@/hooks/useStarLuxSound';
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EnhancedMotionBackground } from '@/components/backgrounds/EnhancedMotionBackground';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  Home
} from "lucide-react";

// Types
interface Product {
  id: number;
  title: string;
  description: string | null;
  price: string;
  stock: number | null;
  images: string[] | null;
  isActive: boolean;
  categoryId: number;
  createdAt: Date;
}

interface Order {
  id: number;
  buyerId: number;
  storeId: number;
  totalAmount: string;
  commission: string | null;
  sellerAmount: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  shippingAddress: string | null;
  notes: string | null;
  createdAt: Date;
}

interface PaymentMethod {
  id: number;
  methodType: string;
  accountDetails: string | null;
  isActive: boolean;
}

// Payment method labels - طرق الدفع العالمية والمحلية
const paymentMethodLabels: Record<string, string> = {
  sindipay: "SindiPay",
};

// Order status labels and colors
const orderStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500", icon: <Clock className="w-4 h-4" /> },
  processing: { label: "قيد المعالجة", color: "bg-blue-500", icon: <RefreshCw className="w-4 h-4" /> },
  shipped: { label: "تم الشحن", color: "bg-purple-500", icon: <Truck className="w-4 h-4" /> },
  delivered: { label: "تم التوصيل", color: "bg-green-500", icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "ملغي", color: "bg-red-500", icon: <XCircle className="w-4 h-4" /> },
  refunded: { label: "مسترجع", color: "bg-gray-500", icon: <RefreshCw className="w-4 h-4" /> },
};

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sindiPayForm, setSindiPayForm] = useState({
    merchantId: "",
    apiKey: "",
    apiSecret: "",
    webhookSecret: "",
    status: "inactive" as "inactive" | "active",
  });
  
  // Star Lux Sound System
  const { playClickSound, playNavigationSound, playSuccessSound, playErrorSound } = useStarLuxSound();
  const { onAction: playAdminAction, onDelete: playDeleteAction } = useAdminSound();
  const { onOpen: playModalOpen, onClose: playModalClose } = useModalSound();
  const { onSubmit: playFormSubmit } = useFormSound();
  
  // Store state
  const [hasStore, setHasStore] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: "", description: "", category: "" });
  
  // Product state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "0",
    categoryId: "",
    images: [] as string[],
    video: "",
  });
  
  // Payment method state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ methodType: "", accountDetails: "" });

  // tRPC queries
  const storeQuery = trpc.seller.getMyStore.useQuery(undefined, {
    enabled: !!user && (user.role === "seller" || user.role === "admin"),
  });
  const statsQuery = trpc.seller.getStats.useQuery(undefined, {
    enabled: !!user && (user.role === "seller" || user.role === "admin"),
  });
  const productsQuery = trpc.seller.getProducts.useQuery(undefined, {
    enabled: !!user && (user.role === "seller" || user.role === "admin"),
  });
  const ordersQuery = trpc.seller.getOrders.useQuery(undefined, {
    enabled: !!user && (user.role === "seller" || user.role === "admin"),
  });
  const paymentMethodsQuery = trpc.seller.getPaymentMethods.useQuery(undefined, {
    enabled: !!user && (user.role === "seller" || user.role === "admin"),
  });
  const sindiPayAccountQuery = trpc.seller.getSindiPayAccount.useQuery(undefined, {
    enabled: !!user && (user.role === "seller" || user.role === "admin"),
  });
  const categoriesQuery = trpc.products.getCategories.useQuery();

  const categories = (Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []) as any[];
  const sellerProducts = (Array.isArray((productsQuery.data as any)?.products) ? (productsQuery.data as any).products : []) as any[];
  const sellerOrders = (Array.isArray((ordersQuery.data as any)?.orders) ? (ordersQuery.data as any).orders : []) as any[];
  const sellerPaymentMethods = (Array.isArray(paymentMethodsQuery.data) ? paymentMethodsQuery.data : []) as any[];

  // tRPC mutations
  const createStoreMutation = trpc.seller.createStore.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المتجر بنجاح!");
      storeQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStoreMutation = trpc.seller.updateStore.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المتجر بنجاح!");
      storeQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const createProductMutation = trpc.seller.createProduct.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المنتج بنجاح!");
      productsQuery.refetch();
      statsQuery.refetch();
      setProductDialogOpen(false);
      resetProductForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateProductMutation = trpc.seller.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المنتج بنجاح!");
      productsQuery.refetch();
      setProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteProductMutation = trpc.seller.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح!");
      productsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateOrderStatusMutation = trpc.seller.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب بنجاح!");
      ordersQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const addPaymentMethodMutation = trpc.seller.addPaymentMethod.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة طريقة الدفع بنجاح!");
      paymentMethodsQuery.refetch();
      setPaymentDialogOpen(false);
      setPaymentForm({ methodType: "", accountDetails: "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const removePaymentMethodMutation = trpc.seller.removePaymentMethod.useMutation({
    onSuccess: () => {
      toast.success("تم حذف طريقة الدفع بنجاح!");
      paymentMethodsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const upsertSindiPayAccountMutation = trpc.seller.upsertSindiPayAccount.useMutation({
    onSuccess: async () => {
      toast.success("تم حفظ إعدادات SindiPay");
      playSuccessSound();
      await sindiPayAccountQuery.refetch();
      setSindiPayForm((p) => ({ ...p, apiKey: "", apiSecret: "", webhookSecret: "" }));
    },
    onError: (error) => {
      toast.error(error.message);
      playErrorSound();
    },
  });

  const disableSindiPayAccountMutation = trpc.seller.disableSindiPayAccount.useMutation({
    onSuccess: async () => {
      toast.success("تم تعطيل SindiPay");
      playSuccessSound();
      await sindiPayAccountQuery.refetch();
      setSindiPayForm({ merchantId: "", apiKey: "", apiSecret: "", webhookSecret: "", status: "inactive" });
    },
    onError: (error) => {
      toast.error(error.message);
      playErrorSound();
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success('تم تسجيل الخروج بنجاح');
      setLocation("/");
    },
    onError: () => {
      toast.error('فشل تسجيل الخروج');
    },
  });

  // Effects
  useEffect(() => {
    if (storeQuery.data) {
      setHasStore(true);
      setStoreForm({
        name: storeQuery.data.name,
        description: storeQuery.data.description || "",
        category: storeQuery.data.category,
      });
    }
  }, [storeQuery.data]);

  useEffect(() => {
    const acc: any = sindiPayAccountQuery.data as any;
    if (!acc) return;
    setSindiPayForm((prev) => ({
      ...prev,
      status: (String(acc.status ?? "inactive") as any) === "active" ? "active" : "inactive",
    }));
  }, [sindiPayAccountQuery.data]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    } else if (!authLoading && user && user.role !== "seller" && user.role !== "admin" && user.role !== "sub_admin") {
      toast.error("يجب أن تكون بائعاً للوصول إلى هذه الصفحة");
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

  // Helper functions
  const resetProductForm = () => {
    setProductForm({
      title: "",
      description: "",
      price: "",
      stock: "0",
      categoryId: "",
      images: [],
      video: "",
    });
  };

  const handleCreateStore = () => {
    if (!storeForm.name || !storeForm.category) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createStoreMutation.mutate(storeForm);
  };

  const handleUpdateStore = () => {
    updateStoreMutation.mutate(storeForm);
  };

  const handleCreateProduct = () => {
    if (!productForm.title || !productForm.price || !productForm.categoryId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createProductMutation.mutate({
      title: productForm.title,
      description: productForm.description,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock) || 0,
      categoryId: parseInt(productForm.categoryId),
      images: productForm.images,
      video: productForm.video || undefined,
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    updateProductMutation.mutate({
      id: editingProduct.id,
      title: productForm.title,
      description: productForm.description,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock) || 0,
      categoryId: parseInt(productForm.categoryId),
      images: productForm.images,
      video: productForm.video || undefined,
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description || "",
      price: product.price,
      stock: (product.stock || 0).toString(),
      categoryId: product.categoryId.toString(),
      images: product.images || [],
      video: "",
    });
    setProductDialogOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      deleteProductMutation.mutate({ id: productId });
    }
  };

  const handleUpdateOrderStatus = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: status as any });
  };

  const handleAddPaymentMethod = () => {
    if (!paymentForm.methodType || !paymentForm.accountDetails) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    addPaymentMethodMutation.mutate({
      methodType: paymentForm.methodType as any,
      accountDetails: paymentForm.accountDetails,
    });
  };

  const handleRemovePaymentMethod = (methodId: number) => {
    if (confirm("هل أنت متأكد من حذف طريقة الدفع هذه؟")) {
      removePaymentMethodMutation.mutate({ methodId });
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  // Stats data
  const stats = statsQuery.data || {
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalReviews: 0,
    averageRating: 0,
  };

  const sidebarItems = [
    { id: "overview", label: "نظرة عامة", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "products", label: "المنتجات", icon: <Package className="w-5 h-5" /> },
    { id: "orders", label: "الطلبات", icon: <ShoppingCart className="w-5 h-5" /> },
    { id: "payments", label: "طرق الدفع", icon: <CreditCard className="w-5 h-5" /> },
    { id: "store", label: "إعدادات المتجر", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
    <EnhancedMotionBackground variant="waves" colorScheme="gold" intensity="medium" parallax={true} />
    <div className="min-h-screen relative z-10" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-amber-200 z-50 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-amber-100">
          {sidebarOpen ? <X className="w-6 h-6 text-amber-700" /> : <Menu className="w-6 h-6 text-amber-700" />}
        </button>
        <h1 className="text-lg font-bold text-amber-800">لوحة تحكم البائع</h1>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-64 bg-white/80 backdrop-blur-lg border-l border-amber-200 z-40 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0`}>
        <div className="p-6 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-amber-800">{storeQuery.data?.name || "متجرك"}</h2>
              <p className="text-sm text-amber-600">{user?.name}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { playNavigationSound(); setActiveTab(item.id); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? "bg-gradient-to-l from-amber-400 to-orange-500 text-white shadow-lg"
                  : "text-amber-700 hover:bg-amber-100"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 mr-auto" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-200 space-y-2">
          <button
            onClick={() => setLocation('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">العودة للرئيسية</span>
          </button>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? "lg:mr-64" : ""} pt-16 lg:pt-0`}>
        <div className="p-6 lg:p-8">
          {/* Create Store Dialog (if no store) */}
          {!hasStore && !storeQuery.isLoading && (
            <Card className="max-w-lg mx-auto mt-20 border-amber-200 bg-white/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-amber-800">إنشاء متجرك</CardTitle>
                <CardDescription>أنشئ متجرك الآن لبدء البيع</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>اسم المتجر *</Label>
                  <Input
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    placeholder="أدخل اسم متجرك"
                    className="border-amber-200 focus:border-amber-400"
                  />
                </div>
                <div>
                  <Label>وصف المتجر</Label>
                  <Textarea
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    placeholder="وصف قصير لمتجرك"
                    className="border-amber-200 focus:border-amber-400"
                  />
                </div>
                <div>
                  <Label>تصنيف المتجر *</Label>
                  <Select value={storeForm.category} onValueChange={(v) => setStoreForm({ ...storeForm, category: v })}>
                    <SelectTrigger className="border-amber-200">
                      <SelectValue placeholder="اختر تصنيف المتجر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">إلكترونيات</SelectItem>
                      <SelectItem value="fashion">أزياء</SelectItem>
                      <SelectItem value="home">منزل وحديقة</SelectItem>
                      <SelectItem value="beauty">جمال وعناية</SelectItem>
                      <SelectItem value="sports">رياضة</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateStore}
                  disabled={createStoreMutation.isPending}
                  className="w-full bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600"
                >
                  {createStoreMutation.isPending ? "جاري الإنشاء..." : "إنشاء المتجر"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Content */}
          {hasStore && (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-amber-800">نظرة عامة</h1>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-amber-600">إجمالي المنتجات</p>
                            <p className="text-3xl font-bold text-amber-800">{stats.totalProducts}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-amber-600">إجمالي الطلبات</p>
                            <p className="text-3xl font-bold text-amber-800">{stats.totalOrders}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-amber-600">الطلبات المعلقة</p>
                            <p className="text-3xl font-bold text-amber-800">{stats.pendingOrders}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-amber-600">إجمالي الإيرادات</p>
                            <p className="text-3xl font-bold text-amber-800">${stats.totalRevenue}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rating Card */}
                  <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-amber-800">تقييم المتجر</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-8 h-8 ${
                                star <= stats.averageRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-800">{stats.averageRating.toFixed(1)}</p>
                          <p className="text-sm text-amber-600">{stats.totalReviews} تقييم</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === "products" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-amber-800">المنتجات</h1>
                    <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingProduct(null);
                            resetProductForm();
                          }}
                          className="bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600"
                        >
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة منتج
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
                          <DialogDescription>
                            {editingProduct ? "قم بتعديل بيانات المنتج" : "أضف منتجاً جديداً إلى متجرك"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>اسم المنتج *</Label>
                            <Input
                              value={productForm.title}
                              onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                              placeholder="أدخل اسم المنتج"
                            />
                          </div>
                          <div>
                            <Label>الوصف</Label>
                            <Textarea
                              value={productForm.description}
                              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                              placeholder="وصف المنتج"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>السعر *</Label>
                              <Input
                                type="number"
                                value={productForm.price}
                                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <Label>المخزون</Label>
                              <Input
                                type="number"
                                value={productForm.stock}
                                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>القسم *</Label>
                            <Select
                              value={productForm.categoryId || ""}
                              onValueChange={(v) =>
                                setProductForm({
                                  ...productForm,
                                  categoryId: v,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر القسم" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat: any) => (
                                  <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.nameAr}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setProductDialogOpen(false);
                              setEditingProduct(null);
                              setProductForm({
                                title: "",
                                description: "",
                                price: "",
                                stock: "",
                                categoryId: "",
                                images: [],
                                video: "",
                              });
                            }}
                          >
                            إلغاء
                          </Button>
                          <Button
                            onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                            disabled={createProductMutation.isPending || updateProductMutation.isPending}
                            className="bg-gradient-to-l from-amber-400 to-orange-500"
                          >
                            {editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerProducts.map((product: any) => (
                      <Card key={product.id} className="border-amber-200 bg-white/80 backdrop-blur-lg overflow-hidden">
                        <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                          <Package className="w-16 h-16 text-amber-300" />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-amber-800 line-clamp-1">{product.title}</h3>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                          <p className="text-sm text-amber-600 line-clamp-2 mb-3">{product.description || "لا يوجد وصف"}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-amber-800">${product.price}</p>
                            <p className="text-sm text-amber-600">المخزون: {product.stock || 0}</p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product as Product)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 ml-1" />
                              تعديل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {sellerProducts.length === 0 && (
                    <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                      <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-amber-800 mb-2">لا توجد منتجات</h3>
                        <p className="text-amber-600">أضف منتجك الأول لبدء البيع</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-amber-800">الطلبات</h1>

                  <div className="space-y-4">
                    {sellerOrders.map((order: any) => (
                      <Card key={order.id} className="border-amber-200 bg-white/80 backdrop-blur-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${orderStatusConfig[order.status]?.color} flex items-center justify-center text-white`}>
                                {orderStatusConfig[order.status]?.icon}
                              </div>
                              <div>
                                <p className="font-bold text-amber-800">طلب #{order.id}</p>
                                <p className="text-sm text-amber-600">
                                  {new Date(order.createdAt).toLocaleDateString("ar-IQ")}
                                </p>
                              </div>
                            </div>
                            <Badge className={orderStatusConfig[order.status]?.color}>
                              {orderStatusConfig[order.status]?.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-amber-600">رقم الطلب</p>
                              <p className="font-medium text-amber-800">#{order.id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-amber-600">العمولة</p>
                              <p className="font-medium text-red-600">${order.commission || '0'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-amber-600">الإجمالي</p>
                              <p className="font-medium text-amber-800">${order.totalAmount}</p>
                            </div>
                            <div>
                              <p className="text-sm text-amber-600">العنوان</p>
                              <p className="font-medium text-amber-800 line-clamp-1">
                                {order.shippingAddress || "غير محدد"}
                              </p>
                            </div>
                          </div>

                          {/* Order Status Actions */}
                          {order.status !== "delivered" && order.status !== "cancelled" && order.status !== "refunded" && (
                            <div className="flex gap-2 pt-4 border-t border-amber-200">
                              {order.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, "processing")}
                                    className="bg-blue-500 hover:bg-blue-600"
                                  >
                                    قبول الطلب
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                    className="text-red-600"
                                  >
                                    رفض الطلب
                                  </Button>
                                </>
                              )}
                              {order.status === "processing" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "shipped")}
                                  className="bg-purple-500 hover:bg-purple-600"
                                >
                                  تم الشحن
                                </Button>
                              )}
                              {order.status === "shipped" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  تم التوصيل
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {sellerOrders.length === 0 && (
                    <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                      <CardContent className="p-12 text-center">
                        <ShoppingCart className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-amber-800 mb-2">لا توجد طلبات</h3>
                        <p className="text-amber-600">ستظهر الطلبات هنا عندما يشتري العملاء منتجاتك</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-amber-800">طرق الدفع</h1>
                    <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600">
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة طريقة دفع
                        </Button>
                      </DialogTrigger>
                      <DialogContent dir="rtl">
                        <DialogHeader>
                          <DialogTitle>إضافة طريقة دفع</DialogTitle>
                          <DialogDescription>أضف طريقة دفع جديدة لاستقبال المدفوعات</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>نوع طريقة الدفع</Label>
                            <Select
                              value={paymentForm.methodType}
                              onValueChange={(v) => setPaymentForm({ ...paymentForm, methodType: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر طريقة الدفع" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(paymentMethodLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>تفاصيل الحساب</Label>
                            <Textarea
                              value={paymentForm.accountDetails}
                              onChange={(e) => setPaymentForm({ ...paymentForm, accountDetails: e.target.value })}
                              placeholder="أدخل تفاصيل الحساب (رقم الهاتف، رقم الحساب، إلخ)"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                            إلغاء
                          </Button>
                          <Button
                            onClick={handleAddPaymentMethod}
                            disabled={addPaymentMethodMutation.isPending}
                            className="bg-gradient-to-l from-amber-400 to-orange-500"
                          >
                            إضافة
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-amber-800 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        إعدادات SindiPay
                      </CardTitle>
                      <CardDescription>
                        اربط حساب SindiPay الخاص بك. يتم تشفير جميع المفاتيح داخل قاعدة البيانات.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          variant={(sindiPayAccountQuery.data as any)?.status === "active" ? "default" : "secondary"}
                          className={(sindiPayAccountQuery.data as any)?.status === "active" ? "bg-green-600" : undefined}
                        >
                          {(sindiPayAccountQuery.data as any)?.status === "active" ? "✓ مفعل" : "غير مفعل"}
                        </Badge>
                        {(sindiPayAccountQuery.data as any)?.merchantIdMasked && (
                          <Badge variant="outline">Merchant: {(sindiPayAccountQuery.data as any).merchantIdMasked}</Badge>
                        )}
                        {(sindiPayAccountQuery.data as any)?.hasApiKey && <Badge variant="outline">API Key محفوظ</Badge>}
                        {(sindiPayAccountQuery.data as any)?.hasWebhookSecret && (
                          <Badge variant="outline">Webhook Secret محفوظ</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Merchant ID</Label>
                          <Input
                            value={sindiPayForm.merchantId}
                            onChange={(e) => setSindiPayForm((p) => ({ ...p, merchantId: e.target.value }))}
                            placeholder="أدخل Merchant ID"
                            className="border-amber-200 focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <Label>الحالة</Label>
                          <Select
                            value={sindiPayForm.status}
                            onValueChange={(v) => setSindiPayForm((p) => ({ ...p, status: v as any }))}
                          >
                            <SelectTrigger className="border-amber-200">
                              <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inactive">غير مفعل</SelectItem>
                              <SelectItem value="active">مفعل</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>API Key</Label>
                          <Input
                            value={sindiPayForm.apiKey}
                            onChange={(e) => setSindiPayForm((p) => ({ ...p, apiKey: e.target.value }))}
                            placeholder="أدخل API Key"
                            className="border-amber-200 focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <Label>API Secret</Label>
                          <Input
                            value={sindiPayForm.apiSecret}
                            onChange={(e) => setSindiPayForm((p) => ({ ...p, apiSecret: e.target.value }))}
                            placeholder="أدخل API Secret"
                            className="border-amber-200 focus:border-amber-400"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Webhook Secret</Label>
                          <Input
                            value={sindiPayForm.webhookSecret}
                            onChange={(e) => setSindiPayForm((p) => ({ ...p, webhookSecret: e.target.value }))}
                            placeholder="أدخل Webhook Secret"
                            className="border-amber-200 focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleSaveSindiPay}
                          disabled={upsertSindiPayAccountMutation.isPending}
                          className="bg-gradient-to-l from-amber-400 to-orange-500"
                        >
                          {upsertSindiPayAccountMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDisableSindiPay}
                          disabled={disableSindiPayAccountMutation.isPending}
                          className="text-red-600 hover:bg-red-50"
                        >
                          {disableSindiPayAccountMutation.isPending ? "جاري التعطيل..." : "تعطيل SindiPay"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerPaymentMethods.map((method: any) => (
                      <Card key={method.id} className="border-amber-200 bg-white/80 backdrop-blur-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-amber-800">
                                  {paymentMethodLabels[method.methodType] || method.methodType}
                                </p>
                                <Badge variant={method.isActive ? "default" : "secondary"}>
                                  {method.isActive ? "نشط" : "غير نشط"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-amber-600 mb-4 line-clamp-2">
                            {method.accountDetails || "لا توجد تفاصيل"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemovePaymentMethod(method.id)}
                            className="w-full text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {sellerPaymentMethods.length === 0 && (
                    <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                      <CardContent className="p-12 text-center">
                        <CreditCard className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-amber-800 mb-2">لا توجد طرق دفع</h3>
                        <p className="text-amber-600">أضف طريقة دفع لاستقبال المدفوعات من العملاء</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Store Settings Tab */}
              {activeTab === "store" && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-amber-800">إعدادات المتجر</h1>

                  <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-amber-800">معلومات المتجر</CardTitle>
                      <CardDescription>قم بتعديل معلومات متجرك</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>اسم المتجر</Label>
                        <Input
                          value={storeForm.name}
                          onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                          className="border-amber-200 focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <Label>وصف المتجر</Label>
                        <Textarea
                          value={storeForm.description}
                          onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                          className="border-amber-200 focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <Label>تصنيف المتجر</Label>
                        <Select value={storeForm.category} onValueChange={(v) => setStoreForm({ ...storeForm, category: v })}>
                          <SelectTrigger className="border-amber-200">
                            <SelectValue placeholder="اختر تصنيف المتجر" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="electronics">إلكترونيات</SelectItem>
                            <SelectItem value="fashion">أزياء</SelectItem>
                            <SelectItem value="home">منزل وحديقة</SelectItem>
                            <SelectItem value="beauty">جمال وعناية</SelectItem>
                            <SelectItem value="sports">رياضة</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleUpdateStore}
                        disabled={updateStoreMutation.isPending}
                        className="bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600"
                      >
                        {updateStoreMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Store Status */}
                  <Card className="border-amber-200 bg-white/80 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-amber-800">حالة المتجر</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Badge variant={storeQuery.data?.isVerified ? "default" : "secondary"} className="text-sm py-1 px-3">
                          {storeQuery.data?.isVerified ? "✓ موثق" : "غير موثق"}
                        </Badge>
                        <Badge variant={storeQuery.data?.isActive ? "default" : "destructive"} className="text-sm py-1 px-3">
                          {storeQuery.data?.isActive ? "✓ نشط" : "غير نشط"}
                        </Badge>
                        <Badge className="text-sm py-1 px-3 bg-amber-500">
                          {storeQuery.data?.subscriptionPlan === "pro" ? "Pro" : storeQuery.data?.subscriptionPlan === "community" ? "Community" : "Free"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
    </>
  );
}
