import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from '../types';
import { X, Clock, Calendar } from 'lucide-react';

interface ArticleListProps {
  tag: Tag | null;
  onClose: () => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ tag, onClose }) => {
  if (!tag) return null;
  return (
    <AnimatePresence>
      <motion.div 
        className="absolute inset-0 z-[70000] flex items-center justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-[#0f111a]/35 backdrop-blur-xl" onClick={onClose} />
        
        <motion.div 
          className="relative w-full max-w-md h-full bg-[#1b1f2a]/80 backdrop-blur-xl border-l border-white/10 shadow-[0_12px_50px_rgba(0,0,0,0.45)] flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Header */}
          <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#2a2f3f]/70">
            <div>
               <h3 className="text-[#6272a4] text-xs uppercase font-mono">Articles tagged with</h3>
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                 <h2 className="text-xl font-bold">{tag.label}</h2>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#2f3447] rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {tag.articles.length === 0 ? (
               <div className="text-center py-20 text-[#6272a4]">
                 <p className="text-2xl mb-4">No articles</p>
                 <p>No articles linked to this tag yet.</p>
               </div>
            ) : (
              tag.articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#303445] bg-opacity-50 p-4 rounded-xl border border-[#6272a4] border-opacity-30 hover:border-[#bd93f9] hover:bg-[#303445] transition-all cursor-pointer group"
                >
                  <h4 className="text-lg font-semibold text-[#f8f8f2] group-hover:text-[#bd93f9] transition-colors mb-2">
                    {article.title}
                  </h4>
                  <p className="text-sm text-[#bfbfbf] mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-[#6272a4]">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{article.readTime} min read</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{article.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArticleList;
