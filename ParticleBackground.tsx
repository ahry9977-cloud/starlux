import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  colors?: string[];
  maxDistance?: number;
  speed?: number;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 80,
  colors = ['#4B00FF', '#FF00FF', '#00ffff'],
  maxDistance = 150,
  speed = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create particle
    const createParticle = (width: number, height: number): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.3,
    });

    // Initialize particles
    const initParticles = (width: number, height: number) => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(createParticle(width, height));
      }
    };

    // Draw particle
    const drawParticle = (particle: Particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha;
      ctx.fill();
      
      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = particle.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    // Draw connections
    const drawConnections = (particles: Particle[]) => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(75, 0, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    // Update particle
    const updateParticle = (particle: Particle, width: number, height: number) => {
      // Mouse interaction
      const dx = mouseRef.current.x - particle.x;
      const dy = mouseRef.current.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100 && distance > 0) {
        const force = (100 - distance) / 100;
        particle.vx -= (dx / distance) * force * 0.02;
        particle.vy -= (dy / distance) * force * 0.02;
      }

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Boundary check
      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      // Keep in bounds
      particle.x = Math.max(0, Math.min(width, particle.x));
      particle.y = Math.max(0, Math.min(height, particle.y));

      // Damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Random movement
      particle.vx += (Math.random() - 0.5) * 0.01;
      particle.vy += (Math.random() - 0.5) * 0.01;
    };

    // Animation loop
    const animate = () => {
      const { width, height } = canvas;

      // Clear canvas
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Draw connections
      drawConnections(particlesRef.current);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        updateParticle(particle, width, height);
        drawParticle(particle);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // Initialize
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, colors, maxDistance, speed]);

  return (
    <div className="particle-container">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <div className="grid-bg" />
      <div className="scan-lines" />
    </div>
  );
};

export default ParticleBackground;
