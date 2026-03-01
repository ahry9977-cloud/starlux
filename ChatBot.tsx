import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, Send, Loader2, Minimize2, Maximize2, Sparkles,
  ShoppingCart, Store, Shield, HelpCircle, Package,
  CreditCard, Truck, RefreshCw, MessageSquare, Zap
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { cn } from '@/lib/utils';

// أنواع الرسائل
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

// أنواع المستخدمين
type UserRole = 'guest' | 'user' | 'seller' | 'admin';

// سياق المحادثة
interface ConversationContext {
  topic: string | null;
  lastQuestions: string[];
  userIntent: string | null;
  sessionStartTime: Date;
}

// معلومات المنصة الشاملة
const platformKnowledge = {
  name: 'STAR LUX',
  description: 'منصة تجارة إلكترونية عالمية متعددة البائعين',
  features: {
    shopping: ['تسوق آمن', 'ملايين المنتجات', 'أسعار تنافسية', 'عروض يومية'],
    payment: ['بطاقات ائتمان', 'زين كاش', 'آسيا باي'],
    shipping: ['شحن عالمي', 'توصيل سريع 3-7 أيام', 'شحن مجاني فوق 50$', 'تتبع مباشر'],
    support: ['دعم 24/7', 'دردشة مباشرة', 'مركز مساعدة شامل'],
  },
  categories: [
    { name: 'الإلكترونيات', icon: '📱', products: 'هواتف، لابتوبات، إكسسوارات' },
    { name: 'الأزياء', icon: '👔', products: 'ملابس رجالية ونسائية، أحذية' },
    { name: 'المنزل', icon: '🏠', products: 'أثاث، ديكور، أدوات منزلية' },
    { name: 'الجمال', icon: '💄', products: 'مستحضرات تجميل، عناية بالبشرة' },
    { name: 'الرياضة', icon: '⚽', products: 'معدات رياضية، ملابس رياضية' },
  ],
  policies: {
    returns: { period: '14 يوم', condition: 'المنتج بحالته الأصلية', refund: 'كامل المبلغ' },
    warranty: { period: 'سنة كاملة', coverage: 'عيوب التصنيع' },
    privacy: 'حماية كاملة لبياناتك الشخصية',
  },
  contact: {
    whatsapp: '+9647819501604',
    telegram: '@T54_5',
    instagram: '@0q.b4',
    tiktok: '@4j_j7',
    email: 'ahmedyassin555555555@gmail.com',
  },
  sellerInfo: {
    plans: [
      { name: 'مجانية', price: 0, products: 10, features: ['متجر واحد', 'دعم أساسي'] },
      { name: 'برو', price: 50, products: 100, features: ['تقارير مفصلة', 'دعم متقدم'] },
      { name: 'كميونتي', price: 80, products: 'غير محدود', features: ['متاجر متعددة', 'أولوية في البحث', 'دعم VIP'] },
    ],
    commission: '2% من كل عملية بيع',
    payouts: 'تحويل أسبوعي للأرباح',
  },
};

// ردود ذكية حسب الدور
const roleBasedResponses: Record<UserRole, Record<string, string>> = {
  guest: {
    welcome: '🌟 مرحباً بك في STAR LUX!\n\nأنا مساعدك الذكي. يمكنني مساعدتك في:\n• استكشاف المنتجات والأقسام\n• معرفة طرق الدفع والشحن\n• إنشاء حساب جديد\n\nكيف يمكنني مساعدتك؟',
    register: '📝 للتسجيل في STAR LUX:\n\n1️⃣ اضغط على "تسجيل" في الأعلى\n2️⃣ اختر نوع الحساب (مشتري/بائع)\n3️⃣ أدخل بياناتك\n4️⃣ فعّل حسابك عبر البريد\n\nالتسجيل مجاني ويستغرق دقيقة واحدة! 🚀',
  },
  user: {
    welcome: '👋 أهلاً بك مجدداً!\n\nكيف يمكنني مساعدتك اليوم؟\n• تتبع طلباتك\n• البحث عن منتجات\n• إدارة حسابك\n• الدعم الفني',
    orders: '📦 لتتبع طلباتك:\n\n1️⃣ اذهب إلى "طلباتي"\n2️⃣ اختر الطلب المطلوب\n3️⃣ شاهد حالة الشحن والتتبع\n\nهل تحتاج مساعدة في طلب معين؟',
    cart: '🛒 سلة التسوق:\n\n• راجع المنتجات المضافة\n• عدّل الكميات\n• طبّق كود الخصم\n• أكمل عملية الشراء\n\nهل تواجه مشكلة في السلة؟',
  },
  seller: {
    welcome: '🏪 مرحباً أيها البائع!\n\nكيف يمكنني مساعدتك؟\n• إدارة المنتجات\n• متابعة الطلبات\n• تقارير المبيعات\n• إعدادات المتجر',
    products: '📦 إدارة المنتجات:\n\n• إضافة منتج جديد\n• تعديل المنتجات الحالية\n• إدارة المخزون\n• تحديث الأسعار\n\nماذا تريد أن تفعل؟',
    sales: '📊 تقارير المبيعات:\n\n• إجمالي المبيعات\n• المنتجات الأكثر مبيعاً\n• تحليل العملاء\n• الأرباح والعمولات\n\nاذهب إلى لوحة التحكم للتفاصيل.',
    payouts: '💰 الأرباح والتحويلات:\n\n• العمولة: 2% من كل عملية\n• التحويل: أسبوعياً\n• الحد الأدنى: 50$\n• طرق الدفع: Visa, Mastercard, Asia Pay, زين كاش',
  },
  admin: {
    welcome: '👑 مرحباً أيها المدير!\n\nلوحة التحكم الإدارية:\n• إدارة المستخدمين\n• مراجعة المتاجر\n• التقارير المالية\n• إعدادات النظام',
    users: '👥 إدارة المستخدمين:\n\n• عرض جميع المستخدمين\n• تفعيل/تعطيل الحسابات\n• مراجعة طلبات البائعين\n• إدارة الصلاحيات',
    reports: '📈 التقارير الإدارية:\n\n• إجمالي المبيعات\n• عدد المستخدمين الجدد\n• المتاجر النشطة\n• العمولات المحصلة',
  },
};

// الكلمات المفتاحية والنوايا
const intentPatterns: Record<string, { keywords: string[], response: string, suggestions: string[] }> = {
  greeting: {
    keywords: ['مرحبا', 'السلام', 'هلو', 'اهلا', 'صباح', 'مساء', 'hello', 'hi', 'hey'],
    response: 'greet',
    suggestions: ['كيف أشتري؟', 'الأقسام', 'طرق الدفع'],
  },
  buy: {
    keywords: ['شراء', 'اشتري', 'شري', 'buy', 'purchase', 'order'],
    response: '🛒 للشراء من STAR LUX:\n\n1️⃣ تصفح الأقسام أو ابحث\n2️⃣ اختر المنتج واضغط "أضف للسلة"\n3️⃣ راجع السلة وأكمل الطلب\n4️⃣ اختر طريقة الدفع والعنوان\n5️⃣ أكد الطلب واستلم! 📦',
    suggestions: ['طرق الدفع', 'الشحن', 'الأقسام'],
  },
  sell: {
    keywords: ['بيع', 'ابيع', 'بائع', 'متجر', 'sell', 'seller', 'store', 'shop'],
    response: '🏪 لتصبح بائعاً في STAR LUX:\n\n1️⃣ سجل حساب جديد كبائع\n2️⃣ اختر خطة الاشتراك\n3️⃣ أنشئ متجرك وأضف المنتجات\n4️⃣ ابدأ البيع واستقبل الطلبات!\n\n💰 العمولة: 2% فقط من كل عملية',
    suggestions: ['خطط الاشتراك', 'العمولات', 'كيف أضيف منتج؟'],
  },
  categories: {
    keywords: ['قسم', 'اقسام', 'فئة', 'category', 'categories', 'section'],
    response: '📂 أقسام STAR LUX:\n\n📱 الإلكترونيات - هواتف، لابتوبات، إكسسوارات\n👔 الأزياء - ملابس رجالية ونسائية\n🏠 المنزل - أثاث، ديكور، أدوات\n💄 الجمال - مستحضرات تجميل، عناية\n⚽ الرياضة - معدات وملابس رياضية\n\nأي قسم يهمك؟',
    suggestions: ['الإلكترونيات', 'الأزياء', 'عروض اليوم'],
  },
  payment: {
    keywords: ['دفع', 'فلوس', 'payment', 'pay', 'money', 'visa', 'mastercard', 'زين'],
    response: '💳 طرق الدفع المتاحة:\n\n• بطاقات الائتمان (Visa, Mastercard)\n• زين كاش 📱\n• آسيا باي\n\n🔒 جميع المعاملات مشفرة وآمنة',
    suggestions: ['الشحن', 'كيف أشتري؟', 'الإرجاع'],
  },
  shipping: {
    keywords: ['شحن', 'توصيل', 'delivery', 'shipping', 'ship'],
    response: '🚚 خدمات الشحن:\n\n• شحن عالمي لجميع الدول 🌍\n• توصيل سريع: 3-7 أيام\n• شحن مجاني للطلبات فوق 50$\n• تتبع مباشر لشحنتك\n• تغليف آمن ومحكم\n\nأين موقعك؟ سأخبرك بتكلفة الشحن.',
    suggestions: ['تتبع طلبي', 'الدفع', 'الإرجاع'],
  },
  returns: {
    keywords: ['ارجاع', 'استرجاع', 'رد', 'return', 'refund', 'exchange'],
    response: '↩️ سياسة الإرجاع:\n\n• مدة الإرجاع: 14 يوم\n• الشرط: المنتج بحالته الأصلية\n• الاسترداد: كامل المبلغ\n• الشحن: مجاني للمنتجات المعيبة\n\n📞 تواصل معنا لبدء طلب الإرجاع',
    suggestions: ['التواصل معنا', 'تتبع طلبي', 'الضمان'],
  },
  contact: {
    keywords: ['تواصل', 'اتصال', 'رقم', 'contact', 'support', 'help', 'مساعدة'],
    response: '📞 تواصل معنا:\n\n📱 WhatsApp: +9647819501604\n✈️ Telegram: @T54_5\n📸 Instagram: @0q.b4\n🎵 TikTok: @4j_j7\n📧 Email: ahmedyassin555555555@gmail.com\n\n⏰ متاحون 24/7 لخدمتك!',
    suggestions: ['الأسئلة الشائعة', 'سياسة الإرجاع'],
  },
  plans: {
    keywords: ['خطة', 'اشتراك', 'سعر', 'plan', 'subscription', 'price', 'pricing'],
    response: '💎 خطط الاشتراك للبائعين:\n\n🆓 مجانية - 0$\n• 10 منتجات، متجر واحد\n\n⭐ برو - 50$/شهر\n• 100 منتج، تقارير مفصلة\n\n👑 كميونتي - 80$/شهر\n• منتجات غير محدودة، متاجر متعددة، أولوية في البحث\n\nأي خطة تناسبك؟',
    suggestions: ['كيف أسجل كبائع؟', 'العمولات', 'المميزات'],
  },
  track: {
    keywords: ['تتبع', 'طلب', 'اين', 'track', 'order', 'where'],
    response: '📍 لتتبع طلبك:\n\n1️⃣ اذهب إلى "طلباتي"\n2️⃣ اختر الطلب المطلوب\n3️⃣ اضغط "تتبع الشحنة"\n\n💡 ستصلك إشعارات تلقائية بكل تحديث!\n\nهل لديك رقم الطلب؟',
    suggestions: ['التواصل معنا', 'الإرجاع'],
  },
};

// دالة تحديد نية المستخدم
function detectIntent(message: string): { intent: string | null, response: string | null, suggestions: string[] } {
  const normalizedMessage = message.toLowerCase().trim();
  
  for (const [intent, data] of Object.entries(intentPatterns)) {
    for (const keyword of data.keywords) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        return { 
          intent, 
          response: data.response === 'greet' ? null : data.response,
          suggestions: data.suggestions 
        };
      }
    }
  }
  
  return { intent: null, response: null, suggestions: ['كيف أشتري؟', 'الأقسام', 'التواصل معنا'] };
}

// دالة الحصول على رد حسب الدور
function getRoleBasedGreeting(role: UserRole, isArabic: boolean): string {
  const responses = roleBasedResponses[role];
  return responses?.welcome || roleBasedResponses.guest.welcome;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    topic: null,
    lastQuestions: [],
    userIntent: null,
    sessionStartTime: new Date(),
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const isArabic = language === 'ar-IQ';
  
  // تحديد دور المستخدم
  const userRole: UserRole = user?.role === 'admin' ? 'admin' 
    : user?.role === 'seller' ? 'seller'
    : user ? 'user' 
    : 'guest';
  
  // رسالة ترحيبية حسب الدور
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: getRoleBasedGreeting(userRole, isArabic),
        timestamp: new Date(),
        suggestions: userRole === 'guest' 
          ? ['كيف أسجل؟', 'الأقسام', 'طرق الدفع']
          : userRole === 'seller'
          ? ['إضافة منتج', 'تقارير المبيعات', 'إعدادات المتجر']
          : userRole === 'admin'
          ? ['إدارة المستخدمين', 'التقارير', 'الإعدادات']
          : ['طلباتي', 'البحث عن منتج', 'المساعدة'],
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, isArabic, userRole]);
  
  // التمرير للأسفل
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // التركيز على الإدخال
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);
  
  // معالجة الإرسال
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    
    // تحديث السياق
    setContext(prev => ({
      ...prev,
      lastQuestions: [...prev.lastQuestions.slice(-4), currentInput],
    }));
    
    try {
      // تحليل نية المستخدم
      const { intent, response, suggestions } = detectIntent(currentInput);
      
      // تحديث السياق بالنية
      if (intent) {
        setContext(prev => ({ ...prev, topic: intent, userIntent: intent }));
      }
      
      // إذا وجدنا رد محلي
      if (response) {
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            suggestions,
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 400 + Math.random() * 300);
        return;
      }
      
      // تحية حسب الدور
      if (intent === 'greeting') {
        setTimeout(() => {
          const greetingResponse = getRoleBasedGreeting(userRole, isArabic);
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: greetingResponse,
            timestamp: new Date(),
            suggestions,
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 400);
        return;
      }
      
      // استخدام LLM للأسئلة المعقدة
      const systemPrompt = `أنت مساعد ذكي لمنصة STAR LUX للتجارة الإلكترونية.
المستخدم الحالي: ${userRole === 'guest' ? 'زائر' : userRole === 'seller' ? 'بائع' : userRole === 'admin' ? 'مدير' : 'مشتري'}
${user?.name ? `اسم المستخدم: ${user.name}` : ''}

معلومات المنصة:
- منصة تجارة إلكترونية عالمية متعددة البائعين
- طرق الدفع: Visa, Mastercard, آسيا باي, زين كاش
- الشحن: عالمي، 3-7 أيام، مجاني فوق 50$
- الإرجاع: 14 يوم، استرداد كامل
- التواصل: WhatsApp +9647819501604, Telegram @T54_5

السياق السابق: ${context.lastQuestions.join(' | ')}

قواعد الرد:
1. أجب بشكل مختصر وواضح (3-5 أسطر)
2. استخدم الإيموجي بشكل معتدل
3. قدم معلومات دقيقة فقط
4. إذا لم تعرف الإجابة، اقترح التواصل مع الدعم
5. خصص الرد حسب دور المستخدم`;

      const response2 = await fetch('/api/trpc/chatbot.chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            message: currentInput,
            language: isArabic ? 'ar' : 'en',
            context: context.lastQuestions.join('\n'),
            userRole,
          }
        }),
      });
      
      if (response2.ok) {
        const data = await response2.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.result?.data?.json?.response || (isArabic 
            ? '🤔 لم أفهم سؤالك بشكل كامل. هل يمكنك إعادة صياغته؟\n\nأو تواصل معنا مباشرة:\n📱 WhatsApp: +9647819501604'
            : 'I didn\'t fully understand. Could you rephrase?\n\nOr contact us:\n📱 WhatsApp: +9647819501604'),
          timestamp: new Date(),
          suggestions: ['التواصل معنا', 'الأقسام', 'المساعدة'],
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      // رد افتراضي ذكي
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isArabic 
          ? '💡 شكراً لسؤالك!\n\nللحصول على مساعدة أسرع، تواصل معنا:\n📱 WhatsApp: +9647819501604\n✈️ Telegram: @T54_5\n\nأو جرب أحد الأسئلة الشائعة أدناه 👇'
          : '💡 Thanks for your question!\n\nFor faster help, contact us:\n📱 WhatsApp: +9647819501604\n✈️ Telegram: @T54_5',
        timestamp: new Date(),
        suggestions: ['كيف أشتري؟', 'الأقسام', 'طرق الدفع'],
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isArabic, userRole, context, user]);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };
  
  // الاقتراحات السريعة الأولية
  const initialSuggestions = userRole === 'guest' 
    ? ['كيف أسجل؟', 'الأقسام', 'طرق الدفع', 'التواصل']
    : userRole === 'seller'
    ? ['إضافة منتج', 'طلبات جديدة', 'تقارير', 'الأرباح']
    : userRole === 'admin'
    ? ['المستخدمين', 'المتاجر', 'التقارير', 'الإعدادات']
    : ['طلباتي', 'البحث', 'السلة', 'المساعدة'];
  
  return (
    <>
      {/* زر فتح ChatBot - أيقونة جديدة متقدمة */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 z-50 group",
          isArabic ? "left-4" : "right-4",
          isOpen && "hidden"
        )}
        aria-label="Open chat"
      >
        {/* الحلقة الخارجية المتوهجة */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent via-secondary to-primary opacity-60 blur-lg group-hover:opacity-90 group-hover:blur-xl transition-all duration-500 animate-pulse" />
        
        {/* الحلقة الوسطى */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-accent to-secondary opacity-40 animate-spin-slow" style={{ animationDuration: '8s' }} />
        
        {/* الزر الرئيسي */}
        <div className="relative w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:shadow-primary/35 group-hover:scale-105 transition-all duration-300">
          {/* الأيقونة المتحركة */}
          <div className="relative">
            {/* نجمة خلفية */}
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
            
            {/* أيقونة الدردشة الرئيسية */}
            <div className="relative">
              <MessageSquare className="w-6 h-6 text-accent transition-colors" />
              <Zap className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-400 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          
          {/* نقطة الحالة */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card animate-pulse" />
        </div>
        
        {/* تلميح */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          {isArabic ? 'مساعد STAR LUX' : 'STAR LUX Assistant'}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
        </div>
      </button>
      
      {/* نافذة ChatBot */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <Card
            className={cn(
              "fixed bottom-4 z-50 shadow-2xl overflow-hidden",
              "bg-card/95 backdrop-blur-xl border border-border",
              "transition-all duration-300",
              isMinimized ? "w-72 h-14" : "w-[340px] h-[480px]",
              isArabic ? "left-4" : "right-4"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* تأثير الحدود المتوهجة */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/18 via-secondary/16 to-primary/18 opacity-60" />
            <div className="absolute inset-[1px] rounded-xl bg-card/90" />
            
            {/* Header */}
            <CardHeader className="relative p-3 border-b border-border bg-card/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* أيقونة المساعد */}
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-lg shadow-primary/15">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  
                  <div>
                    <CardTitle className="text-base font-bold text-white">
                      {isArabic ? 'مساعد STAR LUX' : 'STAR LUX Assistant'}
                    </CardTitle>
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      {isArabic ? 'متصل الآن' : 'Online'}
                      {userRole !== 'guest' && (
                        <span className="text-slate-400 mr-2">
                          • {userRole === 'admin' ? '👑' : userRole === 'seller' ? '🏪' : '👤'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {!isMinimized && (
              <>
                {/* Messages */}
                <CardContent className="relative p-0 flex-1 h-[320px]">
                  <ScrollArea className="h-full p-4">
                    <div ref={scrollRef} className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id}>
                          <div
                            className={cn(
                              "flex gap-3",
                              message.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                          >
                            {/* Avatar */}
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg",
                              message.role === 'user' 
                                ? "bg-gradient-to-br from-secondary to-primary" 
                                : "bg-gradient-to-br from-accent to-secondary"
                            )}>
                              {message.role === 'user' 
                                ? <span className="text-white text-sm font-bold">{user?.name?.[0] || '👤'}</span>
                                : <Sparkles className="w-4 h-4 text-white" />
                              }
                            </div>
                            
                            {/* Message Bubble */}
                            <div className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-lg",
                              message.role === 'user'
                                ? "bg-gradient-to-br from-secondary to-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm border border-border"
                            )}>
                              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              <p className={cn(
                                "text-[10px] mt-2 opacity-60",
                                message.role === 'user' ? "text-right text-primary-foreground/80" : "text-left text-muted-foreground"
                              )}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Suggestions */}
                          {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                            <div className={cn("flex flex-wrap gap-2 mt-3", isArabic ? "mr-11" : "ml-11")}>
                              {message.suggestions.map((suggestion, idx) => (
                                <Button
                                  key={idx}
                                  variant="secondary"
                                  size="sm"
                                  className="text-xs h-7 rounded-full bg-card/60 border-border text-accent hover:bg-accent/10 hover:border-accent/40 transition-all"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Loading Animation */}
                      {isLoading && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-lg">
                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 border border-border">
                            <div className="flex gap-1.5">
                              <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                
                {/* Quick Suggestions - Initial */}
                {messages.length <= 1 && (
                  <div className="relative px-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-2">{isArabic ? 'اقتراحات سريعة:' : 'Quick suggestions:'}</p>
                    <div className="flex flex-wrap gap-2">
                      {initialSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="secondary"
                          size="sm"
                          className="text-xs h-8 rounded-full bg-card/60 border-border text-foreground hover:bg-accent/10 hover:border-accent/40 transition-all"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Input */}
                <div className="relative p-3 border-t border-border bg-card/60">
                  <div className="flex gap-3">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isArabic ? "اكتب رسالتك..." : "Type your message..."}
                      className="flex-1 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent/50 focus:ring-accent/20"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="rounded-xl w-11 h-11 p-0 bg-gradient-to-br from-accent to-secondary hover:opacity-95 shadow-lg shadow-primary/15 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
      
      {/* CSS للرسوم المتحركة */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </>
  );
}
