import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface AtmosphereProps {
  tagCount: number;
  rotation: { x: number; y: number };
}

const Atmosphere: React.FC<AtmosphereProps> = ({ tagCount, rotation }) => {
  // 迷雾浓度
  const fogOpacity = Math.max(0.3, Math.min(0.6, 1 - tagCount / 20));

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
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [star.opacity, star.opacity * 0.3, star.opacity] }}
          transition={{ duration: star.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* 2. Flowing Nebula (Liquid Neon) - 优化：极慢速流动，去除快速呼吸 */}
      <motion.div 
        className="absolute inset-0 z-0 flex items-center justify-center"
        animate={{ opacity: fogOpacity }}
        transition={{ duration: 2 }}
      >
        {/* 紫色流体 */}
        <motion.div 
          className="absolute w-[80vw] h-[80vw] bg-[#bd93f9] rounded-full blur-[100px] opacity-10 mix-blend-screen"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        {/* 粉色流体 - 逆向 */}
        <motion.div 
          className="absolute w-[70vw] h-[70vw] bg-[#ff79c6] rounded-full blur-[120px] opacity-10 mix-blend-screen"
          animate={{ 
            scale: [1.1, 0.9, 1.1],
            rotate: [0, -60, 0],
            x: [0, 50, 0], 
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* 青色流体 - 中心 */}
        <motion.div 
          className="absolute w-[50vw] h-[50vw] bg-[#8be9fd] rounded-full blur-[100px] opacity-10 mix-blend-screen"
          animate={{ 
            scale: [0.8, 1, 0.8],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* 3. True 3D Wireframe Core (The Anchor) */}
      <div 
        className="relative w-0 h-0 preserve-3d flex items-center justify-center opacity-40"
        style={{
          transform: `rotateX(${rotation.x * 15}deg) rotateY(${rotation.y * 15}deg)`
        }}
      >
        {/* Inner Core Sphere (Cyan) */}
        <div className="absolute preserve-3d animate-[spin_10s_linear_infinite]">
            {sphereMeridians.map((deg) => (
                <div 
                    key={`inner-${deg}`}
                    className="absolute w-32 h-32 rounded-full border border-[#8be9fd] border-opacity-40"
                    style={{ transform: `rotateY(${deg}deg)` }}
                />
            ))}
            <div className="absolute w-32 h-32 rounded-full border border-[#8be9fd] border-opacity-40" style={{ transform: 'rotateX(90deg)' }} />
        </div>

        {/* Outer Shell Sphere (Purple) - Larger and Reverse Spin */}
        <div className="absolute preserve-3d animate-[spin_15s_linear_infinite_reverse]">
            {sphereMeridians.map((deg) => (
                <div 
                    key={`outer-${deg}`}
                    className="absolute w-48 h-48 rounded-full border border-[#bd93f9] border-opacity-20 border-dashed"
                    style={{ transform: `rotateY(${deg}deg)` }}
                />
            ))}
        </div>
        
        {/* Glowing Center Point */}
        <div className="absolute w-4 h-4 bg-white rounded-full blur-md shadow-[0_0_20px_white]" />
      </div>

    </div>
  );
};

export default Atmosphere;
