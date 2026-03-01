import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== Password Validation ====================
interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
  met: boolean;
}

export const usePasswordValidation = (password: string) => {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([
    { id: 'length', label: '8 أحرف على الأقل', validator: (p) => p.length >= 8, met: false },
    { id: 'uppercase', label: 'حرف كبير واحد على الأقل', validator: (p) => /[A-Z]/.test(p), met: false },
    { id: 'lowercase', label: 'حرف صغير واحد على الأقل', validator: (p) => /[a-z]/.test(p), met: false },
    { id: 'number', label: 'رقم واحد على الأقل', validator: (p) => /[0-9]/.test(p), met: false },
    { id: 'special', label: 'رمز خاص واحد على الأقل (!@#$%)', validator: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), met: false },
  ]);

  useEffect(() => {
    setRequirements(prev => prev.map(req => ({
      ...req,
      met: req.validator(password),
    })));
  }, [password]);

  const isValid = requirements.every(req => req.met);
  const strength = requirements.filter(req => req.met).length;

  return { requirements, isValid, strength };
};

interface PasswordRequirementsProps {
  password: string;
  showAll?: boolean;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ 
  password, 
  showAll = false 
}) => {
  const { requirements } = usePasswordValidation(password);

  if (!password && !showAll) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-white/50 mb-2">متطلبات كلمة المرور:</p>
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req) => (
          <div
            key={req.id}
            className={cn(
              'flex items-center gap-2 text-xs transition-all duration-300',
              req.met ? 'text-green-400' : 'text-white/40'
            )}
          >
            {req.met ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-current" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== Email Validation ====================
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'البريد الإلكتروني مطلوب' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'البريد الإلكتروني غير صالح' };
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain) {
    // Check for typos like "gmial.com"
    const typoSuggestions: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'yaho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'hotmal.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
    };

    if (typoSuggestions[domain]) {
      return { 
        valid: false, 
        error: `هل تقصد ${email.split('@')[0]}@${typoSuggestions[domain]}؟` 
      };
    }
  }

  return { valid: true };
};

// ==================== Phone Validation ====================
export const validatePhone = (phone: string, countryCode: string = '+964'): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: false, error: 'رقم الهاتف مطلوب' };
  }

  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Iraq phone validation
  if (countryCode === '+964') {
    // Iraqi numbers: 07XX XXX XXXX (11 digits starting with 07)
    if (!/^07\d{9}$/.test(cleanPhone)) {
      return { valid: false, error: 'رقم الهاتف العراقي يجب أن يبدأ بـ 07 ويتكون من 11 رقم' };
    }
  } else {
    // Generic validation
    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return { valid: false, error: 'رقم الهاتف غير صالح' };
    }
  }

  return { valid: true };
};

// ==================== Rate Limiting ====================
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const RATE_LIMIT_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

export const useRateLimit = () => {
  const [state, setState] = useState<RateLimitState>(() => {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      return stored ? JSON.parse(stored) : { attempts: 0, lastAttempt: 0, lockedUntil: null };
    } catch {
      return { attempts: 0, lastAttempt: 0, lockedUntil: null };
    }
  });

  const isLocked = state.lockedUntil && Date.now() < state.lockedUntil;
  const remainingTime = isLocked ? Math.ceil((state.lockedUntil! - Date.now()) / 1000) : 0;
  const remainingAttempts = MAX_ATTEMPTS - state.attempts;

  const recordAttempt = useCallback((success: boolean) => {
    const now = Date.now();
    
    // Reset if outside window
    if (now - state.lastAttempt > ATTEMPT_WINDOW) {
      setState({ attempts: 0, lastAttempt: now, lockedUntil: null });
      return;
    }

    if (success) {
      // Reset on success
      const newState = { attempts: 0, lastAttempt: now, lockedUntil: null };
      setState(newState);
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
    } else {
      // Increment on failure
      const newAttempts = state.attempts + 1;
      const newState: RateLimitState = {
        attempts: newAttempts,
        lastAttempt: now,
        lockedUntil: newAttempts >= MAX_ATTEMPTS ? now + LOCK_DURATION : null,
      };
      setState(newState);
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
    }
  }, [state]);

  return { isLocked, remainingTime, remainingAttempts, recordAttempt };
};

// ==================== Security Badge ====================
interface SecurityBadgeProps {
  level: 'low' | 'medium' | 'high';
  message?: string;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ level, message }) => {
  const config = {
    low: {
      icon: AlertTriangle,
      color: 'text-red-400 bg-red-400/10 border-red-400/30',
      label: 'أمان منخفض',
    },
    medium: {
      icon: Shield,
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
      label: 'أمان متوسط',
    },
    high: {
      icon: Shield,
      color: 'text-green-400 bg-green-400/10 border-green-400/30',
      label: 'أمان عالي',
    },
  };

  const { icon: Icon, color, label } = config[level];

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm', color)}>
      <Icon className="w-4 h-4" />
      <span>{message || label}</span>
    </div>
  );
};

// ==================== Locked Account Warning ====================
interface LockedWarningProps {
  remainingTime: number;
}

export const LockedWarning: React.FC<LockedWarningProps> = ({ remainingTime }) => {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
      <Lock className="w-12 h-12 mx-auto text-red-400 mb-3" />
      <h3 className="text-lg font-semibold text-red-400 mb-2">الحساب مقفل مؤقتاً</h3>
      <p className="text-white/60 text-sm mb-3">
        تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول
      </p>
      <div className="text-2xl font-mono text-red-400">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <p className="text-white/40 text-xs mt-2">
        يرجى الانتظار قبل المحاولة مرة أخرى
      </p>
    </div>
  );
};

export default {
  usePasswordValidation,
  PasswordRequirements,
  validateEmail,
  validatePhone,
  useRateLimit,
  SecurityBadge,
  LockedWarning,
};
