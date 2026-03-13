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
  const { direction, t } = useLanguage();
  
  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16" dir={direction}>
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="text-white/70 hover:text-white mb-6"
        >
          <ChevronLeft className="w-4 h-4 ml-2" />
          {t('static.backHome')}
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
        {subtitle && <p className="text-white/70">{subtitle}</p>}
      </div>
    </div>
  );
}

// صفحة من نحن
export function AboutPage() {
  const { direction, t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={t('static.about.title')}
        subtitle={t('static.about.subtitle')}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* القصة */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              {t('static.about.ourStoryTitle')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('static.about.ourStoryP1')}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t('static.about.ourStoryP2')}
            </p>
          </section>

          {/* الرؤية والرسالة */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  {t('static.about.visionTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('static.about.visionDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  {t('static.about.missionTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('static.about.missionDesc')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* القيم */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Globe className="w-6 h-6 text-green-500" />
              {t('static.about.valuesTitle')}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: t('static.about.value.securityTitle'), desc: t('static.about.value.securityDesc') },
                { icon: Users, title: t('static.about.value.trustTitle'), desc: t('static.about.value.trustDesc') },
                { icon: Award, title: t('static.about.value.qualityTitle'), desc: t('static.about.value.qualityDesc') },
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
  const { direction, t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={t('static.privacy.title')}
        subtitle={t('static.privacy.subtitle')}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-invert">
          <Card className="bg-card border-border p-6">
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.privacy.section1Title')}
                </h2>
                <p>
                  {t('static.privacy.section1Body')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.privacy.section2Title')}
                </h2>
                <p>
                  {t('static.privacy.section2Body')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.privacy.section3Title')}
                </h2>
                <p>
                  {t('static.privacy.section3Body')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.privacy.section4Title')}
                </h2>
                <p>
                  {t('static.privacy.section4Body')}
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
  const { direction, t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={t('static.terms.title')}
        subtitle={t('static.terms.subtitle')}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-border p-6">
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.terms.section1Title')}
                </h2>
                <p>
                  {t('static.terms.section1Body')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.terms.section2Title')}
                </h2>
                <p>
                  {t('static.terms.section2Body')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.terms.section3Title')}
                </h2>
                <p>
                  {t('static.terms.section3Body')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('static.terms.section4Title')}
                </h2>
                <p>
                  {t('static.terms.section4Body')}
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
  const { direction, t } = useLanguage();
  
  const contactInfo = [
    { icon: Mail, label: t('static.contact.emailLabel'), value: 'ahmedyassin555555555@gmail.com', href: 'mailto:ahmedyassin555555555@gmail.com' },
    { icon: Phone, label: t('static.contact.phoneLabel'), value: '+964 781 950 1604', href: 'tel:+9647819501604' },
    { icon: MessageCircle, label: 'Telegram', value: '@T54_5', href: 'https://t.me/T54_5' },
  ];
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={t('static.contact.title')}
        subtitle={t('static.contact.subtitle')}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* معلومات التواصل */}
            <div>
              <h2 className="text-2xl font-bold mb-6">
                {t('static.contact.infoTitle')}
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
                  {t('static.contact.formTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {t('static.contact.nameLabel')}
                    </label>
                    <input 
                      type="text" 
                      className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {t('static.contact.emailLabel')}
                    </label>
                    <input 
                      type="email" 
                      className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {t('static.contact.messageLabel')}
                    </label>
                    <textarea 
                      rows={4}
                      className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600">
                    {t('static.contact.sendButton')}
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
  const { direction, t } = useLanguage();
  
  const faqs = [
    {
      q: t('static.help.faq1Q'),
      a: t('static.help.faq1A')
    },
    {
      q: t('static.help.faq2Q'),
      a: t('static.help.faq2A')
    },
    {
      q: t('static.help.faq3Q'),
      a: t('static.help.faq3A')
    },
    {
      q: t('static.help.faq4Q'),
      a: t('static.help.faq4A')
    },
  ];
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PageHeader 
        title={t('static.help.title')}
        subtitle={t('static.help.subtitle')}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            {t('static.help.faqTitle')}
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
                {t('static.help.notFoundTitle')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('static.help.notFoundSubtitle')}
              </p>
              <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => window.location.href = '/contact'}>
                {t('static.help.contactButton')}
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
  const { direction, t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4" dir={direction}>
      <div className="text-center">
        <h1 className="text-9xl font-bold text-white/20 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('static.notFound.title')}
        </h2>
        <p className="text-white/70 mb-6">
          {t('static.notFound.subtitle')}
        </p>
        <Button onClick={() => navigate('/')} className="bg-amber-500 hover:bg-amber-600">
          {t('static.notFound.goHome')}
        </Button>
      </div>
    </div>
  );
}
