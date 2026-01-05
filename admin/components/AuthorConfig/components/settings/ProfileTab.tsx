import React, { useEffect, useRef, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { CyberInput } from '../ui/CyberInput';
import { Edit3, Save, Mail, ShieldAlert, BadgeCheck, Upload, Camera } from 'lucide-react';
import type { User as AdminUser } from '../../../../types';

type ProfileFormData = {
  displayName: string;
  email: string;
  roleTitle: string;
  bio: string;
  emojiStatus: string;
  avatarUrl: string;
};

const DEFAULT_EMOJI = '🎯';
const CROP_BOX_SIZE = 240;
const CROP_OUTPUT_SIZE = 512;
const CROP_MAX_SCALE = 3;

type CropOffset = { x: number; y: number };

const clampCropOffset = (
  offset: CropOffset,
  scale: number,
  naturalWidth: number,
  naturalHeight: number
) => {
  if (!naturalWidth || !naturalHeight) return offset;
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const minX = Math.min(0, CROP_BOX_SIZE - width);
  const minY = Math.min(0, CROP_BOX_SIZE - height);
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
};

const getDefaultRoleTitle = (role: AdminUser['role']) => (role === 'admin' ? 'Admin' : 'Author');

const buildProfileForm = (user: AdminUser): ProfileFormData => ({
  displayName: user.displayName ?? user.username ?? '',
  email: user.email ?? '',
  roleTitle: user.roleTitle ?? getDefaultRoleTitle(user.role),
  bio: user.bio ?? '',
  emojiStatus: user.emojiStatus ?? DEFAULT_EMOJI,
  avatarUrl: user.avatarUrl ?? '',
});

const EMOTIONAL_TAGS = [
  { icon: '🎯', label: '专注中' },
  { icon: '⚡', label: '充能中' },
  { icon: '🤔', label: '思考中' },
  { icon: '🏖️', label: '度假中' },
  { icon: '🛠️', label: '构建中' },
];

interface ProfileTabProps {
  user: AdminUser;
  onUpdateProfile: (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, onUpdateProfile, onUploadAvatar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(() => buildProfileForm(user));
  const [previewData, setPreviewData] = useState<ProfileFormData>(() => buildProfileForm(user));
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cropSrc, setCropSrc] = useState('');
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropMinScale, setCropMinScale] = useState(1);
  const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [cropNatural, setCropNatural] = useState({ width: 0, height: 0 });
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const next = buildProfileForm(user);
    setFormData(next);
    setPreviewData(next);
    setIsEditing(false);
    setShowConfirm(false);
  }, [
    user.id,
    user.username,
    user.displayName,
    user.email,
    user.roleTitle,
    user.emojiStatus,
    user.avatarUrl,
    user.bio,
  ]);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const normalizeForm = (data: ProfileFormData): ProfileFormData => ({
    displayName: data.displayName.trim() || user.username || '',
    email: data.email.trim(),
    roleTitle: data.roleTitle.trim() || getDefaultRoleTitle(user.role),
    bio: data.bio.trim(),
    emojiStatus: data.emojiStatus.trim() || DEFAULT_EMOJI,
    avatarUrl: data.avatarUrl.trim(),
  });

  const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    const payload = {
      avatarUrl: toNullable(formData.avatarUrl),
      bio: toNullable(formData.bio),
      displayName: toNullable(formData.displayName),
      email: toNullable(formData.email),
      roleTitle: toNullable(formData.roleTitle),
      emojiStatus: toNullable(formData.emojiStatus),
    };

    try {
      await onUpdateProfile(payload);
      const normalized = normalizeForm(formData);
      setFormData(normalized);
      setPreviewData(normalized);
      setIsEditing(false);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSensitiveAction = () => {
    setShowConfirm(false);
    setIsEditing(true);
  };

  const handleStartEditing = () => {
    if ((previewData.email ?? '').trim()) {
      setShowConfirm(true);
      return;
    }
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setFormData(previewData);
    setErrorMessage('');
  };

  const resetCropper = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc('');
    setCropFile(null);
    setCropScale(1);
    setCropMinScale(1);
    setCropOffset({ x: 0, y: 0 });
    setCropNatural({ width: 0, height: 0 });
    setIsCropOpen(false);
    setIsDraggingCrop(false);
    dragStateRef.current = null;
  };

  const handleCropImageLoad = () => {
    const img = cropImageRef.current;
    if (!img) return;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const baseScale = Math.max(CROP_BOX_SIZE / naturalWidth, CROP_BOX_SIZE / naturalHeight);
    const displayWidth = naturalWidth * baseScale;
    const displayHeight = naturalHeight * baseScale;
    setCropNatural({ width: naturalWidth, height: naturalHeight });
    setCropMinScale(baseScale);
    setCropScale(baseScale);
    setCropOffset({
      x: (CROP_BOX_SIZE - displayWidth) / 2,
      y: (CROP_BOX_SIZE - displayHeight) / 2,
    });
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isUploading || !cropNatural.width || !cropNatural.height) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: cropOffset.x,
      offsetY: cropOffset.y,
    };
    setIsDraggingCrop(true);
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    const nextOffset = clampCropOffset(
      {
        x: dragStateRef.current.offsetX + deltaX,
        y: dragStateRef.current.offsetY + deltaY,
      },
      cropScale,
      cropNatural.width,
      cropNatural.height
    );
    setCropOffset(nextOffset);
  };

  const handleCropPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDraggingCrop(false);
  };

  const handleScaleChange = (value: number) => {
    setCropScale(prevScale => {
      const nextScale = value;
      const center = CROP_BOX_SIZE / 2;
      setCropOffset(prevOffset =>
        clampCropOffset(
          {
            x: (prevOffset.x - center) * (nextScale / prevScale) + center,
            y: (prevOffset.y - center) * (nextScale / prevScale) + center,
          },
          nextScale,
          cropNatural.width,
          cropNatural.height
        )
      );
      return nextScale;
    });
  };

  const handleApplyCrop = async () => {
    if (!cropFile || !cropSrc) return;
    setIsUploading(true);
    setErrorMessage('');
    try {
      const img = new Image();
      img.src = cropSrc;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
      });
      const canvas = document.createElement('canvas');
      canvas.width = CROP_OUTPUT_SIZE;
      canvas.height = CROP_OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法处理图像');
      const sx = (0 - cropOffset.x) / cropScale;
      const sy = (0 - cropOffset.y) / cropScale;
      const sWidth = CROP_BOX_SIZE / cropScale;
      const sHeight = CROP_BOX_SIZE / cropScale;
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('无法导出图像');
      const baseName = cropFile.name.replace(/\.[^/.]+$/, '');
      const croppedFile = new File([blob], `${baseName || 'avatar'}-cropped.jpg`, { type: 'image/jpeg' });
      const url = await onUploadAvatar(croppedFile);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      resetCropper();
    } catch (err) {
      setErrorMessage((err as Error).message || '头像处理失败');
      setIsUploading(false);
      return;
    }
    setIsUploading(false);
  };

  const handleCancelCrop = () => {
    resetCropper();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const nextSrc = URL.createObjectURL(file);
    setCropFile(file);
    setCropSrc(nextSrc);
    setIsCropOpen(true);
    event.currentTarget.value = '';
  };

  const triggerFileInput = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* --- Top Section: Preview Card --- */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#6272a4] uppercase tracking-wider">个人主页预览</h3>
            <span className="text-[10px] bg-[#44475a] text-[#6272a4] px-2 py-1 rounded border border-white/5">Public View</span>
        </div>
        
        <GlassCard className="relative overflow-hidden">
          {/* Dracula Soft Gradient Background */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20"></div>
          
          <div className="relative pt-12 px-4 sm:px-8 pb-4">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              
              {/* Avatar & Status */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-[#282a36] border-4 border-[#44475a] shadow-xl overflow-hidden flex items-center justify-center text-3xl select-none relative">
                   {previewData.avatarUrl ? (
                     <img src={previewData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent font-bold">
                       {(previewData.displayName || user.username || "?").charAt(0)}
                     </span>
                   )}
                </div>
                {/* Emotional Tag Badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#282a36] border border-white/10 flex items-center justify-center shadow-lg text-lg animate-bounce-slow cursor-help" title="当前心情">
                  {previewData.emojiStatus}
                </div>
              </div>

              {/* Info Block */}
              <div className="flex-1 mt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-[#f8f8f2] tracking-tight">{previewData.displayName}</h2>
                  <BadgeCheck size={18} className="text-success" />
                </div>
                <p className="text-primary font-medium text-sm mb-3">{previewData.roleTitle}</p>
                
                <div className="p-3 bg-[#282a36]/50 rounded-xl border border-white/5 text-sm text-[#f8f8f2]/80 leading-relaxed max-w-2xl italic">
                  "{previewData.bio}"
                </div>

                <div className="flex gap-4 mt-4 text-xs font-mono text-[#6272a4]">
                  <div className="flex items-center gap-1.5 hover:text-secondary transition-colors cursor-pointer">
                    <Mail size={12} /> {previewData.email || "--"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* --- Bottom Section: Edit Form / Display --- */}
      <section>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#6272a4] uppercase tracking-wider">详细资料编辑</h3>
            {!isEditing && (
              <NeonButton
                variant="secondary"
                onClick={handleStartEditing}
                icon={<Edit3 size={14} />}
                className="h-8 text-xs"
                disabled={isSaving}
              >
                编辑资料
              </NeonButton>
            )}
        </div>

        <GlassCard>
          {isEditing ? (
            /* --- Edit Mode --- */
            <div className="space-y-6 animate-fade-in">
              {/* Avatar Edit Section */}
              <div className="flex items-start gap-5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                 <div 
                   onClick={isUploading ? undefined : triggerFileInput}
                   className={`relative w-16 h-16 rounded-xl bg-[#0F111A] border border-white/10 flex items-center justify-center overflow-hidden group transition-colors ${isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/50'}`}
                 >
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Camera size={24} className="text-[#6272a4] group-hover:text-primary transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Upload size={16} className="text-white" />
                    </div>
                 </div>
                 <div className="flex-1 space-y-2">
                    <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept="image/*" 
                       onChange={handleFileChange} 
                    />
                    <CyberInput 
                      label="头像链接 (Avatar URL)" 
                      value={formData.avatarUrl || ''} 
                      onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                      placeholder="https://..."
                      editable={false}
                    />
                    <p className="text-[10px] text-[#6272a4] pl-1">
                      * 支持上传本地图片或直接输入网络图片地址，上传时可裁剪缩放（建议 512×512）
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CyberInput 
                  label="显示名称 (Display Name)" 
                  value={formData.displayName} 
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
                
                {/* Emoji Status Selector */}
                <div>
                   <label className="block text-xs font-mono text-[#6272a4] mb-1.5 uppercase tracking-wider ml-1">心情状态 (Vibe)</label>
                   <div className="flex gap-2">
                      {EMOTIONAL_TAGS.map((tag) => (
                        <button
                          key={tag.icon}
                          onClick={() => setFormData({...formData, emojiStatus: tag.icon})}
                          className={`
                            w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-all
                            ${formData.emojiStatus === tag.icon 
                              ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(189,147,249,0.3)]' 
                              : 'bg-[#44475a]/30 border-white/5 hover:bg-white/5'}
                          `}
                          title={tag.label}
                        >
                          {tag.icon}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <CyberInput 
                  label="职位 / 角色 (Role)" 
                  value={formData.roleTitle} 
                  onChange={(e) => setFormData({...formData, roleTitle: e.target.value})}
              />

              <div>
                <label className="block text-xs font-mono text-[#6272a4] mb-1.5 uppercase tracking-wider ml-1">个人简介 (Bio)</label>
                <textarea 
                  className="w-full bg-[#282a36] text-[#f8f8f2] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-all placeholder-[#6272a4] min-h-[100px]"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                />
              </div>

              {/* Sensitive Field */}
              <div className="relative">
                 <div className="absolute inset-0 bg-danger/5 pointer-events-none rounded-xl border border-danger/10"></div>
                 <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-danger text-xs font-bold uppercase">
                       <ShieldAlert size={12} /> 敏感操作区
                    </div>
                    <CyberInput 
                      label="绑定邮箱 (需要二次验证)" 
                      value={formData.email}
                      disabled={!isEditing}
                      className="border-danger/20 focus:border-danger/50"
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                 </div>
              </div>


              {errorMessage && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <NeonButton variant="ghost" onClick={handleCancelEditing} disabled={isSaving || isUploading}>取消</NeonButton>
                <NeonButton variant="primary" icon={<Save size={14} />} onClick={handleSave} disabled={isSaving || isUploading}>保存更改</NeonButton>
              </div>
            </div>
          ) : (
            /* --- Read Mode --- */
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1">
                     <label className="text-xs text-[#6272a4] font-mono">显示名称</label>
                     <p className="text-[#f8f8f2] font-medium">{previewData.displayName}</p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-[#6272a4] font-mono">角色</label>
                     <p className="text-[#f8f8f2] font-medium">{previewData.roleTitle}</p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-[#6272a4] font-mono">邮箱</label>
                     <p className="text-[#f8f8f2] font-medium flex items-center gap-2">
                        {previewData.email || "--"}
                        <span className="bg-success/10 text-success text-[10px] px-1.5 py-0.5 rounded border border-success/20">已验证</span>
                     </p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-[#6272a4] font-mono">最后更新</label>
                     <p className="text-[#6272a4]">2 分钟前</p>
                  </div>
               </div>
               
               <div className="pt-6 mt-2 border-t border-white/5">
                  <h4 className="text-xs font-bold text-[#6272a4] mb-2">安全日志 (LOGS)</h4>
                  <div className="bg-[#282a36] rounded-lg p-3 font-mono text-[10px] text-[#6272a4] space-y-1">
                     <p>&gt; User updated bio via dashboard</p>
                     <p>&gt; Session verified IP 192.168.x.x</p>
                  </div>
               </div>
            </div>
          )}
        </GlassCard>
      </section>

      {isCropOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="max-w-2xl w-full border-white/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#f8f8f2]">裁剪头像</h3>
                <p className="text-xs text-[#6272a4] mt-1">
                  建议尺寸 512×512，拖动与缩放选取清晰区域。
                </p>
              </div>
              <div className="text-[10px] text-[#6272a4] font-mono uppercase">
                Square Crop
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-start">
              <div>
                <div
                  className={`relative rounded-2xl border border-white/10 overflow-hidden bg-[#0F111A] touch-none ${
                    isDraggingCrop ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerEnd}
                  onPointerLeave={handleCropPointerEnd}
                >
                  {cropSrc && (
                    <img
                      ref={cropImageRef}
                      src={cropSrc}
                      onLoad={handleCropImageLoad}
                      alt="Crop preview"
                      className="absolute top-0 left-0 select-none"
                      style={{
                        width: cropNatural.width ? `${cropNatural.width * cropScale}px` : 'auto',
                        height: cropNatural.height ? `${cropNatural.height * cropScale}px` : 'auto',
                        left: cropOffset.x,
                        top: cropOffset.y,
                        maxWidth: 'none',
                      }}
                    />
                  )}
                  <div className="absolute inset-0 border border-white/15 rounded-2xl pointer-events-none" />
                </div>
                <div className="mt-4">
                  <label className="block text-[10px] text-[#6272a4] font-mono uppercase tracking-wider mb-2">
                    缩放
                  </label>
                  <input
                    type="range"
                    min={cropMinScale}
                    max={cropMinScale * CROP_MAX_SCALE}
                    step={0.01}
                    value={cropScale}
                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                    disabled={!cropNatural.width || isUploading}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-4 text-xs text-[#6272a4]">
                <div className="bg-[#0F111A] border border-white/5 rounded-xl p-4">
                  <p className="text-[#f8f8f2] font-semibold mb-2">操作提示</p>
                  <ul className="space-y-2">
                    <li>拖动图片选择头像主体。</li>
                    <li>滑动缩放保证清晰度。</li>
                    <li>确认后将自动上传并替换头像链接。</li>
                  </ul>
                </div>
                <div className="bg-[#0F111A] border border-white/5 rounded-xl p-4">
                  <p className="text-[#f8f8f2] font-semibold mb-2">输出规格</p>
                  <p>尺寸：{CROP_OUTPUT_SIZE}×{CROP_OUTPUT_SIZE}</p>
                  <p>格式：JPEG</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-6">
              <NeonButton variant="ghost" onClick={handleCancelCrop} disabled={isUploading}>
                取消
              </NeonButton>
              <NeonButton variant="primary" onClick={handleApplyCrop} disabled={isUploading || !cropNatural.width}>
                {isUploading ? '处理中...' : '应用并上传'}
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Confirmation Modal for Sensitive Info (Simulated) */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <GlassCard className="max-w-md w-full border-danger/30">
              <h3 className="text-lg font-bold text-[#f8f8f2] mb-2 flex items-center gap-2">
                <ShieldAlert className="text-danger" /> 安全检查
              </h3>
              <p className="text-[#6272a4] text-sm mb-6">
                您正在尝试修改关键身份信息。此操作将向您的备用邮箱发送安全警报。是否继续？
              </p>
              <div className="flex justify-end gap-3">
                 <NeonButton variant="ghost" onClick={() => setShowConfirm(false)}>取消</NeonButton>
                 <NeonButton variant="danger" onClick={confirmSensitiveAction}>我了解，继续编辑</NeonButton>
              </div>
           </GlassCard>
        </div>
      )}

    </div>
  );
};
