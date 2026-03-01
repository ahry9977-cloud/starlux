import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==================== Password Validation Tests ====================
describe('Password Validation', () => {
  const validatePassword = (password: string) => {
    const requirements = [
      { id: 'length', validator: (p: string) => p.length >= 8 },
      { id: 'uppercase', validator: (p: string) => /[A-Z]/.test(p) },
      { id: 'lowercase', validator: (p: string) => /[a-z]/.test(p) },
      { id: 'number', validator: (p: string) => /[0-9]/.test(p) },
      { id: 'special', validator: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];
    
    const results = requirements.map(req => ({
      id: req.id,
      met: req.validator(password),
    }));
    
    return {
      requirements: results,
      isValid: results.every(r => r.met),
      strength: results.filter(r => r.met).length,
    };
  };

  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.strength).toBe(0);
  });

  it('should reject short password', () => {
    const result = validatePassword('Abc1!');
    expect(result.requirements.find(r => r.id === 'length')?.met).toBe(false);
    expect(result.isValid).toBe(false);
  });

  it('should require uppercase letter', () => {
    const result = validatePassword('abcdefgh1!');
    expect(result.requirements.find(r => r.id === 'uppercase')?.met).toBe(false);
  });

  it('should require lowercase letter', () => {
    const result = validatePassword('ABCDEFGH1!');
    expect(result.requirements.find(r => r.id === 'lowercase')?.met).toBe(false);
  });

  it('should require number', () => {
    const result = validatePassword('Abcdefgh!');
    expect(result.requirements.find(r => r.id === 'number')?.met).toBe(false);
  });

  it('should require special character', () => {
    const result = validatePassword('Abcdefgh1');
    expect(result.requirements.find(r => r.id === 'special')?.met).toBe(false);
  });

  it('should accept valid strong password', () => {
    const result = validatePassword('Abcdefgh1!');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe(5);
  });

  it('should calculate strength correctly', () => {
    expect(validatePassword('abc').strength).toBe(1); // only lowercase
    expect(validatePassword('abcdefgh').strength).toBe(2); // length + lowercase
    expect(validatePassword('Abcdefgh').strength).toBe(3); // + uppercase
    expect(validatePassword('Abcdefgh1').strength).toBe(4); // + number
    expect(validatePassword('Abcdefgh1!').strength).toBe(5); // + special
  });
});

// ==================== Email Validation Tests ====================
describe('Email Validation', () => {
  const validateEmail = (email: string) => {
    if (!email) {
      return { valid: false, error: 'البريد الإلكتروني مطلوب' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'البريد الإلكتروني غير صالح' };
    }

    const typoSuggestions: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gamil.com': 'gmail.com',
    };

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && typoSuggestions[domain]) {
      return { 
        valid: false, 
        error: `هل تقصد ${email.split('@')[0]}@${typoSuggestions[domain]}؟` 
      };
    }

    return { valid: true };
  };

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('البريد الإلكتروني مطلوب');
  });

  it('should reject invalid email format', () => {
    expect(validateEmail('notanemail').valid).toBe(false);
    expect(validateEmail('missing@domain').valid).toBe(false);
    expect(validateEmail('@nodomain.com').valid).toBe(false);
    expect(validateEmail('spaces in@email.com').valid).toBe(false);
  });

  it('should accept valid email', () => {
    expect(validateEmail('test@example.com').valid).toBe(true);
    expect(validateEmail('user.name@domain.co.uk').valid).toBe(true);
    expect(validateEmail('user+tag@gmail.com').valid).toBe(true);
  });

  it('should suggest correction for common typos', () => {
    const result = validateEmail('user@gmial.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('gmail.com');
  });
});

// ==================== Phone Validation Tests ====================
describe('Phone Validation', () => {
  const validatePhone = (phone: string, countryCode: string = '+964') => {
    if (!phone) {
      return { valid: false, error: 'رقم الهاتف مطلوب' };
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    if (countryCode === '+964') {
      if (!/^07\d{9}$/.test(cleanPhone)) {
        return { valid: false, error: 'رقم الهاتف العراقي يجب أن يبدأ بـ 07 ويتكون من 11 رقم' };
      }
    } else {
      if (!/^\d{10,15}$/.test(cleanPhone)) {
        return { valid: false, error: 'رقم الهاتف غير صالح' };
      }
    }

    return { valid: true };
  };

  it('should reject empty phone', () => {
    const result = validatePhone('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('رقم الهاتف مطلوب');
  });

  it('should validate Iraqi phone numbers', () => {
    expect(validatePhone('07701234567', '+964').valid).toBe(true);
    expect(validatePhone('07801234567', '+964').valid).toBe(true);
    expect(validatePhone('07501234567', '+964').valid).toBe(true);
  });

  it('should reject invalid Iraqi phone numbers', () => {
    expect(validatePhone('0770123456', '+964').valid).toBe(false); // too short
    expect(validatePhone('077012345678', '+964').valid).toBe(false); // too long
    expect(validatePhone('08701234567', '+964').valid).toBe(false); // wrong prefix
  });

  it('should handle phone with formatting', () => {
    expect(validatePhone('0770-123-4567', '+964').valid).toBe(true);
    expect(validatePhone('0770 123 4567', '+964').valid).toBe(true);
    expect(validatePhone('(0770) 123-4567', '+964').valid).toBe(true);
  });

  it('should validate generic phone numbers', () => {
    expect(validatePhone('1234567890', '+1').valid).toBe(true);
    expect(validatePhone('123456789012345', '+1').valid).toBe(true);
    expect(validatePhone('123456789', '+1').valid).toBe(false); // too short
  });
});

// ==================== Error Parser Tests ====================
describe('Auth Error Parser', () => {
  const parseAuthError = (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return { type: 'network', autoRetry: true };
    }
    if (lowerMessage.includes('timeout')) {
      return { type: 'timeout', autoRetry: true };
    }
    if (lowerMessage.includes('invalid') && lowerMessage.includes('password')) {
      return { type: 'invalid_credentials' };
    }
    if (lowerMessage.includes('locked')) {
      return { type: 'account_locked', retryAfter: 900 };
    }
    if (lowerMessage.includes('email') && lowerMessage.includes('exist')) {
      return { type: 'email_exists' };
    }
    if (lowerMessage.includes('otp') && lowerMessage.includes('expired')) {
      return { type: 'otp_expired' };
    }
    if (lowerMessage.includes('rate')) {
      return { type: 'rate_limited', retryAfter: 60 };
    }
    if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
      return { type: 'server_error', autoRetry: true };
    }
    return { type: 'unknown' };
  };

  it('should parse network errors', () => {
    expect(parseAuthError('Network error').type).toBe('network');
    expect(parseAuthError('Failed to fetch').type).toBe('network');
    expect(parseAuthError('Network error').autoRetry).toBe(true);
  });

  it('should parse timeout errors', () => {
    expect(parseAuthError('Request timeout').type).toBe('timeout');
    expect(parseAuthError('Connection timeout').autoRetry).toBe(true);
  });

  it('should parse invalid credentials', () => {
    expect(parseAuthError('Invalid password').type).toBe('invalid_credentials');
    expect(parseAuthError('Invalid email or password').type).toBe('invalid_credentials');
  });

  it('should parse account locked', () => {
    const result = parseAuthError('Account locked');
    expect(result.type).toBe('account_locked');
    expect(result.retryAfter).toBe(900);
  });

  it('should parse email exists', () => {
    expect(parseAuthError('Email already exists').type).toBe('email_exists');
  });

  it('should parse OTP expired', () => {
    expect(parseAuthError('OTP has expired').type).toBe('otp_expired');
  });

  it('should parse rate limiting', () => {
    const result = parseAuthError('Rate limit exceeded');
    expect(result.type).toBe('rate_limited');
    expect(result.retryAfter).toBe(60);
  });

  it('should parse server errors', () => {
    expect(parseAuthError('Internal server error').type).toBe('server_error');
    expect(parseAuthError('500 error').type).toBe('server_error');
    expect(parseAuthError('Server error').autoRetry).toBe(true);
  });

  it('should handle unknown errors', () => {
    expect(parseAuthError('Something went wrong').type).toBe('unknown');
    expect(parseAuthError(new Error('Random error')).type).toBe('unknown');
  });
});

// ==================== Rate Limiting Tests ====================
describe('Rate Limiting', () => {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 15 * 60 * 1000;
  const ATTEMPT_WINDOW = 5 * 60 * 1000;

  interface RateLimitState {
    attempts: number;
    lastAttempt: number;
    lockedUntil: number | null;
  }

  const createRateLimiter = () => {
    let state: RateLimitState = { attempts: 0, lastAttempt: 0, lockedUntil: null };

    return {
      getState: () => state,
      isLocked: () => state.lockedUntil !== null && Date.now() < state.lockedUntil,
      recordAttempt: (success: boolean) => {
        const now = Date.now();
        
        if (now - state.lastAttempt > ATTEMPT_WINDOW) {
          state = { attempts: 0, lastAttempt: now, lockedUntil: null };
        }

        if (success) {
          state = { attempts: 0, lastAttempt: now, lockedUntil: null };
        } else {
          const newAttempts = state.attempts + 1;
          state = {
            attempts: newAttempts,
            lastAttempt: now,
            lockedUntil: newAttempts >= MAX_ATTEMPTS ? now + LOCK_DURATION : null,
          };
        }
      },
      reset: () => {
        state = { attempts: 0, lastAttempt: 0, lockedUntil: null };
      },
    };
  };

  it('should start with no attempts', () => {
    const limiter = createRateLimiter();
    expect(limiter.getState().attempts).toBe(0);
    expect(limiter.isLocked()).toBe(false);
  });

  it('should increment attempts on failure', () => {
    const limiter = createRateLimiter();
    limiter.recordAttempt(false);
    expect(limiter.getState().attempts).toBe(1);
    limiter.recordAttempt(false);
    expect(limiter.getState().attempts).toBe(2);
  });

  it('should reset on success', () => {
    const limiter = createRateLimiter();
    limiter.recordAttempt(false);
    limiter.recordAttempt(false);
    limiter.recordAttempt(true);
    expect(limiter.getState().attempts).toBe(0);
  });

  it('should lock after max attempts', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      limiter.recordAttempt(false);
    }
    expect(limiter.isLocked()).toBe(true);
    expect(limiter.getState().lockedUntil).not.toBeNull();
  });

  it('should not lock before max attempts', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      limiter.recordAttempt(false);
    }
    expect(limiter.isLocked()).toBe(false);
  });
});

// ==================== Password Strength Calculation Tests ====================
describe('Password Strength Calculation', () => {
  const calculateStrength = (password: string) => {
    let score = 0;
    
    if (!password) return { score: 0, label: '', color: '' };
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      score++;
    }

    if (score <= 2) return { score: 1, label: 'ضعيفة', color: 'weak' };
    if (score <= 4) return { score: 2, label: 'متوسطة', color: 'medium' };
    if (score <= 5) return { score: 3, label: 'جيدة', color: 'strong' };
    return { score: 4, label: 'قوية جداً', color: 'strong' };
  };

  it('should return empty for no password', () => {
    const result = calculateStrength('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('');
  });

  it('should rate weak passwords', () => {
    expect(calculateStrength('abc').color).toBe('weak');
    expect(calculateStrength('123').color).toBe('weak');
    expect(calculateStrength('abcd').color).toBe('weak');
  });

  it('should rate medium passwords', () => {
    // abcdefghij = length(8+) + length(12-) + lowercase = 2 points = weak
    // Abcdefghij = length(8+) + lowercase + uppercase = 3 points = medium  
    expect(calculateStrength('Abcdefghij').color).toBe('medium');
    expect(calculateStrength('abcdefgh1').color).toBe('medium'); // length + lowercase + number = 3
  });

  it('should rate strong passwords', () => {
    expect(calculateStrength('Abcdefgh1').color).toBe('strong');
    expect(calculateStrength('Abcdefgh1!').color).toBe('strong');
  });

  it('should give bonus for length', () => {
    const short = calculateStrength('Abc1!aaa');
    const long = calculateStrength('Abc1!aaaaaaa');
    expect(long.score).toBeGreaterThanOrEqual(short.score);
  });
});

// ==================== OTP Input Validation Tests ====================
describe('OTP Input Validation', () => {
  const validateOTP = (otp: string[]) => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      return { valid: false, error: 'الرجاء إدخال رمز التحقق كاملاً' };
    }
    
    if (!/^\d{6}$/.test(otpString)) {
      return { valid: false, error: 'رمز التحقق يجب أن يحتوي على أرقام فقط' };
    }
    
    return { valid: true };
  };

  it('should reject incomplete OTP', () => {
    expect(validateOTP(['1', '2', '3', '', '', '']).valid).toBe(false);
    expect(validateOTP(['1', '2', '3', '4', '5', '']).valid).toBe(false);
  });

  it('should accept complete OTP', () => {
    expect(validateOTP(['1', '2', '3', '4', '5', '6']).valid).toBe(true);
    expect(validateOTP(['0', '0', '0', '0', '0', '0']).valid).toBe(true);
  });

  it('should reject non-numeric OTP', () => {
    expect(validateOTP(['a', 'b', 'c', 'd', 'e', 'f']).valid).toBe(false);
    expect(validateOTP(['1', '2', '3', '4', '5', 'a']).valid).toBe(false);
  });
});

// ==================== Form State Management Tests ====================
describe('Form State Management', () => {
  interface FormState {
    email: string;
    password: string;
    confirmPassword: string;
    errors: Record<string, string>;
  }

  const validateForm = (state: FormState) => {
    const errors: Record<string, string> = {};

    if (!state.email) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
      errors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!state.password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (state.password.length < 8) {
      errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (state.confirmPassword !== state.password) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  it('should validate empty form', () => {
    const result = validateForm({
      email: '',
      password: '',
      confirmPassword: '',
      errors: {},
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });

  it('should validate password mismatch', () => {
    const result = validateForm({
      email: 'test@example.com',
      password: 'Password1!',
      confirmPassword: 'DifferentPassword1!',
      errors: {},
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.confirmPassword).toBe('كلمات المرور غير متطابقة');
  });

  it('should accept valid form', () => {
    const result = validateForm({
      email: 'test@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      errors: {},
    });
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });
});
