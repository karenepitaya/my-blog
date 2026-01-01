import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Tag3D from './Tag3D';
import Dock from './Dock';
import TagDetailModal from './TagDetailModal';
import ArticleList from './ArticleList';
import SearchPalette from './SearchPalette';
import { Tag, CloudConfig, TagCloudProps, DRACULA_PALETTE } from '../types';

const TagCloud: React.FC<TagCloudProps> = ({ 
  data, 
  onRefresh,
  onCreate, 
  onUpdate, 
  onDelete,
  onNavigateToArticles,
  initialConfig,
  readOnly
}) => {
  // Config State
  const [config, setConfig] = useState<CloudConfig>({
    radius: 300,
    maxSpeed: 0.5,
    initSpeed: 0.2,
    direction: 1,
    depthAlpha: true,
    ...initialConfig
  });

  // UI State
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [viewingArticlesFor, setViewingArticlesFor] = useState<Tag | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftColor, setDraftColor] = useState(DRACULA_PALETTE[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<{ id: number; message: string; tone: 'error' | 'info' } | null>(null);
  const canCreate = !!onCreate && !readOnly;
  const canEdit = !!onUpdate && !readOnly;
  const canDelete = !!onDelete && !readOnly;

  // 3D Physics State
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 });
  const activeRotation = useRef({ x: 0.2, y: 0.2 });
  const clampSpeed = (value: number) => Math.max(-config.maxSpeed, Math.min(config.maxSpeed, value));

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (!mouseRef.current.isDown) {
        const damping = 0.98;
        const baseSpeed = config.initSpeed * 0.5;

        activeRotation.current.x = clampSpeed(activeRotation.current.x * damping + baseSpeed * (1 - damping));
        activeRotation.current.y = clampSpeed(activeRotation.current.y * damping + baseSpeed * (1 - damping));
        
        setRotation(prev => ({
          x: prev.x + activeRotation.current.x * 0.01,
          y: prev.y + activeRotation.current.y * 0.01,
        }));
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [config.initSpeed, config.maxSpeed]);

  useEffect(() => {
    if (!selectedTag) return;
    const next = data.find(tag => tag.id === selectedTag.id);
    if (next && next !== selectedTag) setSelectedTag(next);
  }, [data, selectedTag?.id]);

  useEffect(() => {
    if (!viewingArticlesFor) return;
    const next = data.find(tag => tag.id === viewingArticlesFor.id);
    if (next && next !== viewingArticlesFor) setViewingArticlesFor(next);
  }, [data, viewingArticlesFor?.id]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice?.id]);

  // Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    mouseRef.current.isDown = true;
    mouseRef.current.lastX = e.clientX;
    mouseRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!mouseRef.current.isDown) return;
    const deltaX = e.clientX - mouseRef.current.lastX;
    const deltaY = e.clientY - mouseRef.current.lastY;
    
    setRotation(prev => ({ x: prev.x - deltaY * 0.005, y: prev.y + deltaX * 0.005 }));
    activeRotation.current = {
      x: clampSpeed(-deltaY * 0.5),
      y: clampSpeed(deltaX * 0.5),
    };
    
    mouseRef.current.lastX = e.clientX;
    mouseRef.current.lastY = e.clientY;
  };

  const handlePointerUp = () => { mouseRef.current.isDown = false; };

  // Tag Positioning
  const computeTagPosition = (index: number, total: number, radius: number, rotX: number, rotY: number) => {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    const y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
    const z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
    const x2 = x * Math.cos(rotY) - z1 * Math.sin(rotY);
    const z2 = x * Math.sin(rotY) + z1 * Math.cos(rotY);

    const scale = (2 * radius) / (2 * radius - z2);
    const opacity = config.depthAlpha ? (z2 + radius) / (2 * radius) : 1;

    return { x: x2, y: y1, z: z2, scale, opacity };
  };

  const showNotice = (message: string, tone: 'error' | 'info' = 'error') => {
    setNotice({ id: Date.now(), message, tone });
  };

  const pickRandomColor = () => DRACULA_PALETTE[Math.floor(Math.random() * DRACULA_PALETTE.length)];

  // Actions
  const handleOpenCreate = () => {
    if (!canCreate) return;
    setDraftLabel('');
    setDraftColor(pickRandomColor());
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setIsCreating(false);
  };

  const handleSubmitCreate = async () => {
    if (!canCreate || !onCreate) return;
    const nextLabel = draftLabel.trim();
    if (!nextLabel) {
      showNotice('Tag name cannot be empty.');
      return;
    }

    const newTag: Tag = {
      id: Math.random().toString(36).substr(2, 9),
      label: nextLabel,
      color: draftColor,
      creator: 'Admin',
      createdAt: new Date().toLocaleDateString(),
      articleCount: 0,
      articles: [],
      effect: 'none',
    };
    setIsCreating(true);
    try {
      const created = await onCreate(newTag);
      if (created) {
        setSelectedTag(created);
        setIsCreateOpen(false);
        setDraftLabel('');
        return;
      }
      showNotice('Tag creation failed.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tag creation failed.';
      showNotice(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    try {
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!canDelete || !onDelete) return;
    try {
      await onDelete(id);
      setSelectedTag(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag.';
      showNotice(message);
    }
  };

  const handleUpdateTag = async (id: string, updates: Partial<Tag>) => {
    if (!canEdit || !onUpdate) return;
    try {
      const updated = await onUpdate(id, updates);
      if (!updated) return;
      if (updated && selectedTag && selectedTag.id === id) {
        setSelectedTag(updated);
        return;
      }
      if (selectedTag && selectedTag.id === id) {
        setSelectedTag({ ...selectedTag, ...updates });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tag.';
      showNotice(message);
    }
  };

  const currentRadius = config.radius;

  return (
    <div className="w-full h-full relative select-none">
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-move active:cursor-grabbing z-10 relative"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ perspective: '1000px' }}
      >
        <div className="relative w-0 h-0 preserve-3d">
          {data.map((tag, i) => {
            const { x, y, z, scale, opacity } = computeTagPosition(i, data.length, currentRadius, rotation.x, rotation.y);
            return (
              <Tag3D
                key={tag.id}
                tag={tag}
                x={x} y={y} z={z} scale={scale} opacity={opacity}
                onClick={setSelectedTag}
                onLongPress={(t) => {
                   if (navigator.vibrate) navigator.vibrate(50);
                   // Move to front logic could be handled here if needed
                }}
              />
            );
          })}
        </div>
      </div>

      <Dock 
        config={config} 
        setConfig={setConfig} 
        onAddTag={handleOpenCreate} 
        onRefresh={handleRefresh}
        onSearch={() => setIsSearchOpen(true)}
        canCreate={canCreate}
      />

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            className="absolute inset-x-0 bottom-28 z-[65000] flex justify-center"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="pointer-events-auto bg-[#1b1f2a]/95 backdrop-blur-xl border border-[#6272a4]/60 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-[0_16px_50px_rgba(0,0,0,0.45)]">
              <div className="flex flex-col gap-1">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#6272a4] font-mono">New Tag</div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: draftColor }} />
                  <input
                    autoFocus
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    placeholder="Tag name..."
                    className="bg-transparent border-none outline-none text-[#f8f8f2] text-sm w-44 select-text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitCreate();
                      if (e.key === 'Escape') handleCloseCreate();
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmitCreate}
                  disabled={isCreating}
                  className="w-9 h-9 rounded-full bg-[#50fa7b] text-[#282a36] flex items-center justify-center shadow-lg hover:shadow-[#50fa7b]/50 transition-shadow disabled:opacity-60 focus:outline-none focus-visible:outline-none"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <button
                  onClick={handleCloseCreate}
                  className="w-9 h-9 rounded-full bg-[#44475a] text-[#f8f8f2] flex items-center justify-center shadow-lg hover:bg-[#52566a] transition-colors focus:outline-none focus-visible:outline-none"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            className="absolute inset-x-0 bottom-8 z-[65010] flex justify-center"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div
              className={`pointer-events-auto px-4 py-2 rounded-full border text-xs font-mono tracking-wide shadow-[0_12px_40px_rgba(0,0,0,0.35)] ${
                notice.tone === 'info'
                  ? 'bg-[#1b1f2a]/90 border-[#8be9fd]/40 text-[#8be9fd]'
                  : 'bg-[#2a1f23]/90 border-[#ff5555]/50 text-[#ffb4a9]'
              }`}
            >
              {notice.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchPalette 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tags={data}
        onSelectTag={(tag) => {
            setIsSearchOpen(false);
            setSelectedTag(tag);
        }}
      />

      <TagDetailModal 
        tag={selectedTag}
        onClose={() => setSelectedTag(null)}
        onDelete={handleDeleteTag}
        onUpdate={handleUpdateTag}
        canEdit={canEdit}
        canDelete={canDelete}
        onOpenArticles={(tag) => {
            if (onNavigateToArticles) onNavigateToArticles(tag);
            else setViewingArticlesFor(tag);
        }}
      />

      <ArticleList 
        tag={viewingArticlesFor}
        onClose={() => setViewingArticlesFor(null)}
      />
    </div>
  );
};

export default TagCloud;
