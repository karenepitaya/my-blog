import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, TagUpdateInput, DRACULA_PALETTE } from '../types';
import { X, Trash2, Edit2, User, Calendar, FileText, Sparkles, Check } from 'lucide-react';

interface TagDetailModalProps {
  tag: Tag | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: TagUpdateInput) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onOpenArticles: (tag: Tag) => void;
}

const TagDetailModal: React.FC<TagDetailModalProps> = ({
  tag,
  onClose,
  onDelete,
  onUpdate,
  canEdit = true,
  canDelete = true,
  onOpenArticles,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setIsDeleteConfirming(false);
    setEditLabel('');
  }, [tag]);

  if (!tag) return null;

  const handleRename = () => {
    if (isEditing && editLabel.trim()) {
      onUpdate(tag.id, { label: editLabel });
    } else {
      setEditLabel(tag.label);
    }
    setIsEditing(!isEditing);
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="absolute inset-0 z-[70000] flex items-center justify-center bg-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="relative w-96 rounded-xl overflow-hidden shadow-xl border border-border bg-surface/80 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          drag
          dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
        >
          
          <div className="bg-surface2/70 h-8 flex items-center px-4 gap-2 cursor-grab active:cursor-grabbing border-b border-border">
            <button onClick={onClose} className="w-3 h-3 rounded-full bg-danger hover:bg-danger/80 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-warning hover:bg-warning/80 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-success hover:bg-success/80 transition-colors" />
            <div className="flex-1 text-center text-xs text-muted font-mono">TAG_INFO</div>
          </div>

          
          <div className="p-6 relative">
            
            
            <div className="flex items-center justify-between mb-6">
              {isEditing ? (
                <input 
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-surface text-fg px-2 py-1 rounded outline-none border border-border w-full focus-visible:ring-2 focus-visible:ring-ring"
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                />
              ) : (
                <h2 className="text-2xl font-bold font-mono tracking-tighter" style={{ color: tag.color }}>
                  #{tag.label}
                </h2>
              )}
              
              <div className="flex gap-2 items-center">
                {canEdit && (
                  <button onClick={handleRename} className="p-2 hover:bg-fg/5 rounded-full transition-colors text-accent">
                    <Edit2 size={16} />
                  </button>
                )}
                
                {canDelete && (
                  <>
                    {isDeleteConfirming ? (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1 bg-danger/10 rounded-full px-1 border border-danger/30"
                      >
                        <span className="text-[10px] text-danger font-semibold px-1 select-none">SURE?</span>
                        <button 
                          onClick={() => onDelete(tag.id)} 
                          className="p-1.5 hover:bg-danger hover:text-fg rounded-full transition-colors text-danger"
                          title="Confirm"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => setIsDeleteConfirming(false)} 
                          className="p-1.5 hover:bg-fg/5 hover:text-fg rounded-full transition-colors text-muted"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ) : (
                      <button onClick={() => setIsDeleteConfirming(true)} className="p-2 hover:bg-fg/5 rounded-full transition-colors text-danger">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            
            {canEdit && (
              <div className="flex gap-2 mb-6">
                {DRACULA_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdate(tag.id, { color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${tag.color === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}

            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-fg/3 p-3 rounded-lg border border-border flex flex-col items-center justify-center gap-1 group">
                <User size={14} className="text-accent" />
                <span className="text-[10px] text-muted">Creator</span>
                <span className="text-xs font-semibold">{tag.creator}</span>
              </div>

              <div 
                className="bg-fg/3 p-3 rounded-lg border border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-fg/5 transition-colors group"
                onClick={() => onOpenArticles(tag)}
              >
                <FileText size={14} className="text-secondary" />
                <span className="text-[10px] text-muted">Articles</span>
                <span className="text-xs font-semibold group-hover:text-secondary">{tag.articleCount} &rarr;</span>
              </div>

              <div className="bg-fg/3 p-3 rounded-lg border border-border flex flex-col items-center justify-center gap-1">
                <Calendar size={14} className="text-warning" />
                <span className="text-[10px] text-muted">Created</span>
                <span className="text-xs font-semibold">{tag.createdAt}</span>
              </div>

              <div className="bg-fg/3 p-3 rounded-lg border border-border flex flex-col items-center justify-center gap-1">
                <Sparkles size={14} className="text-success" />
                <span className="text-[10px] text-muted">Effect</span>
                {canEdit ? (
                  <button 
                    onClick={() => onUpdate(tag.id, { effect: tag.effect === 'glow' ? 'pulse' : tag.effect === 'pulse' ? 'none' : 'glow' })}
                    className="text-xs font-semibold hover:text-success"
                  >
                    {tag.effect}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-fg">{tag.effect}</span>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TagDetailModal;
