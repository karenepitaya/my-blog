import React from 'react';
import { motion } from 'framer-motion';
import { CloudConfig } from '../types';
import { Sliders } from 'lucide-react';

interface DockProps {
  config: CloudConfig;
  setConfig: React.Dispatch<React.SetStateAction<CloudConfig>>;
}

const Dock: React.FC<DockProps> = ({ config, setConfig }) => {
  return (
    <div className="absolute bottom-0 left-0 w-full flex justify-center z-[50000] pointer-events-none h-32 group">
      <div className="absolute bottom-0 w-full h-4 bg-transparent" />

      <motion.div
        initial={{ y: 0 }}
        whileHover={{ y: -10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pointer-events-auto bg-surface2/80 backdrop-blur-sm border border-border rounded-2xl px-6 py-4 flex items-center shadow-xl mb-4"
      >
        <div className="flex flex-col gap-2 w-48">
          <div className="flex items-center gap-2 text-xs text-primary font-mono">
            <Sliders size={12} /> 3D PARAMS
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted w-8">RAD</span>
            <input
              type="range"
              min="160"
              max="800"
              value={config.radius}
              onChange={(e) => setConfig(prev => ({ ...prev, radius: Number(e.target.value) }))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted w-8">SPD</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={config.maxSpeed}
              onChange={(e) => setConfig(prev => ({ ...prev, maxSpeed: Number(e.target.value) }))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dock;
