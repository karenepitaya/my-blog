import React from 'react';
import { motion } from 'framer-motion';
import { CloudConfig } from '../types';
import { Sliders, Plus, Zap, Search } from 'lucide-react';

interface DockProps {
  config: CloudConfig;
  setConfig: React.Dispatch<React.SetStateAction<CloudConfig>>;
  onAddTag: () => void;
  onShuffle: () => void;
  onSearch: () => void;
  canCreate?: boolean;
}

const Dock: React.FC<DockProps> = ({ config, setConfig, onAddTag, onShuffle, onSearch, canCreate = true }) => {
  return (
    <div className="absolute bottom-0 left-0 w-full flex justify-center z-[50000] pointer-events-none h-32 group">
      <div className="absolute bottom-0 w-full h-4 bg-transparent" />

      <motion.div
        initial={{ y: 100 }}
        whileHover={{ y: -10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pointer-events-auto bg-[#44475a] bg-opacity-90 backdrop-blur-xl border border-[#6272a4] rounded-2xl px-6 py-4 flex items-center gap-8 shadow-2xl mb-4"
      >
        <div className="flex flex-col gap-2 w-48">
          <div className="flex items-center gap-2 text-xs text-[#bd93f9] font-mono">
            <Sliders size={12} /> 3D PARAMS
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-8">RAD</span>
            <input
              type="range"
              min="160"
              max="800"
              value={config.radius}
              onChange={(e) => setConfig(prev => ({ ...prev, radius: Number(e.target.value) }))}
              className="w-full h-1 bg-[#6272a4] rounded-lg appearance-none cursor-pointer accent-[#bd93f9]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-8">SPD</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={config.maxSpeed}
              onChange={(e) => setConfig(prev => ({ ...prev, maxSpeed: Number(e.target.value) }))}
              className="w-full h-1 bg-[#6272a4] rounded-lg appearance-none cursor-pointer accent-[#ff79c6]"
            />
          </div>
        </div>

        <div className="w-px h-10 bg-[#6272a4] opacity-50" />

        <div className="flex items-center gap-4">
          {canCreate && (
            <button
              onClick={onAddTag}
              className="flex flex-col items-center gap-1 group/btn hover:-translate-y-1 transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-[#50fa7b] text-[#282a36] flex items-center justify-center shadow-lg hover:shadow-[#50fa7b]/50 transition-shadow">
                <Plus size={20} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-bold text-[#50fa7b]">NEW</span>
            </button>
          )}

          <button
            onClick={onSearch}
            className="flex flex-col items-center gap-1 group/btn hover:-translate-y-1 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-[#8be9fd] text-[#282a36] flex items-center justify-center shadow-lg hover:shadow-[#8be9fd]/50 transition-shadow">
              <Search size={20} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-bold text-[#8be9fd]">FIND</span>
          </button>

          <button
            onClick={onShuffle}
            className="flex flex-col items-center gap-1 group/btn hover:-translate-y-1 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ff5555] to-[#ffb86c] text-[#282a36] flex items-center justify-center shadow-lg hover:shadow-[#ff5555]/50 transition-shadow">
              <Zap size={24} strokeWidth={3} className="fill-current" />
            </div>
            <span className="text-[10px] font-bold text-[#ffb86c]">BIU~</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dock;
