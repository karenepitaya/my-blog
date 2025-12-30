import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Article, Tag, User, UserRole } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface TagCloudProps {
  articles: Article[];
  users: User[];
  user: User;
  onLoadTags: (options?: { page?: number; pageSize?: number }) => Promise<Tag[]>;
  onCreateTag: (input: { name: string }) => Promise<Tag | null>;
  onDeleteTag: (id: string) => Promise<void>;
  onLoadDetail: (id: string) => Promise<Tag | null>;
}

const TAG_PAGE_SIZE = 200;

type TagItem = {
  id: string;
  label: string;
  meta?: string;
  colorClass: string;
  kind?: 'tag' | 'info' | 'action';
  tag?: Tag;
  interactive?: boolean;
};

type PhysicsNode = {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
};

const COLOR_PALETTE = [
  'border-[#bd93f9]/40 text-[#bd93f9] bg-[#bd93f9]/10',
  'border-[#8be9fd]/40 text-[#8be9fd] bg-[#8be9fd]/10',
  'border-[#50fa7b]/40 text-[#50fa7b] bg-[#50fa7b]/10',
  'border-[#ffb86c]/40 text-[#ffb86c] bg-[#ffb86c]/10',
  'border-[#ff79c6]/40 text-[#ff79c6] bg-[#ff79c6]/10',
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getColorClass = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % COLOR_PALETTE.length;
  }
  return COLOR_PALETTE[hash];
};

const estimateRadius = (label: string, meta: string | undefined, size: number) => {
  const weight = label.length + (meta ? meta.length * 0.35 : 0);
  const base = Math.max(22, size * 0.8);
  return base + weight * 3;
};

const TagPhysicsCanvas: React.FC<{
  items: TagItem[];
  size: number;
  gravity: number;
  drift: number;
  refreshKey: number;
  active: boolean;
  onItemClick?: (item: TagItem) => void;
  className?: string;
}> = ({ items, size, gravity, drift, refreshKey, active, onItemClick, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<string, PhysicsNode>>(new Map());
  const elementRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const boundsRef = useRef({ width: 0, height: 0 });
  const animationRef = useRef<number | null>(null);
  const dragRef = useRef({
    activeId: null as string | null,
    pointerId: -1,
    isDragging: false,
    didDrag: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    timer: null as number | null,
  });

  const setElementRef = (id: string) => (el: HTMLButtonElement | null) => {
    if (el) {
      elementRefs.current.set(id, el);
    } else {
      elementRefs.current.delete(id);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateBounds = () => {
      const rect = el.getBoundingClientRect();
      boundsRef.current = { width: rect.width, height: rect.height };
    };

    updateBounds();

    const observer = new ResizeObserver(() => updateBounds());
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = boundsRef.current;
    const w = width || 640;
    const h = height || 380;
    const nextNodes = new Map<string, PhysicsNode>();

    items.forEach(item => {
      const radius = estimateRadius(item.label, item.meta, size);
      const x = radius + Math.random() * Math.max(1, w - radius * 2);
      const y = radius + Math.random() * Math.max(1, h - radius * 2);
      nextNodes.set(item.id, {
        id: item.id,
        x,
        y,
        z: (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        radius,
      });
    });

    nodesRef.current = nextNodes;
  }, [items, size, refreshKey]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      const { width, height } = boundsRef.current;
      items.forEach(item => {
        const node = nodesRef.current.get(item.id);
        const el = elementRefs.current.get(item.id);
        if (!node || !el) return;

        const rect = el.getBoundingClientRect();
        const radius = Math.max(rect.width, rect.height) * 0.5 + 6;
        node.radius = radius;
        if (width > 0) node.x = clamp(node.x, radius, width - radius);
        if (height > 0) node.y = clamp(node.y, radius, height - radius);
      });
    });

    return () => cancelAnimationFrame(handle);
  }, [items, size, refreshKey]);

  useEffect(() => {
    if (!active) return;

    let lastTime = performance.now();

    const tick = (time: number) => {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      const t = delta / 16.67;
      const { width, height } = boundsRef.current;

      if (width && height) {
        const nodes = Array.from(nodesRef.current.values());
        const drag = dragRef.current;

        nodes.forEach(node => {
          if (drag.isDragging && drag.activeId === node.id) return;

          node.vy += gravity * t;
          node.vx *= drift;
          node.vy *= drift;
          node.x += node.vx * t;
          node.y += node.vy * t;

          if (node.x - node.radius < 0) {
            node.x = node.radius;
            node.vx = Math.abs(node.vx) * 0.7;
          }
          if (node.x + node.radius > width) {
            node.x = width - node.radius;
            node.vx = -Math.abs(node.vx) * 0.7;
          }
          if (node.y - node.radius < 0) {
            node.y = node.radius;
            node.vy = Math.abs(node.vy) * 0.7;
          }
          if (node.y + node.radius > height) {
            node.y = height - node.radius;
            node.vy = -Math.abs(node.vy) * 0.7;
          }
        });

        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
            const a = nodes[i];
            const b = nodes[j];
            if (drag.isDragging && (drag.activeId === a.id || drag.activeId === b.id)) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 1;
            const minDist = a.radius + b.radius;
            if (dist < minDist) {
              const overlap = (minDist - dist) * 0.5;
              const nx = dx / dist;
              const ny = dy / dist;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
              const impulse = 0.4;
              a.vx -= nx * overlap * impulse;
              a.vy -= ny * overlap * impulse;
              b.vx += nx * overlap * impulse;
              b.vy += ny * overlap * impulse;
            }
          }
        }

        nodesRef.current.forEach(node => {
          const el = elementRefs.current.get(node.id);
          if (!el) return;
          const x = node.x - node.radius;
          const y = node.y - node.radius;
          const tiltX = clamp(node.vy * 1.4, -12, 12);
          const tiltY = clamp(node.vx * 1.4, -12, 12);
          el.style.transform = `translate3d(${x}px, ${y}px, ${node.z}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          el.style.zIndex = String(Math.round(1000 + node.z));
        });
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [active, gravity, drift, items.length]);

  const handlePointerDown = (item: TagItem) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!active) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const drag = dragRef.current;

    drag.activeId = item.id;
    drag.pointerId = event.pointerId;
    drag.isDragging = false;
    drag.didDrag = false;
    drag.lastX = x;
    drag.lastY = y;
    drag.lastTime = performance.now();

    if (drag.timer) window.clearTimeout(drag.timer);
    drag.timer = window.setTimeout(() => {
      drag.isDragging = true;
      drag.didDrag = true;
    }, 140);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (item: TagItem) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!active) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const drag = dragRef.current;

    if (drag.activeId !== item.id) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();
    const dx = x - drag.lastX;
    const dy = y - drag.lastY;
    const distance = Math.hypot(dx, dy);

    if (!drag.isDragging && distance > 6) {
      drag.isDragging = true;
      drag.didDrag = true;
      if (drag.timer) {
        window.clearTimeout(drag.timer);
        drag.timer = null;
      }
    }

    if (!drag.isDragging) {
      drag.lastX = x;
      drag.lastY = y;
      drag.lastTime = now;
      return;
    }

    const node = nodesRef.current.get(item.id);
    if (!node) return;

    node.x = x;
    node.y = y;
    const dt = Math.max(1, now - drag.lastTime);
    node.vx = (dx / dt) * 16;
    node.vy = (dy / dt) * 16;

    drag.lastX = x;
    drag.lastY = y;
    drag.lastTime = now;
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.timer) {
      window.clearTimeout(drag.timer);
      drag.timer = null;
    }
    if (drag.pointerId !== -1 && event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    }
    drag.activeId = null;
    drag.pointerId = -1;
    drag.isDragging = false;
  };

  const handlePointerUp = (item: TagItem) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!active) return;
    if (dragRef.current.activeId !== item.id) return;
    finishDrag(event);
  };

  const handlePointerCancel = (item: TagItem) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!active) return;
    if (dragRef.current.activeId !== item.id) return;
    finishDrag(event);
  };

  const handleClick = (item: TagItem) => () => {
    if (!onItemClick || item.interactive === false) return;
    const drag = dragRef.current;
    if (drag.didDrag) {
      drag.didDrag = false;
      return;
    }
    onItemClick(item);
  };

  const fontSize = Math.max(12, size);
  const metaSize = Math.max(10, size * 0.7);
  const padY = Math.max(6, size * 0.32);
  const padX = Math.max(14, size * 0.7);
  const pointerClass = active ? 'pointer-events-auto' : 'pointer-events-none';

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden [perspective:900px] [transform-style:preserve-3d] ${pointerClass} ${className ?? ''}`}
    >
      {items.map(item => {
        const kindClass =
          item.kind === 'info'
            ? 'font-mono tracking-wide normal-case text-[#f8f8f2]/80'
            : 'font-black uppercase tracking-widest';

        return (
          <button
            key={item.id}
            type="button"
            ref={setElementRef(item.id)}
            onPointerDown={handlePointerDown(item)}
            onPointerMove={handlePointerMove(item)}
            onPointerUp={handlePointerUp(item)}
            onPointerCancel={handlePointerCancel(item)}
            onClick={handleClick(item)}
            className={`absolute flex items-center gap-2 rounded-full border shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur-[1px] transition-transform ${kindClass} ${item.colorClass} ${item.interactive === false ? 'cursor-default' : 'cursor-pointer hover:brightness-110'}`}
            style={{ fontSize, padding: `${padY}px ${padX}px` }}
          >
            <span className="whitespace-nowrap">{item.label}</span>
            {item.meta && (
              <span className="text-[#f8f8f2]/70" style={{ fontSize: metaSize }}>
                {item.meta}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const TagCloud: React.FC<TagCloudProps> = ({
  articles,
  users,
  user,
  onLoadTags,
  onCreateTag,
  onDeleteTag,
  onLoadDetail,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloudSeed, setCloudSeed] = useState(0);
  const [detailSeed, setDetailSeed] = useState(0);
  const [tagSize, setTagSize] = useState(18);
  const [gravity, setGravity] = useState(0.32);
  const [drift, setDrift] = useState(0.96);

  const isAdmin = user.role === UserRole.ADMIN;

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const data = await onLoadTags({ pageSize: TAG_PAGE_SIZE });
      setTags(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach(article => {
      (article.tags ?? []).forEach(tag => {
        const key = String(tag);
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    });
    return map;
  }, [articles]);

  const filteredTags = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return tags;
    return tags.filter(tag => {
      return tag.name.toLowerCase().includes(normalized) || tag.slug.toLowerCase().includes(normalized);
    });
  }, [tags, searchTerm]);

  const getCreatorLabel = (createdBy?: string | null) => {
    if (!createdBy) return '系统';
    return users.find(u => u.id === createdBy)?.username || `#${createdBy.slice(0, 6)}`;
  };

  const primaryItems = useMemo(
    () =>
      filteredTags.map(tag => {
        const count = usageMap.get(tag.slug) ?? 0;
        return {
          id: tag.id,
          label: `#${tag.name}`,
          meta: `${count} 篇`,
          colorClass: getColorClass(tag.slug),
          tag,
          interactive: true,
        } as TagItem;
      }),
    [filteredTags, usageMap]
  );

  const detailItems = useMemo(() => {
    if (!selectedTag) return [];
    const count = usageMap.get(selectedTag.slug) ?? 0;
    const createdAt = selectedTag.createdAt ? new Date(selectedTag.createdAt).toLocaleDateString() : '—';
    const updatedAt = selectedTag.updatedAt ? new Date(selectedTag.updatedAt).toLocaleDateString() : '—';

    return [
      {
        id: `${selectedTag.id}-name`,
        label: `#${selectedTag.name}`,
        meta: `/${selectedTag.slug}`,
        colorClass: getColorClass(selectedTag.slug),
        kind: 'tag',
        interactive: false,
      },
      {
        id: `${selectedTag.id}-count`,
        label: '文章',
        meta: String(count),
        colorClass: COLOR_PALETTE[2],
        kind: 'info',
        interactive: false,
      },
      {
        id: `${selectedTag.id}-creator`,
        label: '创建者',
        meta: getCreatorLabel(selectedTag.createdBy),
        colorClass: COLOR_PALETTE[1],
        kind: 'info',
        interactive: false,
      },
      {
        id: `${selectedTag.id}-created`,
        label: '创建时间',
        meta: createdAt,
        colorClass: COLOR_PALETTE[3],
        kind: 'info',
        interactive: false,
      },
      {
        id: `${selectedTag.id}-updated`,
        label: '更新时间',
        meta: updatedAt,
        colorClass: COLOR_PALETTE[4],
        kind: 'info',
        interactive: false,
      },
    ] as TagItem[];
  }, [selectedTag, usageMap, users]);

  const handleTagClick = async (item: TagItem) => {
    if (!item.tag) return;

    const baseTag = item.tag;
    setSelectedTag(baseTag);
    setDetailSeed(seed => seed + 1);
    setCloudSeed(seed => seed + 1);

    if (!isAdmin) return;

    setIsLoadingDetail(true);
    try {
      const detail = await onLoadDetail(baseTag.id);
      if (detail) setSelectedTag(detail);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreate = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await onCreateTag({ name });
      setNewTagName('');
      await loadTags();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="标签云"
        motto={isAdmin ? '全站标签结构与热度节点。' : '管理你的标签资产与复用。'}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="hidden md:block bg-[#1f202a] border border-[#3f4152] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#f8f8f2] uppercase tracking-[0.2em]">标签检索</h3>
              <p className="text-xs text-[#6272a4] font-mono">输入关键字过滤当前云场</p>
            </div>
            <button
              onClick={loadTags}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#bd93f9] border border-[#bd93f9]/40 rounded-full hover:bg-[#bd93f9]/10"
            >
              重新同步
            </button>
          </div>
          <input
            type="text"
            placeholder="搜索标签名或 slug"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full font-mono text-sm md:text-base"
          />
          {!isAdmin && (
            <div className="mt-4 flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="输入新标签"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                className="flex-1 text-sm md:text-base"
              />
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg disabled:opacity-60"
              >
                <Icons.Plus />
                创建
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#1f202a] border border-[#3f4152] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#f8f8f2] uppercase tracking-[0.2em]">云场参数</h3>
              <p className="text-xs text-[#6272a4] font-mono">控制重力与体积反馈</p>
            </div>
            <button
              onClick={() => setCloudSeed(seed => seed + 1)}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#50fa7b] border border-[#50fa7b]/40 rounded-full hover:bg-[#50fa7b]/10"
            >
              随机
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-[#6272a4] font-mono mb-2">
                <span>体积</span>
                <span>{tagSize}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={26}
                step={1}
                value={tagSize}
                onChange={e => setTagSize(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-[#6272a4] font-mono mb-2">
                <span>重力</span>
                <span>{gravity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.6}
                step={0.02}
                value={gravity}
                onChange={e => setGravity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-[#6272a4] font-mono mb-2">
                <span>滑动阻尼</span>
                <span>{drift.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.9}
                max={0.99}
                step={0.01}
                value={drift}
                onChange={e => setDrift(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="relative h-[360px] md:h-[480px] rounded-2xl border border-[#3f4152] overflow-hidden bg-[#1b1c27] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(189,147,249,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(80,250,123,0.14),transparent_60%)]" />
          <div className="absolute inset-0 border border-[#44475a]/40 rounded-2xl" />

          {isLoading ? (
            <div className="relative z-10 h-full flex items-center justify-center text-[#6272a4] font-mono text-sm uppercase tracking-widest animate-pulse">
              同步标签云中...
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="relative z-10 h-full flex items-center justify-center text-[#6272a4] font-mono text-sm uppercase italic">
              暂无标签数据。
            </div>
          ) : (
            <div className="relative z-10 h-full">
              <TagPhysicsCanvas
                items={primaryItems}
                size={tagSize}
                gravity={gravity}
                drift={drift}
                refreshKey={cloudSeed}
                active={!selectedTag}
                onItemClick={handleTagClick}
              />
            </div>
          )}

          {selectedTag && (
            <div className="absolute inset-3 md:inset-6 z-20 rounded-2xl border border-[#44475a] bg-[#1a1b24]/95 shadow-2xl backdrop-blur-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#44475a]/70">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_6px_rgba(255,95,86,0.6)]"
                      title="返回"
                    />
                    <button
                      type="button"
                      onClick={() => setDetailSeed(seed => seed + 1)}
                      className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_rgba(255,189,46,0.6)]"
                      title="刷新"
                    />
                    <button
                      type="button"
                      onClick={() => setCloudSeed(seed => seed + 1)}
                      className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_6px_rgba(39,201,63,0.6)]"
                      title="刷新主云"
                    />
                  </div>
                  <span className="text-xs text-[#6272a4] font-mono uppercase tracking-[0.3em]">
                    TAG DETAIL
                  </span>
                  {isLoadingDetail && (
                    <span className="text-[11px] text-[#ffb86c] font-black uppercase">同步中...</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#f8f8f2]">#{selectedTag.name}</span>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(selectedTag)}
                      className="px-3 py-1 text-xs font-black uppercase tracking-widest text-[#ff5545] border border-[#ff5545]/40 rounded-full hover:bg-[#ff5545]/10"
                    >
                      删除标签
                    </button>
                  )}
                </div>
              </div>
              <div className="relative h-[250px] md:h-[360px]">
                <TagPhysicsCanvas
                  items={detailItems}
                  size={tagSize}
                  gravity={gravity * 0.6}
                  drift={drift}
                  refreshKey={detailSeed}
                  active={!!selectedTag}
                  className="h-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="删除标签"
        message={`确认删除标签「${deleteTarget?.name}」？该标签会从关联文章中移除。`}
        confirmText="确认删除"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await onDeleteTag(deleteTarget.id);
            await loadTags();
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setDeleteTarget(null);
            setSelectedTag(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default TagCloud;
