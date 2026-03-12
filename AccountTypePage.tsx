import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Store, Sparkles, ArrowLeft, CheckCircle2, Zap, Shield, TrendingUp } from "lucide-react";

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full opacity-20"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ))}
  </div>
);

export default function AccountTypePage() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<"buyer" | "seller" | null>(null);
  const [hoveredType, setHoveredType] = useState<"buyer" | "seller" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectType = (type: "buyer" | "seller") => {
    setSelectedType(type);
    // Add a small delay for the animation before navigating
    setTimeout(() => {
      if (type === "buyer") {
        setLocation("/register/buyer");
      } else {
        setLocation("/register/seller");
      }
    }, 300);
  };

  const buyerFeatures = [
    { icon: ShoppingBag, text: "تصفح ملايين المنتجات" },
    { icon: Zap, text: "سلة تسوق ذكية" },
    { icon: Shield, text: "حماية المشتري" },
  ];

  const sellerFeatures = [
    { icon: Store, text: "متجر احترافي مجاني" },
    { icon: TrendingUp, text: "لوحة تحكم متقدمة" },
    { icon: Zap, text: "أدوات ذكاء اصطناعي" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Main Card */}
      <div 
        className={`relative w-full max-w-3xl z-10 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        {/* Animated glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-40 animate-gradient-xy" />
        
        {/* Glass card */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={() => setLocation("/auth")}
            className="absolute top-6 left-6 p-2.5 text-slate-400 hover:text-white transition-all duration-300 rounded-xl hover:bg-slate-800/50 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          </button>

          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div 
              className={`inline-flex items-center gap-3 mb-4 transition-all duration-500 delay-100 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/30 rounded-xl blur-lg animate-pulse" />
                <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                STAR LUX
              </h1>
            </div>
            
            <h2 
              className={`text-2xl font-bold text-white mb-3 transition-all duration-500 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              اختر نوع حسابك
            </h2>
            
            <p 
              className={`text-slate-400 transition-all duration-500 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              حدد نوع الحساب المناسب لك للمتابعة
            </p>
          </div>

          {/* Account Type Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Buyer Option */}
            <button
              onClick={() => handleSelectType("buyer")}
              onMouseEnter={() => setHoveredType("buyer")}
              onMouseLeave={() => setHoveredType(null)}
              disabled={selectedType !== null}
              className={`relative group p-6 rounded-2xl border-2 transition-all duration-500 transform ${
                selectedType === "buyer" 
                  ? "scale-105 border-cyan-500 bg-cyan-500/20" 
                  : selectedType === "seller"
                    ? "scale-95 opacity-50 border-slate-700"
                    : hoveredType === "buyer"
                      ? "scale-[1.02] border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-cyan-500/50"
              } ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
              style={{ transitionDelay: mounted ? "400ms" : "0ms" }}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-xl transition-opacity duration-500 ${
                hoveredType === "buyer" || selectedType === "buyer" ? "opacity-100" : "opacity-0"
              }`} />
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  hoveredType === "buyer" || selectedType === "buyer"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30"
                    : "bg-slate-800"
                }`}>
                  <ShoppingBag className={`w-10 h-10 transition-all duration-500 ${
                    hoveredType === "buyer" || selectedType === "buyer" 
                      ? "text-white scale-110" 
                      : "text-cyan-400"
                  }`} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">مشتري</h3>
                <p className="text-slate-400 text-sm mb-5">
                  تصفح المنتجات وقم بالشراء من أفضل المتاجر
                </p>
                
                {/* Features */}
                <div className="space-y-3">
                  {buyerFeatures.map((feature, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                        hoveredType === "buyer" ? "translate-x-1" : ""
                      }`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                        hoveredType === "buyer" || selectedType === "buyer"
                          ? "bg-cyan-500/20"
                          : "bg-slate-800"
                      }`}>
                        <feature.icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-slate-300">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Selection indicator */}
                {selectedType === "buyer" && (
                  <div className="absolute top-4 right-4 animate-scaleIn">
                    <div className="bg-cyan-500 rounded-full p-1">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>

            {/* Seller Option */}
            <button
              onClick={() => handleSelectType("seller")}
              onMouseEnter={() => setHoveredType("seller")}
              onMouseLeave={() => setHoveredType(null)}
              disabled={selectedType !== null}
              className={`relative group p-6 rounded-2xl border-2 transition-all duration-500 transform ${
                selectedType === "seller" 
                  ? "scale-105 border-purple-500 bg-purple-500/20" 
                  : selectedType === "buyer"
                    ? "scale-95 opacity-50 border-slate-700"
                    : hoveredType === "seller"
                      ? "scale-[1.02] border-purple-500 bg-purple-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-purple-500/50"
              } ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
              style={{ transitionDelay: mounted ? "500ms" : "0ms" }}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl transition-opacity duration-500 ${
                hoveredType === "seller" || selectedType === "seller" ? "opacity-100" : "opacity-0"
              }`} />
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  hoveredType === "seller" || selectedType === "seller"
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
                    : "bg-slate-800"
                }`}>
                  <Store className={`w-10 h-10 transition-all duration-500 ${
                    hoveredType === "seller" || selectedType === "seller" 
                      ? "text-white scale-110" 
                      : "text-purple-400"
                  }`} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">بائع</h3>
                <p className="text-slate-400 text-sm mb-5">
                  أنشئ متجرك الخاص وابدأ البيع للعالم
                </p>
                
                {/* Features */}
                <div className="space-y-3">
                  {sellerFeatures.map((feature, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                        hoveredType === "seller" ? "translate-x-1" : ""
                      }`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                        hoveredType === "seller" || selectedType === "seller"
                          ? "bg-purple-500/20"
                          : "bg-slate-800"
                      }`}>
                        <feature.icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-slate-300">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Selection indicator */}
                {selectedType === "seller" && (
                  <div className="absolute top-4 right-4 animate-scaleIn">
                    <div className="bg-purple-500 rounded-full p-1">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}

                {/* Popular badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    الأكثر شعبية
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Login Link */}
          <div 
            className={`text-center mt-10 pt-6 border-t border-slate-800 transition-all duration-500 delay-600 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-slate-400">
              لديك حساب بالفعل?{" "}
              <button
                onClick={() => setLocation("/auth")}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-300 hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 8s ease infinite;
        }
        
        .animate-blob {
          animation: blob 10s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
