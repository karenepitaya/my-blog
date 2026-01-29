import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from '../types';
import { X, Clock, Calendar } from 'lucide-react';

interface ArticleListProps {
  tag: Tag | null;
  onClose: () => void;
  onOpenArticle?: (article: Tag['articles'][number]) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ tag, onClose, onOpenArticle }) => {
  if (!tag) return null;
  const handleOpenArticle = (article: Tag['articles'][number]) => {
    if (onOpenArticle) {
      onOpenArticle(article);
      return;
    }
    if (article.url) {
      window.open(article.url, '_blank', 'noopener');
    }
  };
  return (
    <AnimatePresence>
      <motion.div 
        className="absolute inset-0 z-[70000] flex items-center justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-transparent" onClick={onClose} />
        
        <motion.div 
          className="relative w-full max-w-md h-full bg-surface/80 backdrop-blur-sm border-l border-border shadow-xl flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface2/70">
            <div>
               <h3 className="text-muted text-xs font-mono">Articles tagged with</h3>
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                 <h2 className="text-xl font-bold">{tag.label}</h2>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-fg/5 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {tag.articles.length === 0 ? (
               <div className="text-center py-20 text-muted">
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
                  className="bg-fg/3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-fg/5 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenArticle(article)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleOpenArticle(article);
                  }}
                >
                  <h4 className="text-lg font-semibold text-fg group-hover:text-primary transition-colors mb-2">
                    {article.title}
                  </h4>
                  <p className="text-sm text-muted mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted">
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
