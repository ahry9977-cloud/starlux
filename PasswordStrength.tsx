import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  showLabel?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ 
  password, 
  showLabel = true 
}) => {
  const strength = useMemo(() => {
    let score = 0;
    
    if (!password) return { score: 0, label: '', color: '' };
    
    // Length checks
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character type checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    // Bonus for mixed characters
    if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      score++;
    }

    if (score <= 2) return { score: 1, label: 'ضعيفة', color: 'weak' };
    if (score <= 4) return { score: 2, label: 'متوسطة', color: 'medium' };
    if (score <= 5) return { score: 3, label: 'جيدة', color: 'strong' };
    return { score: 4, label: 'قوية جداً', color: 'strong' };
  }, [password]);

  const colors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const glowColors = {
    weak: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    medium: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
    strong: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
  };

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="password-strength flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'strength-bar h-1 flex-1 rounded-full transition-all duration-300',
              level <= strength.score
                ? cn(colors[strength.color as keyof typeof colors], glowColors[strength.color as keyof typeof glowColors], 'active')
                : 'bg-white/10'
            )}
            style={{
              animation: level <= strength.score ? `strengthPulse 0.5s ease ${level * 0.1}s` : 'none',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <p className={cn(
          'text-xs mt-1 transition-all duration-300',
          strength.color === 'weak' && 'text-red-400',
          strength.color === 'medium' && 'text-yellow-400',
          strength.color === 'strong' && 'text-green-400',
        )}>
          قوة كلمة المرور: {strength.label}
        </p>
      )}
    </div>
  );
};

export default PasswordStrength;
