import React, { useEffect, useRef } from 'react';

interface MarketPulseBackgroundProps {
  pulseTrigger: number;
  isSyncing?: boolean;
  marketTrend?: 'bullish' | 'bearish' | 'neutral';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  pulseEnergy: number;
  targetX?: number;
  targetY?: number;
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  speed: number;
}

export const MarketPulseBackground: React.FC<MarketPulseBackgroundProps> = ({
  pulseTrigger,
  isSyncing = false,
  marketTrend = 'bullish',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const wavesRef = useRef<PulseWave[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Color pallete based on market sentiment
  const themeColors = {
    bullish: {
      primary: '78, 222, 163', // #4edea3 emerald
      secondary: '76, 215, 246', // #4cd7f6 cyan
      accent: '0, 165, 114',
    },
    bearish: {
      primary: '255, 84, 73', // #ff5449 red
      secondary: '255, 180, 171',
      accent: '186, 26, 26',
    },
    neutral: {
      primary: '76, 215, 246',
      secondary: '208, 188, 255', // purple
      accent: '6, 182, 212',
    },
  }[marketTrend];

  // Initialize and resize canvas with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dimensionsRef.current = { width, height };

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Initialize particles if count is insufficient
      const targetCount = Math.max(30, Math.min(65, Math.floor((width * height) / 14000)));
      if (particlesRef.current.length === 0 || Math.abs(particlesRef.current.length - targetCount) > 15) {
        const particles: Particle[] = [];
        for (let i = 0; i < targetCount; i++) {
          const isCyan = Math.random() > 0.45;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 2 + 1,
            baseAlpha: Math.random() * 0.28 + 0.12,
            alpha: Math.random() * 0.28 + 0.12,
            color: isCyan ? themeColors.secondary : themeColors.primary,
            pulseEnergy: 0,
          });
        }
        particlesRef.current = particles;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);
    updateSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [themeColors]);

  // Trigger pulse wave animation when pulseTrigger updates
  useEffect(() => {
    if (pulseTrigger === 0) return;

    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return;

    // Center of pulse originates near the top consolidated balance card
    const originX = width / 2;
    const originY = Math.min(140, height * 0.18);
    const maxDistance = Math.hypot(width, height);

    // Create 2 expanding concentric shockwaves
    wavesRef.current.push({
      x: originX,
      y: originY,
      radius: 5,
      maxRadius: maxDistance * 0.9,
      alpha: 0.65,
      color: themeColors.primary,
      speed: 4.8,
    });

    setTimeout(() => {
      wavesRef.current.push({
        x: originX,
        y: originY,
        radius: 5,
        maxRadius: maxDistance * 0.8,
        alpha: 0.45,
        color: themeColors.secondary,
        speed: 3.6,
      });
    }, 120);

    // Excite nearby particles with radial surge
    particlesRef.current.forEach((p) => {
      const dx = p.x - originX;
      const dy = p.y - originY;
      const dist = Math.hypot(dx, dy) || 1;
      const normalX = dx / dist;
      const normalY = dy / dist;

      p.pulseEnergy = 1.0;
      // Gentle outward impulse
      p.vx += normalX * 0.9;
      p.vy += normalY * 0.9;
    });
  }, [pulseTrigger, themeColors]);

  // Main animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.max(0, Math.min((now - lastTime) / 1000, 0.1));
      lastTime = now;

      const { width, height } = dimensionsRef.current;
      if (width === 0 || height === 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw and update expanding pulse shockwave rings
      for (let i = wavesRef.current.length - 1; i >= 0; i--) {
        const wave = wavesRef.current[i];
        wave.radius += wave.speed * (dt * 60);
        const progress = wave.radius / wave.maxRadius;
        wave.alpha = Math.max(0, (1 - progress) * 0.55);

        if (wave.alpha > 0.01 && progress < 1) {
          // Outer glow ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, Math.max(0, wave.radius), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${wave.color}, ${wave.alpha})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = `rgba(${wave.color}, 0.8)`;
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Subtle secondary soft ring
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, Math.max(0, wave.radius - 8), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${wave.color}, ${wave.alpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        } else {
          wavesRef.current.splice(i, 1);
        }
      }

      const particles = particlesRef.current;

      // 2. Draw subtle mesh lines between close particles
      const connectionDist = Math.min(width * 0.28, 90);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.12 *
              (1 + (particles[i].pulseEnergy + particles[j].pulseEnergy) * 1.5);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${themeColors.secondary}, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Dampen velocity back to gentle drift
        p.vx *= 0.98;
        p.vy *= 0.98;
        if (Math.abs(p.vx) < 0.2) p.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(p.vy) < 0.2) p.vy += (Math.random() - 0.5) * 0.05;

        // Position update
        p.x += p.vx * (dt * 60);
        p.y += p.vy * (dt * 60);

        // Boundary wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Decay pulse energy smoothly
        if (p.pulseEnergy > 0) {
          p.pulseEnergy = Math.max(0, p.pulseEnergy - dt * 1.2);
        }

        // Shimmer during sync
        const syncBoost = isSyncing ? Math.sin(now * 0.008 + i) * 0.25 + 0.25 : 0;
        const currentAlpha = Math.min(1, p.baseAlpha + p.pulseEnergy * 0.6 + syncBoost);
        const currentRadius = p.radius + p.pulseEnergy * 2.0;

        // Draw particle glow aura if excited by pulse
        if (p.pulseEnergy > 0.2 || isSyncing) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${currentAlpha * 0.25})`;
          ctx.fill();
        }

        // Main particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${currentAlpha})`;
        ctx.shadowColor = `rgba(${p.color}, ${currentAlpha})`;
        ctx.shadowBlur = p.pulseEnergy > 0.1 ? 8 : 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [themeColors, isSyncing]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
