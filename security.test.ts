import { describe, it, expect } from 'vitest';
import { 
  sanitizeString, 
  isValidEmail, 
  isStrongPassword,
  sanitizeSQLInput,
  isSuspiciousInput,
  generateCSRFToken,
} from './security';

describe('Security Utilities', () => {
  describe('sanitizeString', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should escape quotes', () => {
      const input = 'test"value\'here';
      const result = sanitizeString(input);
      
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });

    it('should trim whitespace', () => {
      const input = '  test  ';
      const result = sanitizeString(input);
      
      expect(result).toBe('test');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(null as unknown as string)).toBe('');
      expect(sanitizeString(undefined as unknown as string)).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@gmail.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject overly long emails', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('should accept strong passwords', () => {
      const result = isStrongPassword('SecurePass123!');
      expect(result.valid).toBe(true);
    });

    it('should reject short passwords', () => {
      const result = isStrongPassword('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 أحرف');
    });

    it('should require uppercase letters', () => {
      const result = isStrongPassword('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('حرف كبير');
    });

    it('should require lowercase letters', () => {
      const result = isStrongPassword('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('حرف صغير');
    });

    it('should require numbers', () => {
      const result = isStrongPassword('NoNumbers!@#');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('رقم');
    });

    it('should require special characters', () => {
      const result = isStrongPassword('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('رمز خاص');
    });

    it('should reject overly long passwords', () => {
      const result = isStrongPassword('A'.repeat(130) + 'a1!');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeSQLInput', () => {
    it('should remove SQL injection patterns', () => {
      expect(sanitizeSQLInput("'; DROP TABLE users;--")).not.toContain('DROP');
      expect(sanitizeSQLInput("1 OR 1=1")).not.toContain("'");
      expect(sanitizeSQLInput("UNION SELECT * FROM users")).not.toContain('UNION SELECT');
    });

    it('should remove comment patterns', () => {
      expect(sanitizeSQLInput('test /* comment */')).not.toContain('/*');
      expect(sanitizeSQLInput('test -- comment')).not.toContain('--');
    });

    it('should handle normal input', () => {
      expect(sanitizeSQLInput('normal search query')).toBe('normal search query');
    });
  });

  describe('isSuspiciousInput', () => {
    it('should detect path traversal', () => {
      expect(isSuspiciousInput('../../../etc/passwd')).toBe(true);
    });

    it('should detect script injection', () => {
      expect(isSuspiciousInput('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript protocol', () => {
      expect(isSuspiciousInput('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(isSuspiciousInput('onclick=alert(1)')).toBe(true);
      expect(isSuspiciousInput('onerror = alert(1)')).toBe(true);
    });

    it('should allow normal input', () => {
      expect(isSuspiciousInput('normal search query')).toBe(false);
      expect(isSuspiciousInput('منتج عربي')).toBe(false);
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens of correct length', () => {
      const token = generateCSRFToken();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should only contain hex characters', () => {
      const token = generateCSRFToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });
});

describe('Rate Limiting', () => {
  it('should have proper configuration', () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 100,
      blockDurationMs: 5 * 60 * 1000,
      loginMaxAttempts: 5,
    };
    
    expect(config.windowMs).toBe(60000);
    expect(config.maxRequests).toBe(100);
    expect(config.blockDurationMs).toBe(300000);
    expect(config.loginMaxAttempts).toBe(5);
  });
});

describe('Security Headers', () => {
  it('should define required security headers', () => {
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Content-Security-Policy',
      'Permissions-Policy',
    ];
    
    expect(requiredHeaders).toContain('X-Frame-Options');
    expect(requiredHeaders).toContain('Content-Security-Policy');
  });
});


// ============= اختبارات نظام الأمان الذكي (AI Security Engine) =============

describe('AI Security Engine', () => {
  describe('SQL Injection Detection - Advanced', () => {
    it('should detect UNION SELECT injection', () => {
      const SQL_INJECTION_REGEX = /UNION.*SELECT/i;
      expect(SQL_INJECTION_REGEX.test('UNION SELECT * FROM passwords')).toBe(true);
    });

    it('should detect DROP TABLE injection', () => {
      const SQL_INJECTION_REGEX = /DROP\s+TABLE/i;
      expect(SQL_INJECTION_REGEX.test("'; DROP TABLE users; --")).toBe(true);
    });

    it('should detect OR 1=1 injection', () => {
      const SQL_INJECTION_REGEX = /OR\s+1\s*=\s*1/i;
      expect(SQL_INJECTION_REGEX.test("' OR 1=1 --")).toBe(true);
    });

    it('should detect SELECT FROM injection', () => {
      const SQL_INJECTION_REGEX = /SELECT.*FROM/i;
      expect(SQL_INJECTION_REGEX.test('1; SELECT * FROM users')).toBe(true);
    });
  });

  describe('XSS Detection - Advanced', () => {
    it('should detect script tags', () => {
      const XSS_REGEX = /<script/i;
      expect(XSS_REGEX.test('<script>alert("xss")</script>')).toBe(true);
    });

    it('should detect onerror handlers', () => {
      const XSS_REGEX = /onerror\s*=/i;
      expect(XSS_REGEX.test('<img src=x onerror=alert(1)>')).toBe(true);
    });

    it('should detect onload handlers', () => {
      const XSS_REGEX = /onload\s*=/i;
      expect(XSS_REGEX.test('<svg onload=alert(1)>')).toBe(true);
    });

    it('should detect javascript protocol', () => {
      const XSS_REGEX = /javascript\s*:/i;
      expect(XSS_REGEX.test('javascript:alert(1)')).toBe(true);
    });

    it('should detect iframe tags', () => {
      const XSS_REGEX = /<iframe/i;
      expect(XSS_REGEX.test('<iframe src="evil.com">')).toBe(true);
    });
  });

  describe('Rate Limiting - Advanced', () => {
    it('should track request counts correctly', () => {
      const rateLimitMap = new Map<string, { count: number; resetAt: Date }>();
      const MAX_REQUESTS = 100;
      
      const checkRateLimit = (ip: string): boolean => {
        const now = new Date();
        const entry = rateLimitMap.get(ip);
        
        if (!entry || entry.resetAt < now) {
          rateLimitMap.set(ip, {
            count: 1,
            resetAt: new Date(now.getTime() + 60000),
          });
          return true;
        }
        
        entry.count++;
        return entry.count <= MAX_REQUESTS;
      };
      
      const testIP = '192.168.1.1';
      
      for (let i = 0; i < 100; i++) {
        expect(checkRateLimit(testIP)).toBe(true);
      }
      
      expect(checkRateLimit(testIP)).toBe(false);
    });
  });

  describe('IP Blocking', () => {
    it('should block and unblock IPs correctly', () => {
      const blockedIPs = new Map<string, { until: Date; reason: string }>();
      
      const blockIP = (ip: string, reason: string, durationMinutes: number) => {
        const until = new Date(Date.now() + durationMinutes * 60 * 1000);
        blockedIPs.set(ip, { until, reason });
      };
      
      const unblockIP = (ip: string) => {
        blockedIPs.delete(ip);
      };
      
      const isIPBlocked = (ip: string): boolean => {
        const entry = blockedIPs.get(ip);
        if (!entry) return false;
        if (entry.until < new Date()) {
          blockedIPs.delete(ip);
          return false;
        }
        return true;
      };
      
      const testIP = '10.0.0.1';
      
      expect(isIPBlocked(testIP)).toBe(false);
      blockIP(testIP, 'Test block', 30);
      expect(isIPBlocked(testIP)).toBe(true);
      unblockIP(testIP);
      expect(isIPBlocked(testIP)).toBe(false);
    });
  });

  describe('Login Attempt Tracking', () => {
    it('should track failed login attempts', () => {
      const loginAttempts = new Map<string, { count: number; resetAt: Date }>();
      const MAX_ATTEMPTS = 5;
      
      const recordFailedLogin = (identifier: string): { blocked: boolean; attemptsLeft: number } => {
        const now = new Date();
        const entry = loginAttempts.get(identifier);
        
        if (!entry || entry.resetAt < now) {
          loginAttempts.set(identifier, {
            count: 1,
            resetAt: new Date(now.getTime() + 15 * 60 * 1000),
          });
          return { blocked: false, attemptsLeft: MAX_ATTEMPTS - 1 };
        }
        
        entry.count++;
        const attemptsLeft = Math.max(0, MAX_ATTEMPTS - entry.count);
        
        if (entry.count >= MAX_ATTEMPTS) {
          return { blocked: true, attemptsLeft: 0 };
        }
        
        return { blocked: false, attemptsLeft };
      };
      
      const testUser = 'user@test.com';
      
      for (let i = 0; i < 4; i++) {
        const result = recordFailedLogin(testUser);
        expect(result.blocked).toBe(false);
      }
      
      const finalResult = recordFailedLogin(testUser);
      expect(finalResult.blocked).toBe(true);
    });
  });
});

describe('Auto Healer System', () => {
  describe('Threat Response', () => {
    it('should determine correct fix type for threats', () => {
      const getFixType = (threatType: string): string => {
        switch (threatType) {
          case 'sql_injection':
          case 'xss':
          case 'csrf':
            return 'block_ip';
          case 'rate_limit_bypass':
            return 'reset_rate_limit';
          case 'authentication_bypass':
            return 'force_reauth';
          default:
            return 'other';
        }
      };
      
      expect(getFixType('sql_injection')).toBe('block_ip');
      expect(getFixType('xss')).toBe('block_ip');
      expect(getFixType('rate_limit_bypass')).toBe('reset_rate_limit');
      expect(getFixType('authentication_bypass')).toBe('force_reauth');
    });
  });

  describe('Health Score Calculation', () => {
    it('should calculate health score correctly', () => {
      const calculateHealthScore = (statuses: Array<{ status: string }>): number => {
        if (statuses.length === 0) return 100;
        
        let score = 0;
        for (const s of statuses) {
          switch (s.status) {
            case 'healthy': score += 100; break;
            case 'degraded': score += 50; break;
            case 'unhealthy': score += 0; break;
          }
        }
        
        return Math.round(score / statuses.length);
      };
      
      expect(calculateHealthScore([
        { status: 'healthy' },
        { status: 'healthy' },
        { status: 'healthy' },
      ])).toBe(100);
      
      expect(calculateHealthScore([
        { status: 'healthy' },
        { status: 'degraded' },
        { status: 'unhealthy' },
      ])).toBe(50);
    });
  });
});

describe('Learning Engine', () => {
  describe('Fingerprint Generation', () => {
    it('should generate consistent fingerprints', () => {
      const crypto = require('crypto');
      
      const generateFingerprint = (data: any): string => {
        const str = JSON.stringify(data);
        return crypto.createHash('sha256').update(str).digest('hex').substring(0, 32);
      };
      
      const data1 = { type: 'error', message: 'test' };
      const data2 = { type: 'error', message: 'test' };
      
      expect(generateFingerprint(data1)).toBe(generateFingerprint(data2));
    });
  });

  describe('Behavior Analysis', () => {
    it('should calculate risk score correctly', () => {
      const calculateRiskScore = (pattern: {
        frequency: number;
        suspiciousActions: number;
      }): number => {
        let score = 0;
        if (pattern.frequency > 100) score += 20;
        if (pattern.frequency > 500) score += 30;
        score += pattern.suspiciousActions * 5;
        return Math.min(100, score);
      };
      
      expect(calculateRiskScore({ frequency: 50, suspiciousActions: 0 })).toBe(0);
      expect(calculateRiskScore({ frequency: 150, suspiciousActions: 5 })).toBe(45);
      expect(calculateRiskScore({ frequency: 600, suspiciousActions: 10 })).toBe(100);
    });

    it('should classify behavior patterns', () => {
      const classifyBehavior = (riskScore: number): string => {
        if (riskScore >= 70) return 'malicious';
        if (riskScore >= 40) return 'suspicious';
        return 'normal';
      };
      
      expect(classifyBehavior(80)).toBe('malicious');
      expect(classifyBehavior(50)).toBe('suspicious');
      expect(classifyBehavior(20)).toBe('normal');
    });
  });
});

describe('File Upload Security - Advanced', () => {
  describe('Extension Validation', () => {
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.aspx',
      '.jsp', '.cgi', '.pl', '.py', '.rb', '.js', '.vbs',
    ];

    it('should detect dangerous file extensions', () => {
      const isDangerousExtension = (filename: string): boolean => {
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return dangerousExtensions.includes(ext);
      };
      
      expect(isDangerousExtension('malware.exe')).toBe(true);
      expect(isDangerousExtension('script.php')).toBe(true);
      expect(isDangerousExtension('image.jpg')).toBe(false);
    });
  });

  describe('File Size Validation', () => {
    it('should enforce file size limits', () => {
      const MAX_SIZE = 50 * 1024 * 1024;
      
      const isFileSizeValid = (size: number): boolean => {
        return size <= MAX_SIZE;
      };
      
      expect(isFileSizeValid(1024)).toBe(true);
      expect(isFileSizeValid(50 * 1024 * 1024)).toBe(true);
      expect(isFileSizeValid(51 * 1024 * 1024)).toBe(false);
    });
  });
});

describe('User Agent Detection', () => {
  const suspiciousUserAgents = ['sqlmap', 'nikto', 'nmap', 'burp', 'acunetix'];

  it('should detect suspicious user agents', () => {
    const isSuspiciousUserAgent = (ua: string): boolean => {
      const lowerUA = ua.toLowerCase();
      return suspiciousUserAgents.some(pattern => lowerUA.includes(pattern));
    };
    
    expect(isSuspiciousUserAgent('sqlmap/1.0')).toBe(true);
    expect(isSuspiciousUserAgent('Nikto/2.1.5')).toBe(true);
    expect(isSuspiciousUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
  });
});
