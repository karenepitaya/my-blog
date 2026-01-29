import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface VisualEffectsProps {
  trigger: number;
  type: 'NONE' | 'EXPLODE' | 'IMPLODE' | 'TORNADO' | 'PULSE';
}

const VisualEffects: React.FC<VisualEffectsProps> = ({ trigger, type }) => {
  const reduceMotion = useReducedMotion();
  const [showBurst, setShowBurst] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    if (type === 'NONE' || trigger === 0) return;

    setShowBurst(true);
    setShowShockwave(true);

    const t1 = window.setTimeout(() => setShowBurst(false), 320);
    const t2 = window.setTimeout(() => setShowShockwave(false), 560);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [trigger, type, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[40000] overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {showBurst && (
          <motion.div
            initial={{ opacity: 0.7, scale: 0 }}
            animate={{ opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            className="absolute w-[100vmax] h-[100vmax] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 72%)',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShockwave && (
          <motion.div
            initial={{ width: 0, height: 0, opacity: 1, borderWidth: 18 }}
            animate={{ width: '90vw', height: '90vw', opacity: 0, borderWidth: 0 }}
            transition={{ duration: 0.56, ease: 'easeOut' }}
            className="absolute rounded-full border border-primary/25"
            style={{ borderStyle: 'solid' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualEffects;
