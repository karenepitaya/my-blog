import React, { useRef, useMemo } from 'react';
import { Tag } from '../types';
import { motion } from 'framer-motion';

interface Tag3DProps {
  tag: Tag;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  onClick: (tag: Tag) => void;
  onLongPress: (tag: Tag) => void;
}

const Tag3D: React.FC<Tag3DProps> = ({ tag, x, y, z, scale, opacity, onClick, onLongPress }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  
  const handleMouseDown = () => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress(tag);
    }, 600);
  };

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressRef.current) return;
    onClick(tag);
  };

  // Determine glow style
  const glowStyle = useMemo(() => {
    if (tag.effect === 'glow') return `0 0 15px ${tag.color}66`;
    if (tag.effect === 'pulse') return `0 0 10px ${tag.color}44`;
    return 'none';
  }, [tag.effect, tag.color]);

  return (
    <div
      className="absolute top-1/2 left-1/2 cursor-pointer select-none will-change-transform"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        zIndex: Math.floor(z * 100) + 1000, // 基础 zIndex 提升，但需低于 Modal
        opacity: Math.max(0.1, opacity),
      }}
    >
      <motion.div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, zIndex: 10000 }} // Bring to front on hover
        className={`
          flex items-center justify-center px-4 py-2 
          rounded-lg backdrop-blur-md 
          border border-opacity-30
          transition-colors duration-300
        `}
        style={{
          backgroundColor: '#282a36dd',
          borderColor: tag.color,
          boxShadow: glowStyle,
          color: tag.color,
        }}
      >
        <span className="font-mono font-bold text-sm tracking-wide">
          #{tag.label}
        </span>
        {tag.articleCount > 0 && (
          <span className="ml-2 text-[10px] bg-white bg-opacity-10 px-1.5 py-0.5 rounded-full text-white opacity-80">
            {tag.articleCount}
          </span>
        )}
      </motion.div>
    </div>
  );
};

export default Tag3D;
