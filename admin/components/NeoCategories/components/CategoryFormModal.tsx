import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImageUp, Link2, X } from 'lucide-react';
import type { Category } from '../../../types';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { NeonButton } from '../../NeoShared/ui/NeonButton';
import { CyberInput } from '../../NeoShared/ui/CyberInput';
import { gradientBySeed } from '../utils';
import { prepareCategoryCoverImage } from '../utils/image';

export type CategoryFormMode = 'create' | 'edit';

export interface CategoryFormModalProps {
  open: boolean;
  mode: CategoryFormMode;
  initial?: Partial<Category> | null;
  onClose: () => void;
  onUploadCover?: (file: File) => Promise<string>;
  onSubmit: (input: {
    name: string;
    slug: string;
    description?: string | null;
    coverImageUrl?: string | null;
  }) => Promise<void> | void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  open,
  mode,
  initial,
  onClose,
  onUploadCover,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoOptimizeCover, setAutoOptimizeCover] = useState(true);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const title = useMemo(() => (mode === 'create' ? '新建专栏' : '编辑专栏'), [mode]);
  const coverGradient = useMemo(
    () => gradientBySeed((slug || name || initial?.slug || initial?.name || 'category').toString()),
    [initial?.name, initial?.slug, name, slug]
  );

  useEffect(() => {
    if (!open) return;
    setName(String(initial?.name ?? ''));
    setSlug(String(initial?.slug ?? ''));
    setDescription(String(initial?.description ?? ''));
    setCoverImageUrl((initial?.coverImageUrl as string | null | undefined) ?? null);
    setUploading(false);
    setSaving(false);
    setAutoOptimizeCover(true);
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-[var(--admin-ui-backdrop)] backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-xl !p-0 overflow-hidden border border-border shadow-xl">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.currentTarget.value = '';
            if (!file) return;
            if (!onUploadCover) return;
            if (uploading || saving) return;
            setUploading(true);
            try {
              const prepared = autoOptimizeCover ? await prepareCategoryCoverImage(file) : file;
              const url = await onUploadCover(prepared);
              setCoverImageUrl(url);
            } finally {
              setUploading(false);
            }
          }}
        />

        <div className="relative h-[160px]">
          {coverImageUrl ? (
            <img src={coverImageUrl} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className={`absolute inset-0 ${coverGradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-black tracking-widest uppercase text-secondary">NeoCategories</div>
                <div className="text-lg font-black text-white mt-1 truncate">{title}</div>
              </div>
              <div className="flex items-center gap-2">
                <NeonButton
                  variant="secondary"
                  icon={<ImageUp size={16} />}
                  disabled={!onUploadCover || uploading || saving}
                  onClick={() => fileRef.current?.click()}
                  title={!onUploadCover ? '当前上下文不可上传封面' : '上传封面'}
                >
                  上传封面
                </NeonButton>
                {coverImageUrl && (
                  <NeonButton
                    variant="ghost"
                    disabled={uploading || saving}
                    onClick={() => setCoverImageUrl(null)}
                  >
                    清除
                  </NeonButton>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Link2 size={14} className="text-muted" />
              <span className="truncate">{coverImageUrl ? coverImageUrl : '未设置封面（将使用渐变封面）'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl grid place-items-center text-muted hover:text-fg hover:bg-fg/5 border border-transparent hover:border-border transition-colors"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {onUploadCover && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-fg/3 px-4 py-3">
              <div className="text-xs text-fg font-semibold">
                封面处理
                <div className="text-[11px] text-muted font-mono mt-0.5">默认自动居中裁剪为 16:9 并压缩</div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoOptimizeCover}
                  onChange={(e) => setAutoOptimizeCover(e.target.checked)}
                  disabled={uploading || saving}
                />
                自动裁剪/压缩
              </label>
            </div>
          )}
          <CyberInput
            label="名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：工程实践"
            disabled={saving}
          />
          <CyberInput
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="例如：engineering"
            disabled={saving}
          />
          <div className="group">
            <label className="block text-sm font-medium text-muted mb-2 ml-1 transition-colors group-focus-within:text-primary">
              简介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="一句话描述这个专栏…"
              className="w-full min-h-[120px] bg-surface text-fg text-sm border border-border rounded-xl px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-fg/2 resize-y"
              disabled={saving}
            />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-white/10 flex items-center justify-end gap-3">
          <NeonButton variant="ghost" onClick={onClose} disabled={saving}>
            取消
          </NeonButton>
          <NeonButton
            variant="primary"
            disabled={saving || !name.trim()}
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              try {
                await onSubmit({
                  name: name.trim(),
                  slug: slug.trim(),
                  description: description.trim() ? description.trim() : null,
                  coverImageUrl,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            保存
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
};
