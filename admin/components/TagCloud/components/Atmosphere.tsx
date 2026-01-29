import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AtmosphereProps {
  tagCount: number;
  rotation: { x: number; y: number };
}

const Atmosphere: React.FC<AtmosphereProps> = ({ tagCount, rotation }) => {
  // 迷雾浓度
  const fogOpacity = Math.max(0.3, Math.min(0.6, 1 - tagCount / 20));
  const reduceMotion = useReducedMotion();

  // 生成静态星空
  const stars = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  // 生成构建 3D 球体的经纬线
  const sphereMeridians = useMemo(() => {
    return [0, 45, 90, 135].map(deg => deg);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
      
      {/* 1. Starfield Background */}
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

      {/* 2. Flowing Nebula (Liquid Neon) - 优化：极慢速流动，去除快速呼吸 */}
      <motion.div 
        className="absolute inset-0 z-0 flex items-center justify-center"
        animate={reduceMotion ? { opacity: Math.min(0.18, fogOpacity) } : { opacity: fogOpacity }}
        transition={{ duration: 2 }}
      >
        {/* 紫色流体 */}
        <motion.div 
          className="absolute w-[80vw] h-[80vw] bg-primary rounded-full blur-[110px] opacity-[0.06]"
          animate={reduceMotion ? { scale: 1, rotate: 0 } : { scale: [1, 1.08, 1], rotate: [0, 20, 0] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 26, repeat: Infinity, ease: 'linear' }}
        />
        {/* 粉色流体 - 逆向 */}
        <motion.div 
          className="absolute w-[70vw] h-[70vw] bg-accent rounded-full blur-[130px] opacity-[0.05]"
          animate={reduceMotion ? { scale: 1, rotate: 0, x: 0 } : { scale: [1.02, 0.98, 1.02], rotate: [0, -16, 0], x: [0, 24, 0] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* 青色流体 - 中心 */}
        <motion.div 
          className="absolute w-[50vw] h-[50vw] bg-secondary rounded-full blur-[110px] opacity-[0.05]"
          animate={reduceMotion ? { scale: 1 } : { scale: [0.96, 1, 0.96] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* 3. True 3D Wireframe Core (The Anchor) */}
      <div 
        className="relative w-0 h-0 preserve-3d flex items-center justify-center opacity-35"
        style={{
          transform: `rotateX(${rotation.x * 15}deg) rotateY(${rotation.y * 15}deg)`
        }}
      >
        {/* Inner Core Sphere (Cyan) */}
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

        {/* Outer Shell Sphere (Purple) - Larger and Reverse Spin */}
        <div className="absolute preserve-3d motion-safe:animate-[spin_26s_linear_infinite_reverse] motion-reduce:animate-none">
            {sphereMeridians.map((deg) => (
                <div 
                    key={`outer-${deg}`}
                    className="absolute w-48 h-48 rounded-full border border-border/50 border-dashed"
                    style={{ transform: `rotateY(${deg}deg)` }}
                />
            ))}
        </div>
        
        {/* Glowing Center Point */}
        <div className="absolute w-2.5 h-2.5 bg-fg/70 rounded-full" />
      </div>

    </div>
  );
};

export default Atmosphere;
