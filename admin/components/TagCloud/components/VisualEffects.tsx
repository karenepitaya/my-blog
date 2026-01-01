import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DRACULA_PALETTE } from '../types';

interface VisualEffectsProps {
  trigger: number;
  type: 'NONE' | 'EXPLODE' | 'IMPLODE' | 'TORNADO' | 'PULSE';
}

interface Particle {
  id: number;
  color: string;
  size: number;
  // Physics props
  angle: number;     // Starting angle
  velocity: number;  // Speed
  offset: number;    // Radial offset
}

const VisualEffects: React.FC<VisualEffectsProps> = ({ trigger, type }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showBurst, setShowBurst] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);

  useEffect(() => {
    if (type === 'NONE' || trigger === 0) return;

    // 1. Color Burst (Instead of white flash)
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 500);

    // 2. Shockwave (Ripple)
    setShowShockwave(true);
    setTimeout(() => setShowShockwave(false), 800);

    // 3. Generate Particles
    const newParticles: Particle[] = [];
    const count = type === 'EXPLODE' ? 50 : type === 'IMPLODE' ? 50 : 60;

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        color: DRACULA_PALETTE[Math.floor(Math.random() * DRACULA_PALETTE.length)],
        size: Math.random() * 6 + 2,
        angle: Math.random() * 360,
        velocity: Math.random() * 1 + 0.5,
        offset: Math.random() * 100,
      });
    }

    setParticles(newParticles);
    
    // Cleanup
    const timer = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timer);

  }, [trigger, type]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[40000] overflow-hidden flex items-center justify-center">
      
      {/* 1. Chromatic Energy Burst (Replaces White Flash) */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            initial={{ opacity: 0.8, scale: 0 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute w-[100vmax] h-[100vmax] rounded-full"
            style={{
                background: 'radial-gradient(circle, rgba(189,147,249,0.4) 0%, rgba(40,42,54,0) 70%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* 2. Shockwave Ring */}
      <AnimatePresence>
        {showShockwave && (
          <motion.div
            initial={{ width: 0, height: 0, opacity: 1, borderWidth: 20 }}
            animate={{ width: '90vw', height: '90vw', opacity: 0, borderWidth: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute rounded-full border-[#50fa7b] border-opacity-50"
            style={{ borderStyle: 'solid' }}
          />
        )}
      </AnimatePresence>

      {/* 3. Particles */}
      <AnimatePresence>
        {particles.map((p) => {
          let initial = {}, animate = {}, transition = {};

          if (type === 'EXPLODE') {
            // Outward blast
            initial = { x: 0, y: 0, opacity: 1, scale: 0 };
            animate = { 
              x: Math.cos(p.angle * (Math.PI / 180)) * (400 + p.offset), 
              y: Math.sin(p.angle * (Math.PI / 180)) * (400 + p.offset), 
              opacity: 0, 
              scale: 0 
            };
            transition = { duration: 0.8, ease: "easeOut" };

          } else if (type === 'IMPLODE') {
            // Inward suck
            initial = { 
              x: Math.cos(p.angle * (Math.PI / 180)) * 600, 
              y: Math.sin(p.angle * (Math.PI / 180)) * 600, 
              opacity: 0, 
              scale: 2 
            };
            animate = { x: 0, y: 0, opacity: 1, scale: 0 };
            transition = { duration: 0.6, ease: "easeIn" };

          } else if (type === 'TORNADO') {
             // Spiraling upward
             // We simulate 3D spiral by using X/Y sine waves
             initial = { x: 0, y: 300, opacity: 0, scale: 0.5 };
             animate = { 
               x: [
                   Math.cos(p.angle) * 100, 
                   Math.cos(p.angle + 2) * 200, 
                   Math.cos(p.angle + 4) * 400
               ], 
               y: [300, 0, -400], 
               opacity: [0, 1, 0],
               scale: [0.5, 1, 1.5]
             };
             transition = { duration: 1.5, ease: "linear" };

          } else {
             // Pulse - Simple floating bubbles
             initial = { 
                 x: Math.cos(p.angle) * p.offset * 0.5, 
                 y: Math.sin(p.angle) * p.offset * 0.5, 
                 opacity: 0 
             };
             animate = { scale: [1, 2], opacity: [0, 0.8, 0] };
             transition = { duration: 1 };
          }

          return (
            <motion.div
              key={p.id}
              initial={initial}
              animate={animate}
              transition={transition}
              className="absolute rounded-full"
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                boxShadow: `0 0 8px ${p.color}`,
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default VisualEffects;