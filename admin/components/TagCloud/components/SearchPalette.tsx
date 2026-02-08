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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

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
            className="w-full max-w-lg bg-surface/80 backdrop-blur-sm rounded-xl shadow-xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-surface2/70">
              <Search className="text-muted" size={20} />
              <input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tags..."
                className="bg-transparent border-none outline-none text-fg text-lg w-full placeholder:text-muted"
              />
              <div className="text-xs text-muted border border-border px-2 py-0.5 rounded font-mono">ESC</div>
            </div>

            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {query === '' ? (
                <div className="p-8 text-center text-muted text-sm italic">
                  Type to find tags...
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="p-8 text-center text-danger text-sm">
                  No matching tags found.
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-4 pb-2 text-xs font-mono text-muted">Matching Tags</div>
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => onSelectTag(tag)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-fg/5 transition-colors group border-l-2 border-transparent hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-fg font-semibold">{tag.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <span className="text-xs text-muted">{tag.articleCount} articles</span>
                         <CornerDownLeft size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            
            <div className="bg-surface2/70 px-4 py-2 text-[10px] text-muted flex justify-between border-t border-border">
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
