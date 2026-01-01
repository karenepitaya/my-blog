import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, DRACULA_PALETTE } from '../types';
import { X, Trash2, Edit2, User, Calendar, FileText, Sparkles, Check } from 'lucide-react';

interface TagDetailModalProps {
  tag: Tag | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Tag>) => void;
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

  // Reset states when tag changes
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
        className="absolute inset-0 z-[50000] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="relative w-96 rounded-xl overflow-hidden shadow-2xl border border-[#6272a4]"
          style={{ backgroundColor: '#282a36' }}
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          drag
          dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
        >
          {/* Mac-style Window Header */}
          <div className="bg-[#44475a] h-8 flex items-center px-4 gap-2 cursor-grab active:cursor-grabbing border-b border-[#6272a4]">
            <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5555] hover:bg-[#ff5555]/80 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-[#f1fa8c] hover:bg-[#f1fa8c]/80 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-[#50fa7b] hover:bg-[#50fa7b]/80 transition-colors" />
            <div className="flex-1 text-center text-xs text-[#6272a4] font-mono">TAG_INFO</div>
          </div>

          {/* Content */}
          <div className="p-6 relative">
            
            {/* Top Edit Controls */}
            <div className="flex items-center justify-between mb-6">
              {isEditing ? (
                <input 
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-[#44475a] text-white px-2 py-1 rounded outline-none border border-[#bd93f9] w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                />
              ) : (
                <h2 className="text-2xl font-bold font-mono tracking-tighter" style={{ color: tag.color }}>
                  #{tag.label}
                </h2>
              )}
              
              <div className="flex gap-2 items-center">
                {canEdit && (
                  <button onClick={handleRename} className="p-2 hover:bg-[#44475a] rounded-full transition-colors text-[#8be9fd]">
                    <Edit2 size={16} />
                  </button>
                )}
                
                {canDelete && (
                  <>
                    {isDeleteConfirming ? (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1 bg-[#ff5555] bg-opacity-10 rounded-full px-1 border border-[#ff5555]"
                      >
                        <span className="text-[10px] text-[#ff5555] font-bold px-1 select-none">SURE?</span>
                        <button 
                          onClick={() => onDelete(tag.id)} 
                          className="p-1.5 hover:bg-[#ff5555] hover:text-white rounded-full transition-colors text-[#ff5555]"
                          title="Confirm"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => setIsDeleteConfirming(false)} 
                          className="p-1.5 hover:bg-[#44475a] hover:text-white rounded-full transition-colors text-[#6272a4]"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ) : (
                      <button onClick={() => setIsDeleteConfirming(true)} className="p-2 hover:bg-[#44475a] rounded-full transition-colors text-[#ff5555]">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Color Picker */}
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

            {/* Bubble Stats (Floating Cards) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#44475a] bg-opacity-50 p-3 rounded-lg border border-[#6272a4] border-opacity-30 flex flex-col items-center justify-center gap-1 group">
                <User size={14} className="text-[#ff79c6]" />
                <span className="text-[10px] text-[#6272a4] uppercase">Creator</span>
                <span className="text-xs font-semibold">{tag.creator}</span>
              </div>

              <div 
                className="bg-[#44475a] bg-opacity-50 p-3 rounded-lg border border-[#6272a4] border-opacity-30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#44475a] transition-colors group"
                onClick={() => onOpenArticles(tag)}
              >
                <FileText size={14} className="text-[#8be9fd]" />
                <span className="text-[10px] text-[#6272a4] uppercase">Articles</span>
                <span className="text-xs font-semibold group-hover:text-[#8be9fd]">{tag.articleCount} &rarr;</span>
              </div>

              <div className="bg-[#44475a] bg-opacity-50 p-3 rounded-lg border border-[#6272a4] border-opacity-30 flex flex-col items-center justify-center gap-1">
                <Calendar size={14} className="text-[#f1fa8c]" />
                <span className="text-[10px] text-[#6272a4] uppercase">Created</span>
                <span className="text-xs font-semibold">{tag.createdAt}</span>
              </div>

              <div className="bg-[#44475a] bg-opacity-50 p-3 rounded-lg border border-[#6272a4] border-opacity-30 flex flex-col items-center justify-center gap-1">
                <Sparkles size={14} className="text-[#50fa7b]" />
                <span className="text-[10px] text-[#6272a4] uppercase">Effect</span>
                {canEdit ? (
                  <button 
                    onClick={() => onUpdate(tag.id, { effect: tag.effect === 'glow' ? 'pulse' : tag.effect === 'pulse' ? 'none' : 'glow' })}
                    className="text-xs font-semibold uppercase hover:text-[#50fa7b]"
                  >
                    {tag.effect}
                  </button>
                ) : (
                  <span className="text-xs font-semibold uppercase text-[#f8f8f2]">{tag.effect}</span>
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
