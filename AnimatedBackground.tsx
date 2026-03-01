/**
 * STAR LUX - Professional Animated Backgrounds
 * GPU Accelerated - High Performance - Zero Impact on Load Time
 */

import React, { memo, useEffect, useRef, useState } from 'react';

// ============================================
// TYPES
// ============================================
type BackgroundVariant = 
  | 'particles'      // Floating particles
  | 'gradient'       // Animated gradient
  | 'mesh'           // Mesh gradient
  | 'waves'          // Wave animation
  | 'aurora'         // Aurora borealis effect
  | 'stars'          // Starfield
  | 'geometric'      // Geometric shapes
  | 'grid'           // Animated grid
  | 'nebula'         // Space nebula
  | 'cyber';         // Cyberpunk grid

interface AnimatedBackgroundProps {
  variant?: BackgroundVariant;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'blue' | 'purple' | 'cyan' | 'green' | 'gold';
  className?: string;
}

// ============================================
// COLOR PALETTES
// ============================================
const colorPalettes = {
  blue: {
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    accent: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  purple: {
    primary: '#A855F7',
    secondary: '#7C3AED',
    accent: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.3)',
  },
  cyan: {
    primary: '#06B6D4',
    secondary: '#0891B2',
    accent: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.3)',
  },
  green: {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  gold: {
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#FBBF24',
    glow: 'rgba(245, 158, 11, 0.3)',
  },
};

// ============================================
// PARTICLES BACKGROUND
// ============================================
const ParticlesBackground = memo(({ color, intensity }: { color: string; intensity: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.purple;
    const particleCount = intensity === 'high' ? 80 : intensity === 'medium' ? 50 : 30;
    const hexOpacity = (opacity: number) => Math.floor(opacity * 255).toString(16).padStart(2, '0');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${palette.primary}${Math.floor(p.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${palette.primary}${Math.floor((1 - dist / 150) * 50).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ transform: 'translateZ(0)' }}
    />
  );
});

ParticlesBackground.displayName = 'ParticlesBackground';

// ============================================
// GRADIENT BACKGROUND
// ============================================
const GradientBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.purple;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, ${palette.glow} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, ${palette.secondary}20 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${palette.accent}10 0%, transparent 70%)
          `,
          animation: 'gradient-shift 15s ease infinite',
        }}
      />
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }
      `}</style>
    </div>
  );
});

GradientBackground.displayName = 'GradientBackground';

// ============================================
// AURORA BACKGROUND
// ============================================
const AuroraBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.purple;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="aurora-container">
        <div className="aurora aurora-1" style={{ background: `linear-gradient(180deg, ${palette.primary}40, transparent)` }} />
        <div className="aurora aurora-2" style={{ background: `linear-gradient(180deg, ${palette.secondary}30, transparent)` }} />
        <div className="aurora aurora-3" style={{ background: `linear-gradient(180deg, ${palette.accent}20, transparent)` }} />
      </div>
      <style>{`
        .aurora-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          filter: blur(60px);
        }
        .aurora {
          position: absolute;
          width: 200%;
          height: 200%;
          border-radius: 50%;
          transform: translateZ(0);
        }
        .aurora-1 {
          top: -50%;
          left: -50%;
          animation: aurora-move-1 20s ease-in-out infinite;
        }
        .aurora-2 {
          top: -30%;
          right: -50%;
          animation: aurora-move-2 25s ease-in-out infinite;
        }
        .aurora-3 {
          bottom: -50%;
          left: -30%;
          animation: aurora-move-3 30s ease-in-out infinite;
        }
        @keyframes aurora-move-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(10%, 10%) rotate(180deg); }
        }
        @keyframes aurora-move-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-10%, 5%) rotate(-180deg); }
        }
        @keyframes aurora-move-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(5%, -10%) rotate(180deg); }
        }
      `}</style>
    </div>
  );
});

AuroraBackground.displayName = 'AuroraBackground';

// ============================================
// STARS BACKGROUND
// ============================================
const StarsBackground = memo(({ intensity }: { intensity: string }) => {
  const starCount = intensity === 'high' ? 200 : intensity === 'medium' ? 100 : 50;
  const [stars] = useState(() =>
    Array.from({ length: starCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            transform: 'translateZ(0)',
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
});

StarsBackground.displayName = 'StarsBackground';

// ============================================
// CYBER GRID BACKGROUND
// ============================================
const CyberGridBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.cyan;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${palette.primary}10 1px, transparent 1px),
            linear-gradient(90deg, ${palette.primary}10 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center top',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: `linear-gradient(to top, ${palette.glow}, transparent)`,
        }}
      />
      <style>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
      `}</style>
    </div>
  );
});

CyberGridBackground.displayName = 'CyberGridBackground';

// ============================================
// WAVES BACKGROUND
// ============================================
const WavesBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.blue;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute bottom-0 w-full"
        style={{ height: '60%', transform: 'translateZ(0)' }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={`${palette.primary}15`}
          d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{ animation: 'wave1 10s ease-in-out infinite' }}
        />
        <path
          fill={`${palette.secondary}10`}
          d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,218.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{ animation: 'wave2 12s ease-in-out infinite' }}
        />
        <path
          fill={`${palette.accent}08`}
          d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{ animation: 'wave3 15s ease-in-out infinite' }}
        />
      </svg>
      <style>{`
        @keyframes wave1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-2%); }
        }
        @keyframes wave2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2%); }
        }
        @keyframes wave3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-1%); }
        }
      `}</style>
    </div>
  );
});

WavesBackground.displayName = 'WavesBackground';

// ============================================
// GEOMETRIC BACKGROUND
// ============================================
const GeometricBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.purple;
  const [shapes] = useState(() =>
    Array.from({ length: 15 }, () => ({
      type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 100 + 50,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 10,
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {shapes.map((shape, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            border: `1px solid ${palette.primary}20`,
            borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'square' ? '10%' : '0',
            clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
            animation: `float-rotate ${shape.duration}s ease-in-out ${shape.delay}s infinite`,
            transform: `rotate(${shape.rotation}deg) translateZ(0)`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-rotate {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
});

GeometricBackground.displayName = 'GeometricBackground';

// ============================================
// MESH GRADIENT BACKGROUND
// ============================================
const MeshBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.purple;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(at 40% 20%, ${palette.primary}30 0px, transparent 50%),
            radial-gradient(at 80% 0%, ${palette.secondary}20 0px, transparent 50%),
            radial-gradient(at 0% 50%, ${palette.accent}25 0px, transparent 50%),
            radial-gradient(at 80% 50%, ${palette.primary}15 0px, transparent 50%),
            radial-gradient(at 0% 100%, ${palette.secondary}20 0px, transparent 50%),
            radial-gradient(at 80% 100%, ${palette.accent}15 0px, transparent 50%)
          `,
          animation: 'mesh-move 30s ease infinite',
          transform: 'translateZ(0)',
        }}
      />
      <style>{`
        @keyframes mesh-move {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(30deg); }
        }
      `}</style>
    </div>
  );
});

MeshBackground.displayName = 'MeshBackground';

// ============================================
// NEBULA BACKGROUND
// ============================================
const NebulaBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.purple;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="nebula-layer nebula-1" style={{ background: `radial-gradient(ellipse at center, ${palette.primary}20, transparent 70%)` }} />
      <div className="nebula-layer nebula-2" style={{ background: `radial-gradient(ellipse at center, ${palette.secondary}15, transparent 60%)` }} />
      <div className="nebula-layer nebula-3" style={{ background: `radial-gradient(ellipse at center, ${palette.accent}10, transparent 50%)` }} />
      <style>{`
        .nebula-layer {
          position: absolute;
          inset: -50%;
          width: 200%;
          height: 200%;
          filter: blur(80px);
          transform: translateZ(0);
        }
        .nebula-1 {
          animation: nebula-drift-1 40s ease-in-out infinite;
        }
        .nebula-2 {
          animation: nebula-drift-2 50s ease-in-out infinite;
        }
        .nebula-3 {
          animation: nebula-drift-3 60s ease-in-out infinite;
        }
        @keyframes nebula-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10%, 5%) scale(1.1); }
        }
        @keyframes nebula-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, 10%) scale(1.05); }
        }
        @keyframes nebula-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, -5%) scale(1.15); }
        }
      `}</style>
    </div>
  );
});

NebulaBackground.displayName = 'NebulaBackground';

// ============================================
// GRID BACKGROUND
// ============================================
const GridBackground = memo(({ color }: { color: string }) => {
  const palette = colorPalettes[color as keyof typeof colorPalettes] || colorPalettes.cyan;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${palette.primary}08 1px, transparent 1px),
            linear-gradient(90deg, ${palette.primary}08 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${palette.primary}15 2px, transparent 2px),
            linear-gradient(90deg, ${palette.primary}15 2px, transparent 2px)
          `,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
});

GridBackground.displayName = 'GridBackground';

// ============================================
// MAIN COMPONENT
// ============================================
export const AnimatedBackground = memo(({
  variant = 'particles',
  intensity = 'medium',
  color = 'purple',
  className = '',
}: AnimatedBackgroundProps) => {
  const renderBackground = () => {
    switch (variant) {
      case 'particles':
        return <ParticlesBackground color={color} intensity={intensity} />;
      case 'gradient':
        return <GradientBackground color={color} />;
      case 'aurora':
        return <AuroraBackground color={color} />;
      case 'stars':
        return <StarsBackground intensity={intensity} />;
      case 'cyber':
        return <CyberGridBackground color={color} />;
      case 'waves':
        return <WavesBackground color={color} />;
      case 'geometric':
        return <GeometricBackground color={color} />;
      case 'mesh':
        return <MeshBackground color={color} />;
      case 'nebula':
        return <NebulaBackground color={color} />;
      case 'grid':
        return <GridBackground color={color} />;
      default:
        return <ParticlesBackground color={color} intensity={intensity} />;
    }
  };

  return (
    <div
      className={`fixed inset-0 -z-10 overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2a 50%, #0a0a1a 100%)',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {renderBackground()}
    </div>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;
