/**
 * Ultra Fast Register Page - True Instant Load
 * Target: ≤ 1 Frame Load Time (16.67ms)
 * Zero Dependencies - Pure React + Inline CSS
 */

import { useState, useCallback, memo, useMemo } from 'react';
import { useLocation } from 'wouter';

// ============================================
// CRITICAL CSS - Inline for Zero Render Block
// ============================================
const CRITICAL_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.ufr-root{min-height:100vh;min-height:100dvh;background:#0a0a0f;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;direction:rtl;padding:1rem}
.ufr-card{width:100%;max-width:480px;padding:2rem;background:rgba(20,20,30,.95);border:1px solid rgba(75,0,255,.2);border-radius:1.5rem}
.ufr-logo{font-size:1.75rem;font-weight:700;background:linear-gradient(90deg,#00ffff,#4B00FF);-webkit-background-clip:text;background-clip:text;color:transparent;text-align:center;margin-bottom:.5rem}
.ufr-title{color:#fff;font-size:1.25rem;text-align:center;margin-bottom:.25rem}
.ufr-subtitle{color:rgba(255,255,255,.5);font-size:.875rem;text-align:center;margin-bottom:1.5rem}
.ufr-progress{display:flex;gap:.5rem;margin-bottom:1.5rem}
.ufr-step{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.1);transition:background .2s}
.ufr-step-active{background:linear-gradient(90deg,#4B00FF,#FF00FF)}
.ufr-step-done{background:#00ffff}
.ufr-input{width:100%;padding:.875rem 1rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:.75rem;color:#fff;font-size:1rem;outline:none;transition:border-color .15s,box-shadow .15s;margin-bottom:1rem}
.ufr-input:focus{border-color:#4B00FF;box-shadow:0 0 0 3px rgba(75,0,255,.2)}
.ufr-input::placeholder{color:rgba(255,255,255,.4)}
.ufr-input-error{border-color:#ef4444}
.ufr-btn{width:100%;padding:.875rem;background:linear-gradient(135deg,#4B00FF,#FF00FF);border:none;border-radius:.75rem;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s}
.ufr-btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(75,0,255,.4)}
.ufr-btn:active{transform:translateY(0)}
.ufr-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.ufr-btn-secondary{background:rgba(255,255,255,.1);margin-top:.75rem}
.ufr-btn-secondary:hover{background:rgba(255,255,255,.15);box-shadow:none;transform:none}
.ufr-link{color:#00ffff;text-decoration:none;font-size:.875rem}
.ufr-link:hover{text-decoration:underline}
.ufr-footer{text-align:center;margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,.1)}
.ufr-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#fca5a5;padding:.75rem;border-radius:.5rem;margin-bottom:1rem;font-size:.875rem;text-align:center}
.ufr-back{display:flex;align-items:center;gap:.5rem;color:rgba(255,255,255,.6);font-size:.875rem;cursor:pointer;margin-bottom:1.5rem;background:none;border:none}
.ufr-back:hover{color:#fff}
.ufr-types{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem}
.ufr-type{padding:1.5rem;background:rgba(255,255,255,.03);border:2px solid rgba(255,255,255,.1);border-radius:1rem;cursor:pointer;transition:all .2s;text-align:center}
.ufr-type:hover{border-color:rgba(75,0,255,.5);background:rgba(75,0,255,.1)}
.ufr-type-active{border-color:#4B00FF;background:rgba(75,0,255,.15)}
.ufr-type-icon{width:3rem;height:3rem;margin:0 auto .75rem;background:linear-gradient(135deg,#4B00FF,#FF00FF);border-radius:50%;display:flex;align-items:center;justify-content:center}
.ufr-type-title{color:#fff;font-weight:600;margin-bottom:.25rem}
.ufr-type-desc{color:rgba(255,255,255,.5);font-size:.75rem}
.ufr-pwd-wrap{position:relative}
.ufr-pwd-toggle{position:absolute;left:1rem;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:.25rem}
.ufr-pwd-toggle:hover{color:#fff}
.ufr-strength{height:4px;border-radius:2px;margin-top:-0.5rem;margin-bottom:1rem;transition:all .2s}
.ufr-strength-0{background:rgba(255,255,255,.1);width:0}
.ufr-strength-1{background:#ef4444;width:25%}
.ufr-strength-2{background:#f59e0b;width:50%}
.ufr-strength-3{background:#22c55e;width:75%}
.ufr-strength-4{background:#00ffff;width:100%}
.ufr-row{display:flex;gap:1rem}
.ufr-row>*{flex:1}
`;

// ============================================
// SVG ICONS - Inline for Zero Network Request
// ============================================
const Icons = {
  Back: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Store: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  Eye: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Check: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
};

// Password strength calculator
const calcStrength = (pwd: string): number => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
};

// ============================================
// MAIN COMPONENT - Memoized for Zero Re-render
// ============================================
const UltraFastRegister = memo(() => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<'buyer' | 'seller' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pwdStrength = useMemo(() => calcStrength(password), [password]);
  const totalSteps = accountType === 'seller' ? 4 : 3;

  // Navigation handlers
  const goHome = useCallback(() => setLocation('/'), [setLocation]);
  const goLogin = useCallback(() => setLocation('/auth'), [setLocation]);
  const togglePwd = useCallback(() => setShowPwd(p => !p), []);

  const nextStep = useCallback(() => {
    setError('');
    if (step === 1 && !accountType) {
      setError('يرجى اختيار نوع الحساب');
      return;
    }
    if (step === 2) {
      if (!name || !email || !password) {
        setError('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      if (password !== confirmPwd) {
        setError('كلمتا المرور غير متطابقتين');
        return;
      }
      if (pwdStrength < 2) {
        setError('كلمة المرور ضعيفة جداً');
        return;
      }
    }
    setStep(s => Math.min(s + 1, totalSteps));
  }, [step, accountType, name, email, password, confirmPwd, pwdStrength, totalSteps]);

  const prevStep = useCallback(() => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  }, []);

  const handleSubmit = useCallback(() => {
    setLoading(true);
    // Simulate instant registration
    setTimeout(() => {
      setStep(totalSteps);
      setLoading(false);
    }, 100);
  }, [totalSteps]);

  // Render step content
  const renderStep = () => {
    // Step 1: Account Type Selection
    if (step === 1) {
      return (
        <>
          <div className="ufr-title">اختر نوع حسابك</div>
          <div className="ufr-subtitle">حدد كيف تريد استخدام STAR LUX</div>
          
          <div className="ufr-types">
            <div 
              className={`ufr-type ${accountType === 'buyer' ? 'ufr-type-active' : ''}`}
              onClick={() => setAccountType('buyer')}
            >
              <div className="ufr-type-icon"><Icons.User /></div>
              <div className="ufr-type-title">مشتري</div>
              <div className="ufr-type-desc">تصفح واشتري المنتجات</div>
            </div>
            <div 
              className={`ufr-type ${accountType === 'seller' ? 'ufr-type-active' : ''}`}
              onClick={() => setAccountType('seller')}
            >
              <div className="ufr-type-icon"><Icons.Store /></div>
              <div className="ufr-type-title">بائع</div>
              <div className="ufr-type-desc">أنشئ متجرك وابدأ البيع</div>
            </div>
          </div>

          <button className="ufr-btn" onClick={nextStep}>
            التالي
          </button>
        </>
      );
    }

    // Step 2: User Information
    if (step === 2) {
      return (
        <>
          <div className="ufr-title">أدخل بياناتك</div>
          <div className="ufr-subtitle">أكمل معلومات حسابك</div>

          <input
            type="text"
            className="ufr-input"
            placeholder="الاسم الكامل *"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
          />

          <input
            type="email"
            className="ufr-input"
            placeholder="البريد الإلكتروني *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            dir="ltr"
          />

          <input
            type="tel"
            className="ufr-input"
            placeholder="رقم الهاتف (اختياري)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            autoComplete="tel"
            dir="ltr"
          />

          <div className="ufr-pwd-wrap">
            <input
              type={showPwd ? 'text' : 'password'}
              className="ufr-input"
              placeholder="كلمة المرور *"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              style={{ paddingLeft: '3rem' }}
            />
            <button type="button" className="ufr-pwd-toggle" onClick={togglePwd}>
              {showPwd ? <Icons.EyeOff /> : <Icons.Eye />}
            </button>
          </div>
          <div className={`ufr-strength ufr-strength-${pwdStrength}`} />

          <input
            type="password"
            className={`ufr-input ${password && confirmPwd && password !== confirmPwd ? 'ufr-input-error' : ''}`}
            placeholder="تأكيد كلمة المرور *"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
            dir="ltr"
          />

          <div className="ufr-row">
            <button className="ufr-btn ufr-btn-secondary" onClick={prevStep}>
              السابق
            </button>
            <button className="ufr-btn" onClick={nextStep}>
              التالي
            </button>
          </div>
        </>
      );
    }

    // Step 3 (Seller): Store Info OR Final for Buyer
    if (step === 3 && accountType === 'seller') {
      return (
        <>
          <div className="ufr-title">معلومات المتجر</div>
          <div className="ufr-subtitle">أخبرنا عن متجرك</div>

          <input
            type="text"
            className="ufr-input"
            placeholder="اسم المتجر *"
          />

          <input
            type="text"
            className="ufr-input"
            placeholder="وصف المتجر"
          />

          <select className="ufr-input" defaultValue="">
            <option value="" disabled>اختر الفئة الرئيسية</option>
            <option value="electronics">الإلكترونيات</option>
            <option value="fashion">الأزياء والموضة</option>
            <option value="home">المنزل والحديقة</option>
            <option value="sports">الرياضة</option>
          </select>

          <div className="ufr-row">
            <button className="ufr-btn ufr-btn-secondary" onClick={prevStep}>
              السابق
            </button>
            <button className="ufr-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </div>
        </>
      );
    }

    // Final Step: Success
    if ((step === 3 && accountType === 'buyer') || step === totalSteps) {
      if (step === 3 && accountType === 'buyer' && !loading) {
        // Trigger submit for buyer
        handleSubmit();
      }
      
      return (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Icons.Check />
          </div>
          <div className="ufr-title" style={{ marginBottom: '.5rem' }}>
            تم إنشاء حسابك بنجاح!
          </div>
          <div className="ufr-subtitle" style={{ marginBottom: '2rem' }}>
            مرحباً بك في STAR LUX، {name}
          </div>
          <button className="ufr-btn" onClick={goHome}>
            ابدأ التسوق الآن
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Critical CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      
      <div className="ufr-root">
        <div className="ufr-card">
          {/* Back Button */}
          {step < totalSteps && (
            <button className="ufr-back" onClick={step === 1 ? goHome : prevStep} type="button">
              <Icons.Back />
              <span>{step === 1 ? 'العودة للرئيسية' : 'رجوع'}</span>
            </button>
          )}

          {/* Logo */}
          <div className="ufr-logo">STAR LUX</div>

          {/* Progress Bar */}
          {step < totalSteps && (
            <div className="ufr-progress">
              {Array.from({ length: totalSteps - 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`ufr-step ${i + 1 < step ? 'ufr-step-done' : i + 1 === step ? 'ufr-step-active' : ''}`}
                />
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && <div className="ufr-error">{error}</div>}

          {/* Step Content */}
          {renderStep()}

          {/* Footer */}
          {step === 1 && (
            <div className="ufr-footer">
              <span style={{ color: 'rgba(255,255,255,.5)' }}>لديك حساب؟ </span>
              <a href="/auth" className="ufr-link" onClick={(e) => { e.preventDefault(); goLogin(); }}>
                تسجيل الدخول
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

UltraFastRegister.displayName = 'UltraFastRegister';

export default UltraFastRegister;
