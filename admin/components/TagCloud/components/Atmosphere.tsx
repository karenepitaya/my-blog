import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AtmosphereProps {
  tagCount: number;
  rotation: { x: number; y: number };
}

const Atmosphere: React.FC<AtmosphereProps> = ({ tagCount, rotation }) => {
  const fogOpacity = Math.max(0.3, Math.min(0.6, 1 - tagCount / 20));
  const reduceMotion = useReducedMotion();

  const stars = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  const sphereMeridians = useMemo(() => {
    return [0, 45, 90, 135].map(deg => deg);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
      
      
      {stars.map((star, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute bg-fg/70 rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={reduceMotion ? { opacity: star.opacity } : { opacity: [star.opacity, star.opacity * 0.3, star.opacity] }}
          transition={reduceMotion ? { duration: 0 } : { duration: star.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      
      <motion.div 
        className="absolute inset-0 z-0 flex items-center justify-center"
        animate={reduceMotion ? { opacity: Math.min(0.18, fogOpacity) } : { opacity: fogOpacity }}
        transition={{ duration: 2 }}
      >
        
        <motion.div 
          className="absolute w-[80vw] h-[80vw] bg-primary rounded-full blur-[110px] opacity-[0.06]"
          animate={reduceMotion ? { scale: 1, rotate: 0 } : { scale: [1, 1.08, 1], rotate: [0, 20, 0] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 26, repeat: Infinity, ease: 'linear' }}
        />
        
        <motion.div 
          className="absolute w-[70vw] h-[70vw] bg-accent rounded-full blur-[130px] opacity-[0.05]"
          animate={reduceMotion ? { scale: 1, rotate: 0, x: 0 } : { scale: [1.02, 0.98, 1.02], rotate: [0, -16, 0], x: [0, 24, 0] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <motion.div 
          className="absolute w-[50vw] h-[50vw] bg-secondary rounded-full blur-[110px] opacity-[0.05]"
          animate={reduceMotion ? { scale: 1 } : { scale: [0.96, 1, 0.96] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      
      <div 
        className="relative w-0 h-0 preserve-3d flex items-center justify-center opacity-35"
        style={{
          transform: `rotateX(${rotation.x * 15}deg) rotateY(${rotation.y * 15}deg)`
        }}
      >
        
        <div className="absolute preserve-3d motion-safe:animate-[spin_18s_linear_infinite] motion-reduce:animate-none">
            {sphereMeridians.map((deg) => (
                <div 
                    key={`inner-${deg}`}
                    className="absolute w-32 h-32 rounded-full border border-border/70"
                    style={{ transform: `rotateY(${deg}deg)` }}
                />
            ))}
            <div className="absolute w-32 h-32 rounded-full border border-border/70" style={{ transform: 'rotateX(90deg)' }} />
        </div>

        
        <div className="absolute preserve-3d motion-safe:animate-[spin_26s_linear_infinite_reverse] motion-reduce:animate-none">
            {sphereMeridians.map((deg) => (
                <div 
                    key={`outer-${deg}`}
                    className="absolute w-48 h-48 rounded-full border border-border/50 border-dashed"
                    style={{ transform: `rotateY(${deg}deg)` }}
                />
            ))}
        </div>
        
        
        <div className="absolute w-2.5 h-2.5 bg-fg/70 rounded-full" />
      </div>

    </div>
  );
};

export default Atmosphere;
