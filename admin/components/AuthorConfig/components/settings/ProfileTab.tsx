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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMessage('');
    try {
      const url = await onUploadAvatar(file);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsUploading(false);
    }
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
        
        <GlassCard className="relative overflow-hidden group">
          {/* Dracula Soft Gradient Background */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20"></div>
          
          <div className="relative pt-12 px-4 sm:px-8 pb-4">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              
              {/* Avatar & Status */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-[#282a36] border-4 border-[#44475a] shadow-xl overflow-hidden flex items-center justify-center text-3xl select-none relative group/avatar">
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
                    <p className="text-[10px] text-[#6272a4] pl-1">* 支持上传本地图片或直接输入网络图片地址</p>
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
              <div className="relative group">
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
