import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Plus, Zap, Search } from 'lucide-react';
import Tag3D from './Tag3D';
import Dock from './Dock';
import TagDetailModal from './TagDetailModal';
import ArticleList from './ArticleList';
import SearchPalette from './SearchPalette';
import { Tag, CloudConfig, TagCloudProps, DRACULA_PALETTE, TagCreateInput, TagUpdateInput } from '../types';

const CONFIG_STORAGE_KEY = 'admin_tagcloud_config';

const readStoredConfig = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const next: Partial<CloudConfig> = {};
    if (typeof parsed.radius === 'number') next.radius = parsed.radius;
    if (typeof parsed.maxSpeed === 'number') next.maxSpeed = parsed.maxSpeed;
    if (typeof parsed.initSpeed === 'number') next.initSpeed = parsed.initSpeed;
    if (parsed.direction === 1 || parsed.direction === -1) next.direction = parsed.direction;
    if (typeof parsed.depthAlpha === 'boolean') next.depthAlpha = parsed.depthAlpha;
    return next;
  } catch (err) {
    console.error('Failed to read tag cloud config cache.', err);
    return {};
  }
};

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
  const [config, setConfig] = useState<CloudConfig>(() => ({
    radius: 300,
    maxSpeed: 0.5,
    initSpeed: 0.2,
    direction: 1,
    depthAlpha: true,
    ...initialConfig,
    ...readStoredConfig(),
  }));

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
  const rotationRef = useRef({ x: 0, y: 0 });
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
  const updatePositionsRef = useRef<() => void>(() => {});
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
        
        rotationRef.current = {
          x: rotationRef.current.x + activeRotation.current.x * 0.01,
          y: rotationRef.current.y + activeRotation.current.y * 0.01,
        };
      }
      updatePositionsRef.current();
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

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.error('Failed to persist tag cloud config cache.', err);
    }
  }, [config]);

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
    
    rotationRef.current = {
      x: rotationRef.current.x - deltaY * 0.005,
      y: rotationRef.current.y + deltaX * 0.005,
    };
    activeRotation.current = {
      x: clampSpeed(-deltaY * 0.5),
      y: clampSpeed(deltaX * 0.5),
    };
    updatePositionsRef.current();
    
    mouseRef.current.lastX = e.clientX;
    mouseRef.current.lastY = e.clientY;
  };

  const handlePointerUp = () => { mouseRef.current.isDown = false; };

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

    const newTag: TagCreateInput = {
      label: nextLabel,
      color: draftColor,
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

  const handleUpdateTag = async (id: string, updates: TagUpdateInput) => {
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
  const basePositions = React.useMemo(() => {
    const total = data.length;
    if (total === 0) return [];
    const thetaFactor = Math.sqrt(total * Math.PI);
    return data.map((_, index) => {
      const phi = Math.acos(-1 + (2 * index) / total);
      const theta = thetaFactor * phi;
      return {
        x: currentRadius * Math.cos(theta) * Math.sin(phi),
        y: currentRadius * Math.sin(theta) * Math.sin(phi),
        z: currentRadius * Math.cos(phi),
      };
    });
  }, [data, currentRadius]);

  const updatePositions = React.useCallback(() => {
    if (basePositions.length === 0) return;
    const { x: rotX, y: rotY } = rotationRef.current;
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const radiusDouble = currentRadius * 2;
    const depthAlpha = config.depthAlpha;

    for (let i = 0; i < basePositions.length; i += 1) {
      const node = tagRefs.current[i];
      const base = basePositions[i];
      if (!node || !base) continue;
      const y1 = base.y * cosX - base.z * sinX;
      const z1 = base.y * sinX + base.z * cosX;
      const x2 = base.x * cosY - z1 * sinY;
      const z2 = base.x * sinY + z1 * cosY;
      const scale = radiusDouble / (radiusDouble - z2);
      const opacity = depthAlpha ? (z2 + currentRadius) / radiusDouble : 1;

      node.style.transform = `translate3d(${x2}px, ${y1}px, 0) scale(${scale})`;
      node.style.zIndex = String(Math.floor(z2 * 100) + 1000);
      node.style.opacity = String(Math.max(0.1, opacity));
    }
  }, [basePositions, config.depthAlpha, currentRadius]);

  useEffect(() => {
    updatePositionsRef.current = updatePositions;
  }, [updatePositions]);

  useLayoutEffect(() => {
    updatePositions();
  }, [updatePositions]);

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
          {data.map((tag, i) => (
            <Tag3D
              key={tag.id}
              tag={tag}
              ref={(node) => { tagRefs.current[i] = node; }}
              onClick={setSelectedTag}
              onLongPress={(t) => {
                 if (navigator.vibrate) navigator.vibrate(50);
                 // Move to front logic could be handled here if needed
              }}
            />
          ))}
        </div>
      </div>

      <Dock 
        config={config} 
        setConfig={setConfig}
      />

      <div className="absolute right-6 bottom-32 z-[52000] flex flex-col gap-4 pointer-events-none">
        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex flex-col items-center gap-1 group/btn hover:-translate-y-1 transition-transform focus:outline-none focus-visible:outline-none pointer-events-auto"
          >
            <div className="w-10 h-10 rounded-full bg-success/12 text-success border border-success/20 flex items-center justify-center shadow-md transition-colors hover:bg-success/18">
              <Plus size={20} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-semibold text-success">NEW</span>
          </button>
        )}

        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-col items-center gap-1 group/btn hover:-translate-y-1 transition-transform focus:outline-none focus-visible:outline-none pointer-events-auto"
        >
          <div className="w-10 h-10 rounded-full bg-secondary/12 text-secondary border border-secondary/20 flex items-center justify-center shadow-md transition-colors hover:bg-secondary/18">
            <Search size={20} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-semibold text-secondary">FIND</span>
        </button>

        <button
          onClick={handleRefresh}
          className="flex flex-col items-center gap-1 group/btn hover:-translate-y-1 transition-transform focus:outline-none focus-visible:outline-none pointer-events-auto"
        >
          <div className="w-12 h-12 rounded-full bg-danger/12 text-danger border border-danger/20 flex items-center justify-center shadow-md transition-colors hover:bg-danger/18">
            <Zap size={24} strokeWidth={3} className="fill-current" />
          </div>
          <span className="text-[10px] font-semibold text-danger">BIU~</span>
        </button>
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            className="absolute inset-x-0 bottom-28 z-[65000] flex justify-center"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="pointer-events-auto bg-surface/95 backdrop-blur-sm border border-border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-xl">
              <div className="flex flex-col gap-1">
                <div className="text-[10px] tracking-[0.22em] text-muted font-mono">New Tag</div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: draftColor }} />
                  <input
                    autoFocus
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    placeholder="Tag name..."
                    className="bg-transparent border-none outline-none text-fg text-sm w-44 select-text placeholder:text-muted"
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
                  className="w-9 h-9 rounded-full bg-success/12 text-success border border-success/20 flex items-center justify-center shadow-md transition-colors hover:bg-success/18 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <button
                  onClick={handleCloseCreate}
                  className="w-9 h-9 rounded-full bg-surface2 text-fg border border-border flex items-center justify-center shadow-md hover:bg-fg/6 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  ? 'bg-surface/90 border-secondary/30 text-secondary'
                  : 'bg-surface/90 border-danger/30 text-danger'
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
        onOpenArticle={(article) => {
          if (article.url) window.open(article.url, '_blank', 'noopener');
        }}
      />
    </div>
  );
};

export default TagCloud;
