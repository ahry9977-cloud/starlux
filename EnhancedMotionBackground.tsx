import React, { useEffect, useRef, memo } from 'react';

interface EnhancedMotionBackgroundProps {
  variant?: 'particles' | 'waves' | 'aurora' | 'nebula' | 'cosmic';
  intensity?: 'subtle' | 'medium' | 'vivid';
  colorScheme?: 'purple' | 'blue' | 'cyan' | 'gold' | 'emerald';
  parallax?: boolean;
  className?: string;
}

const colorPalettes = {
  purple: {
    primary: 'rgba(139, 92, 246, 0.8)',
    secondary: 'rgba(168, 85, 247, 0.6)',
    tertiary: 'rgba(192, 132, 252, 0.4)',
    glow: 'rgba(139, 92, 246, 0.3)',
  },
  blue: {
    primary: 'rgba(59, 130, 246, 0.8)',
    secondary: 'rgba(96, 165, 250, 0.6)',
    tertiary: 'rgba(147, 197, 253, 0.4)',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  cyan: {
    primary: 'rgba(6, 182, 212, 0.8)',
    secondary: 'rgba(34, 211, 238, 0.6)',
    tertiary: 'rgba(103, 232, 249, 0.4)',
    glow: 'rgba(6, 182, 212, 0.3)',
  },
  gold: {
    primary: 'rgba(245, 158, 11, 0.8)',
    secondary: 'rgba(251, 191, 36, 0.6)',
    tertiary: 'rgba(252, 211, 77, 0.4)',
    glow: 'rgba(245, 158, 11, 0.3)',
  },
  emerald: {
    primary: 'rgba(16, 185, 129, 0.8)',
    secondary: 'rgba(52, 211, 153, 0.6)',
    tertiary: 'rgba(110, 231, 183, 0.4)',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
};

const intensitySettings = {
  subtle: { particleCount: 30, speed: 0.3, opacity: 0.4 },
  medium: { particleCount: 50, speed: 0.5, opacity: 0.6 },
  vivid: { particleCount: 80, speed: 0.8, opacity: 0.8 },
};

const EnhancedMotionBackground: React.FC<EnhancedMotionBackgroundProps> = memo(({
  variant = 'particles',
  intensity = 'medium',
  colorScheme = 'purple',
  parallax = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    layer: number;
  }>>([]);

  const colors = colorPalettes[colorScheme];
  const settings = intensitySettings[intensity];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < settings.particleCount; i++) {
        const layer = Math.floor(Math.random() * 3) + 1;
        particlesRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * settings.speed * (4 - layer) * 0.5,
          vy: (Math.random() - 0.5) * settings.speed * (4 - layer) * 0.5,
          size: (Math.random() * 4 + 2) * (4 - layer) * 0.5,
          opacity: (Math.random() * 0.5 + 0.3) * settings.opacity,
          layer,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw gradient background
      const gradient = ctx.createRadialGradient(
        window.innerWidth / 2,
        window.innerHeight / 2,
        0,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerWidth * 0.8
      );
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.98)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw glow effects
      const glowGradient = ctx.createRadialGradient(
        window.innerWidth * 0.3,
        window.innerHeight * 0.3,
        0,
        window.innerWidth * 0.3,
        window.innerHeight * 0.3,
        window.innerWidth * 0.5
      );
      glowGradient.addColorStop(0, colors.glow);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const glowGradient2 = ctx.createRadialGradient(
        window.innerWidth * 0.7,
        window.innerHeight * 0.7,
        0,
        window.innerWidth * 0.7,
        window.innerHeight * 0.7,
        window.innerWidth * 0.4
      );
      glowGradient2.addColorStop(0, colors.tertiary);
      glowGradient2.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient2;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Sort particles by layer for depth effect
      const sortedParticles = [...particlesRef.current].sort((a, b) => b.layer - a.layer);

      // Draw particles with parallax
      sortedParticles.forEach((particle) => {
        const parallaxOffset = parallax ? {
          x: (mouseRef.current.x - window.innerWidth / 2) * 0.02 * particle.layer,
          y: (mouseRef.current.y - window.innerHeight / 2) * 0.02 * particle.layer,
        } : { x: 0, y: 0 };

        const x = particle.x + parallaxOffset.x;
        const y = particle.y + parallaxOffset.y;

        // Particle glow
        const particleGradient = ctx.createRadialGradient(
          x, y, 0,
          x, y, particle.size * 3
        );
        
        const colorByLayer = particle.layer === 1 ? colors.primary :
                            particle.layer === 2 ? colors.secondary : colors.tertiary;
        
        particleGradient.addColorStop(0, colorByLayer);
        particleGradient.addColorStop(0.5, colorByLayer.replace(/[\d.]+\)$/, `${particle.opacity * 0.5})`));
        particleGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, particle.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();

        // Particle core
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = colorByLayer;
        ctx.fill();

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen
        if (particle.x < -50) particle.x = window.innerWidth + 50;
        if (particle.x > window.innerWidth + 50) particle.x = -50;
        if (particle.y < -50) particle.y = window.innerHeight + 50;
        if (particle.y > window.innerHeight + 50) particle.y = -50;
      });

      // Draw connections between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          
          if (p1.layer !== p2.layer) continue;
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.3 * settings.opacity;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = colors.secondary.replace(/[\d.]+\)$/, `${opacity})`);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(drawParticles);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resizeCanvas();
    initParticles();
    drawParticles();

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });
    
    if (parallax) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [variant, intensity, colorScheme, parallax, colors, settings]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 0,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    />
  );
});

EnhancedMotionBackground.displayName = 'EnhancedMotionBackground';

export { EnhancedMotionBackground };
export default EnhancedMotionBackground;
