import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from '../types';
import { Search, CornerDownLeft } from 'lucide-react';

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onSelectTag: (tag: Tag) => void;
}

const SearchPalette: React.FC<SearchPaletteProps> = ({ isOpen, onClose, tags, onSelectTag }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus logic
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredTags = query.trim() === '' 
    ? [] 
    : tags.filter(tag => tag.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70000] flex items-start justify-center pt-28 bg-transparent"
            onClick={onClose}
          >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="w-full max-w-lg bg-[#1b1f2a]/80 backdrop-blur-xl rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-[#24283b]/70">
              <Search className="text-[#6272a4]" size={20} />
              <input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tags..."
                className="bg-transparent border-none outline-none text-[#f8f8f2] text-lg w-full placeholder-[#6272a4]"
              />
              <div className="text-xs text-[#6272a4] border border-[#6272a4] px-2 py-0.5 rounded font-mono">ESC</div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {query === '' ? (
                <div className="p-8 text-center text-[#6272a4] text-sm italic">
                  Type to find tags...
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="p-8 text-center text-[#ff5555] text-sm">
                  No matching tags found.
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-4 pb-2 text-xs font-mono text-[#6272a4] uppercase">Matching Tags</div>
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => onSelectTag(tag)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[#44475a] transition-colors group border-l-2 border-transparent hover:border-[#bd93f9]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-[#f8f8f2] font-semibold">{tag.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <span className="text-xs text-[#6272a4]">{tag.articleCount} articles</span>
                         <CornerDownLeft size={14} className="text-[#6272a4] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-[#24283b]/70 px-4 py-2 text-[10px] text-[#6272a4] flex justify-between border-t border-white/10">
               <span>PRO TIP: Use arrow keys to navigate (coming soon)</span>
               <span>{filteredTags.length} results</span>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchPalette;
