/**
 * الصفحات الثابتة - STAR LUX
 * من نحن، الخصوصية، الشروط، اتصل بنا، مركز المساعدة
 */

import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ArrowRight, 
  Shield, 
  FileText, 
  HelpCircle, 
  Mail, 
  Phone, 
  MapPin,
  Users,
  Target,
  Award,
  Globe,
  MessageCircle,
  ChevronLeft
} from 'lucide-react';

// مكون التنقل المشترك
function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [, navigate] = useLocation();
  const { direction } = useLanguage();
  
  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16" dir={direction}>
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="text-white/70 hover:text-white mb-6"
        >
          <ChevronLeft className="w-4 h-4 ml-2" />
          العودة للرئيسية
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
        {subtitle && <p className="text-white/70">{subtitle}</p>}
      </div>
    </div>
  );
}

// صفحة من نحن
export function AboutPage() {
  const { direction, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={language === 'ar-IQ' ? 'من نحن' : 'About Us'}
        subtitle={language === 'ar-IQ' ? 'تعرف على قصتنا ورؤيتنا' : 'Learn about our story and vision'}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* القصة */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              {language === 'ar-IQ' ? 'قصتنا' : 'Our Story'}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {language === 'ar-IQ' 
                ? 'STAR LUX هي منصة تجارة إلكترونية عالمية تأسست بهدف ربط البائعين والمشترين من جميع أنحاء العالم. نؤمن بأن التجارة الإلكترونية يجب أن تكون متاحة للجميع، بغض النظر عن الموقع الجغرافي أو حجم العمل.'
                : 'STAR LUX is a global e-commerce platform founded with the goal of connecting sellers and buyers from around the world. We believe that e-commerce should be accessible to everyone, regardless of geographic location or business size.'}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {language === 'ar-IQ'
                ? 'بدأنا رحلتنا برؤية واضحة: إنشاء سوق رقمي آمن وموثوق يمكّن رواد الأعمال من تحقيق أحلامهم ويوفر للمستهلكين تجربة تسوق استثنائية.'
                : 'We started our journey with a clear vision: to create a safe and reliable digital marketplace that empowers entrepreneurs to achieve their dreams and provides consumers with an exceptional shopping experience.'}
            </p>
          </section>

          {/* الرؤية والرسالة */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  {language === 'ar-IQ' ? 'رؤيتنا' : 'Our Vision'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {language === 'ar-IQ'
                    ? 'أن نكون المنصة الرائدة للتجارة الإلكترونية في المنطقة العربية، ونساهم في تمكين الاقتصاد الرقمي.'
                    : 'To be the leading e-commerce platform in the Arab region, contributing to the empowerment of the digital economy.'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  {language === 'ar-IQ' ? 'رسالتنا' : 'Our Mission'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {language === 'ar-IQ'
                    ? 'توفير منصة آمنة وسهلة الاستخدام تربط البائعين بالمشترين وتضمن تجربة تسوق موثوقة للجميع.'
                    : 'Providing a safe and easy-to-use platform that connects sellers with buyers and ensures a reliable shopping experience for everyone.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* القيم */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Globe className="w-6 h-6 text-green-500" />
              {language === 'ar-IQ' ? 'قيمنا' : 'Our Values'}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: language === 'ar-IQ' ? 'الأمان' : 'Security', desc: language === 'ar-IQ' ? 'حماية بياناتك ومعاملاتك' : 'Protecting your data and transactions' },
                { icon: Users, title: language === 'ar-IQ' ? 'الثقة' : 'Trust', desc: language === 'ar-IQ' ? 'بناء علاقات موثوقة' : 'Building reliable relationships' },
                { icon: Award, title: language === 'ar-IQ' ? 'الجودة' : 'Quality', desc: language === 'ar-IQ' ? 'التميز في كل تفاصيل' : 'Excellence in every detail' },
              ].map((value, index) => (
                <Card key={index} className="bg-card/50 border-border text-center p-4">
                  <value.icon className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                  <h3 className="font-semibold mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// صفحة الخصوصية
export function PrivacyPage() {
  const { direction, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={language === 'ar-IQ' ? 'سياسة الخصوصية' : 'Privacy Policy'}
        subtitle={language === 'ar-IQ' ? 'آخر تحديث: يناير 2026' : 'Last updated: January 2026'}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-invert">
          <Card className="bg-card border-border p-6">
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '1. جمع المعلومات' : '1. Information Collection'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب، إجراء عملية شراء، أو التواصل معنا. تشمل هذه المعلومات: الاسم، البريد الإلكتروني، رقم الهاتف، وعنوان الشحن.'
                    : 'We collect information you provide directly when creating an account, making a purchase, or contacting us. This includes: name, email, phone number, and shipping address.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '2. استخدام المعلومات' : '2. Use of Information'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'نستخدم معلوماتك لمعالجة الطلبات، تحسين خدماتنا، إرسال التحديثات والعروض، وضمان أمان المنصة.'
                    : 'We use your information to process orders, improve our services, send updates and offers, and ensure platform security.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '3. حماية المعلومات' : '3. Information Protection'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'نستخدم تقنيات تشفير متقدمة لحماية بياناتك. لن نشارك معلوماتك الشخصية مع أطراف ثالثة دون موافقتك.'
                    : 'We use advanced encryption technologies to protect your data. We will not share your personal information with third parties without your consent.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '4. حقوقك' : '4. Your Rights'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'لديك الحق في الوصول إلى بياناتك، تصحيحها، أو حذفها. يمكنك التواصل معنا لممارسة هذه الحقوق.'
                    : 'You have the right to access, correct, or delete your data. You can contact us to exercise these rights.'}
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// صفحة الشروط والأحكام
export function TermsPage() {
  const { direction, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={language === 'ar-IQ' ? 'الشروط والأحكام' : 'Terms & Conditions'}
        subtitle={language === 'ar-IQ' ? 'آخر تحديث: يناير 2026' : 'Last updated: January 2026'}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-border p-6">
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '1. قبول الشروط' : '1. Acceptance of Terms'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'باستخدامك لمنصة STAR LUX، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق، يرجى عدم استخدام المنصة.'
                    : 'By using the STAR LUX platform, you agree to be bound by these terms and conditions. If you do not agree, please do not use the platform.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '2. الحسابات' : '2. Accounts'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يجب إبلاغنا فوراً عن أي استخدام غير مصرح به.'
                    : 'You are responsible for maintaining the confidentiality of your account information and password. You must notify us immediately of any unauthorized use.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '3. المشتريات' : '3. Purchases'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'جميع المشتريات خاضعة للتوافر. نحتفظ بالحق في رفض أو إلغاء أي طلب لأي سبب.'
                    : 'All purchases are subject to availability. We reserve the right to refuse or cancel any order for any reason.'}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {language === 'ar-IQ' ? '4. المسؤولية' : '4. Liability'}
                </h2>
                <p>
                  {language === 'ar-IQ'
                    ? 'STAR LUX ليست مسؤولة عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام المنصة.'
                    : 'STAR LUX is not responsible for any direct or indirect damages resulting from the use of the platform.'}
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// صفحة اتصل بنا
export function ContactPage() {
  const { direction, language } = useLanguage();
  
  const contactInfo = [
    { icon: Mail, label: language === 'ar-IQ' ? 'البريد الإلكتروني' : 'Email', value: 'ahmedyassin555555555@gmail.com', href: 'mailto:ahmedyassin555555555@gmail.com' },
    { icon: Phone, label: language === 'ar-IQ' ? 'الهاتف' : 'Phone', value: '+964 781 950 1604', href: 'tel:+9647819501604' },
    { icon: MessageCircle, label: 'Telegram', value: '@T54_5', href: 'https://t.me/T54_5' },
  ];
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={language === 'ar-IQ' ? 'اتصل بنا' : 'Contact Us'}
        subtitle={language === 'ar-IQ' ? 'نحن هنا لمساعدتك' : 'We are here to help'}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* معلومات التواصل */}
            <div>
              <h2 className="text-2xl font-bold mb-6">
                {language === 'ar-IQ' ? 'معلومات التواصل' : 'Contact Information'}
              </h2>
              <div className="space-y-4">
                {contactInfo.map((item, index) => (
                  <a 
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* نموذج التواصل */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>
                  {language === 'ar-IQ' ? 'أرسل رسالة' : 'Send a Message'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'ar-IQ' ? 'الاسم' : 'Name'}
                    </label>
                    <input 
                      type="text" 
                      className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'ar-IQ' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input 
                      type="email" 
                      className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'ar-IQ' ? 'الرسالة' : 'Message'}
                    </label>
                    <textarea 
                      rows={4}
                      className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600">
                    {language === 'ar-IQ' ? 'إرسال' : 'Send'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// صفحة مركز المساعدة
export function HelpPage() {
  const { direction, language } = useLanguage();
  
  const faqs = [
    {
      q: language === 'ar-IQ' ? 'كيف أنشئ حساب؟' : 'How do I create an account?',
      a: language === 'ar-IQ' ? 'انقر على "تسجيل" في أعلى الصفحة وأدخل بياناتك.' : 'Click "Sign Up" at the top of the page and enter your details.'
    },
    {
      q: language === 'ar-IQ' ? 'كيف أتتبع طلبي؟' : 'How do I track my order?',
      a: language === 'ar-IQ' ? 'يمكنك تتبع طلبك من لوحة التحكم في قسم "طلباتي".' : 'You can track your order from the dashboard in the "My Orders" section.'
    },
    {
      q: language === 'ar-IQ' ? 'ما هي طرق الدفع المتاحة؟' : 'What payment methods are available?',
      a: language === 'ar-IQ' ? 'نقبل زين كاش، ماستركارد، البطاقات المحلية، والدفع عند الاستلام.' : 'We accept Zain Cash, Mastercard, local cards, and cash on delivery.'
    },
    {
      q: language === 'ar-IQ' ? 'كيف أصبح بائعاً؟' : 'How do I become a seller?',
      a: language === 'ar-IQ' ? 'سجل حساب جديد واختر "بائع" ثم أنشئ متجرك.' : 'Register a new account, select "Seller", then create your store.'
    },
  ];
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={language === 'ar-IQ' ? 'مركز المساعدة' : 'Help Center'}
        subtitle={language === 'ar-IQ' ? 'إجابات على أسئلتك الشائعة' : 'Answers to your common questions'}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            {language === 'ar-IQ' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-amber-500/10 border-amber-500/30 mt-8">
            <CardContent className="p-6 text-center">
              <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar-IQ' ? 'لم تجد إجابتك؟' : "Didn't find your answer?"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'ar-IQ' ? 'تواصل معنا مباشرة وسنساعدك' : 'Contact us directly and we will help you'}
              </p>
              <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => window.location.href = '/contact'}>
                {language === 'ar-IQ' ? 'اتصل بنا' : 'Contact Us'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// صفحة 404 محسّنة
export function NotFoundPage() {
  const [, navigate] = useLocation();
  const { direction, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4" dir={direction}>
      <div className="text-center">
        <h1 className="text-9xl font-bold text-white/20 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">
          {language === 'ar-IQ' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h2>
        <p className="text-white/70 mb-6">
          {language === 'ar-IQ' ? 'عذراً، الصفحة التي تبحث عنها غير موجودة' : 'Sorry, the page you are looking for does not exist'}
        </p>
        <Button onClick={() => navigate('/')} className="bg-amber-500 hover:bg-amber-600">
          {language === 'ar-IQ' ? 'العودة للرئيسية' : 'Go Home'}
        </Button>
      </div>
    </div>
  );
}
