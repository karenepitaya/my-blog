import React, { useState, useEffect, useRef } from 'react';
import Tag3D from './Tag3D';
import Dock from './Dock';
import TagDetailModal from './TagDetailModal';
import ArticleList from './ArticleList';
import SearchPalette from './SearchPalette';
import Atmosphere from './Atmosphere';
import VisualEffects from './VisualEffects';
import { Tag, CloudConfig, TagCloudProps, DRACULA_PALETTE } from '../types';

// 定义特效类型
type EffectType = 'NONE' | 'EXPLODE' | 'IMPLODE' | 'TORNADO' | 'PULSE';

const TagCloud: React.FC<TagCloudProps> = ({ 
  data, 
  onDataChange, 
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
  const canCreate = !!onCreate && !readOnly;
  const canEdit = !!onUpdate && !readOnly;
  const canDelete = !!onDelete && !readOnly;

  // Visual Effect State
  const [visualEffect, setVisualEffect] = useState<{ count: number, type: EffectType }>({ count: 0, type: 'NONE' });

  // 3D Physics State
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 });
  const activeRotation = useRef({ x: 0.2, y: 0.2 });
  const clampSpeed = (value: number) => Math.max(-config.maxSpeed, Math.min(config.maxSpeed, value));

  // Physics Effect Ref
  const effectRef = useRef<{
    type: EffectType;
    startTime: number;
    duration: number;
    active: boolean;
  }>({ type: 'NONE', startTime: 0, duration: 0, active: false });

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (!mouseRef.current.isDown) {
        const isTornado = effectRef.current.type === 'TORNADO' && effectRef.current.active;
        const damping = isTornado ? 0.96 : 0.98;
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

  // Dynamic Radius Calculation
  const getDynamicRadius = (baseRadius: number) => {
    if (!effectRef.current.active) return baseRadius;

    const now = Date.now();
    const elapsed = now - effectRef.current.startTime;
    const progress = Math.min(elapsed / effectRef.current.duration, 1);

    if (progress >= 1) {
      effectRef.current.active = false;
      return baseRadius;
    }

    const easeOutElastic = (x: number): number => {
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    };
    
    const easeInBack = (x: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * x * x * x - c1 * x * x;
    };

    switch (effectRef.current.type) {
      case 'EXPLODE': return baseRadius * (1 + easeOutElastic(progress) * 1.5 * (1 - progress));
      case 'IMPLODE': 
        if (progress < 0.3) return baseRadius * (1 - easeInBack(progress / 0.3) * 0.9);
        return baseRadius * (0.1 + easeOutElastic((progress - 0.3) / 0.7) * 0.9);
      case 'PULSE': return baseRadius * (1 + Math.sin(progress * Math.PI * 6) * 0.2); 
      default: return baseRadius;
    }
  };

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

  // Actions
  const handleAddTag = async () => {
    if (!canCreate || !onCreate) return;
    const newTag: Tag = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Tag',
      color: DRACULA_PALETTE[Math.floor(Math.random() * DRACULA_PALETTE.length)],
      creator: 'Admin',
      createdAt: new Date().toLocaleDateString(),
      articleCount: 0,
      articles: [],
      effect: 'none'
    };
    try {
      const created = await onCreate(newTag);
      setSelectedTag(created ?? newTag);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShuffle = () => {
    setRotation({ x: 0, y: 0 });
    const resetSpeed = clampSpeed(config.initSpeed);
    activeRotation.current = { x: resetSpeed, y: resetSpeed };

    // 1. Shuffle Data
    if (onDataChange) {
      const shuffled = [...data];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      onDataChange(shuffled);
    }

    // 2. Trigger Effects
    const effects: EffectType[] = ['EXPLODE', 'IMPLODE', 'TORNADO', 'PULSE'];
    const selectedEffect = effects[Math.floor(Math.random() * effects.length)];
    
    effectRef.current = {
      type: selectedEffect,
      startTime: Date.now(),
      duration: selectedEffect === 'TORNADO' ? 2000 : 1000, 
      active: true
    };
    setVisualEffect(prev => ({ count: prev.count + 1, type: selectedEffect }));

    if (selectedEffect === 'TORNADO') activeRotation.current = { x: 0, y: 3.5 }; 
    else activeRotation.current = { x: Math.random(), y: Math.random() };

    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  };

  const handleDeleteTag = async (id: string) => {
    if (!canDelete || !onDelete) return;
    try {
      await onDelete(id);
      setSelectedTag(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTag = async (id: string, updates: Partial<Tag>) => {
    if (!canEdit || !onUpdate) return;
    try {
      const updated = await onUpdate(id, updates);
      if (updated && selectedTag && selectedTag.id === id) {
        setSelectedTag(updated);
        return;
      }
      if (selectedTag && selectedTag.id === id) {
        setSelectedTag({ ...selectedTag, ...updates });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentRadius = getDynamicRadius(config.radius);

  return (
    <div className="w-full h-full bg-[#282a36] relative overflow-hidden select-none">
      <Atmosphere tagCount={data.length} rotation={rotation} />
      <VisualEffects trigger={visualEffect.count} type={visualEffect.type} />

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
        onAddTag={handleAddTag} 
        onShuffle={handleShuffle}
        onSearch={() => setIsSearchOpen(true)}
        canCreate={canCreate}
      />

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
