import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { CyberInput } from '../ui/CyberInput';
import { ConfirmModal } from '../ui/ConfirmModal';
import { UserProfile } from '../../types';
import type { User as AdminUser } from '../../../../types';
import { 
    Save, Mail, Edit3, 
    Award, 
    Activity, Play, Wind, X, Heart, Brain, Timer,
    Camera, Upload, ScanLine, Link as LinkIcon, Crop, ZoomIn, ZoomOut, RotateCcw, Maximize,
} from 'lucide-react';

const EMOTIONAL_TAGS = [
  { icon: "✍️", label: "写作" },
  { icon: "🎨", label: "设计" },
  { icon: "🐛", label: "调试" },
  { icon: "💤", label: "休息" },
  { icon: "🚀", label: "发布" },
];

const DEFAULT_EMOJI = EMOTIONAL_TAGS[0]?.icon ?? ':)';
const DEFAULT_ROLE_TITLE = (role: AdminUser['role']) => (role === 'admin' ? '管理员' : '作者');

const buildProfileForm = (user: AdminUser): UserProfile => ({
  username: user.username ?? '',
  displayName: user.displayName?.trim() || user.username || '',
  email: user.email ?? '',
  roleTitle: user.roleTitle?.trim() || DEFAULT_ROLE_TITLE(user.role),
  bio: user.bio ?? '',
  emojiStatus: user.emojiStatus ?? DEFAULT_EMOJI,
  avatarUrl: user.avatarUrl ?? '',
});

const normalizeForm = (user: AdminUser, data: UserProfile): UserProfile => ({
  username: user.username ?? data.username ?? '',
  displayName: data.displayName.trim() || user.username || '',
  email: data.email.trim(),
  roleTitle: data.roleTitle.trim() || DEFAULT_ROLE_TITLE(user.role),
  bio: data.bio.trim(),
  emojiStatus: data.emojiStatus.trim() || DEFAULT_EMOJI,
  avatarUrl: data.avatarUrl.trim(),
});

const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const MEDITATION_QUOTES = [
  "每一次深呼吸，都是对心灵的重启。",
  "宁静不是避开风浪，而是在风浪中保持平稳。",
  "在此刻，你只需关注你自己。",
  "让思绪像云一样飘过，不要试图抓住它们。",
  "你的内心比你想象的更加宽广。",
  "休息是为了走更长远的路。",
  "吸入能量，呼出焦虑。",
];

// Custom Animations Style Block
const ANIMATION_STYLES = `
  @keyframes levitate {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes ripple-slow {
    0% { transform: scale(1); opacity: 0.3; border-width: 1px; }
    100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
  }
`;

// --- CREATIVE WIDGETS ---

const CyberChronometer = () => {
    const [time, setTime] = useState(new Date());
    const [sessionStart] = useState(Date.now());
    const [sessionDuration, setSessionDuration] = useState('00:00:00');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now);
            
            // Calculate session duration
            const diff = Math.floor((Date.now() - sessionStart) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setSessionDuration(`${h}:${m}:${s}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [sessionStart]);

    return (
        <GlassCard className="h-64 flex flex-col items-center justify-center relative overflow-hidden group border-primary/20 bg-canvas/40" hoverEffect>
            {/* Background Tech Rings */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-56 h-56 border border-dashed border-primary rounded-full" />
                <div className="absolute w-44 h-44 border border-dotted border-secondary rounded-full" />
                <div className="absolute w-32 h-32 border-2 border-primary/20 rounded-full" />
            </div>

            {/* Content */}
                <div className="z-10 text-center relative">
                <div className="text-[10px] text-secondary font-mono tracking-[0.3em] mb-3 uppercase flex items-center justify-center gap-2">
                    <Activity size={10} /> 系统时间
                </div>
                <div className="text-6xl font-bold font-mono text-fg tabular-nums tracking-wider">
                    {time.toLocaleTimeString([], { hour12: false })}
                </div>
                <div className="mt-6 flex items-center justify-center gap-3 text-xs font-mono text-muted bg-canvas/70 px-4 py-1.5 rounded-full border border-border backdrop-blur-md">
                    <span className="w-1.5 h-1.5 bg-success rounded-full ring-1 ring-border/60" />
                    <span className="opacity-75">已登录</span>
                    <span className="text-success font-bold">{sessionDuration}</span>
                </div>
            </div>
            
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl opacity-60"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/30 rounded-tr-2xl opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/30 rounded-bl-2xl opacity-60"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/30 rounded-br-2xl opacity-60"></div>
        </GlassCard>
    );
};

// --- Immersive Meditation Overlay ---
interface MeditationModalProps {
    isOpen: boolean;
    onClose: (durationSeconds: number) => void;
}

const MeditationOverlay: React.FC<MeditationModalProps> = ({ isOpen, onClose }) => {
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'wait'>('inhale');
    const [seconds, setSeconds] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [quote, setQuote] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSeconds(0);
            setIsFinished(false);
            setPhase('inhale');
            return;
        }

        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    // Breathing Cycle Effect (4-4-4-2 rhythm)
    useEffect(() => {
        if (!isOpen || isFinished) return;

        let timeout: any;
        const runCycle = () => {
            setPhase('inhale'); // 4s
            timeout = setTimeout(() => {
                setPhase('hold'); // 4s
                timeout = setTimeout(() => {
                    setPhase('exhale'); // 4s
                    timeout = setTimeout(() => {
                        setPhase('wait'); // 2s
                        timeout = setTimeout(() => {
                            runCycle();
                        }, 2000);
                    }, 4000);
                }, 4000);
            }, 4000);
        };
        runCycle();
        return () => clearTimeout(timeout);
    }, [isOpen, isFinished]);

    const handleFinish = () => {
        setIsFinished(true);
        setQuote(MEDITATION_QUOTES[Math.floor(Math.random() * MEDITATION_QUOTES.length)]);
    };

    if (!isOpen) return null;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const getPhaseText = () => {
        switch (phase) {
            case 'inhale':
                return '吸气';
            case 'hold':
                return '屏息';
            case 'exhale':
                return '呼气';
            case 'wait':
                return '停顿';
            default:
                return '';
        }
    };

    // Calculate visual state
    const getPhaseStyles = () => {
        switch (phase) {
            case 'inhale': 
                return {
                    scale: 1.5,
                    opacity: 1,
                    shadow: '0 0 60px rgba(165, 243, 252, 0.6)',
                    bgColor: '#CFFAFE', // Light Cyan
                    textOpacity: 1,
                    iconColor: 'text-cyan-900'
                };
            case 'hold': 
                return {
                    scale: 1.6,
                    opacity: 1,
                    shadow: '0 0 90px rgba(255, 255, 255, 0.8)',
                    bgColor: '#FFFFFF', // Pure White
                    textOpacity: 1,
                    iconColor: 'text-slate-900'
                };
            case 'exhale': 
                return {
                    scale: 1.0,
                    opacity: 0.9,
                    shadow: '0 0 40px rgba(192, 132, 252, 0.4)',
                    bgColor: '#D8B4FE', // Light Purple
                    textOpacity: 0.8,
                    iconColor: 'text-purple-900'
                };
            case 'wait': 
                return {
                    scale: 0.9,
                    opacity: 0.7,
                    shadow: '0 0 20px rgba(148, 163, 184, 0.2)',
                    bgColor: '#94a3b8', // Slate Grey
                    textOpacity: 0.6,
                    iconColor: 'text-slate-300'
                };
        }
    };

    const style = getPhaseStyles();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
            <style>{ANIMATION_STYLES}</style>
            
            {/* Full Screen Frosted Glass Mask */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-2xl transition-all duration-1000" />

            {/* Levitating Card Container */}
            <div 
                className="relative w-full max-w-xl mx-4 z-10"
            >
                {/* Subtle Flowing Edge Glow */}
                <div className="absolute -inset-[1px] bg-fg/5 rounded-3xl opacity-40"></div>

                <GlassCard className="relative flex flex-col items-center justify-center py-16 px-10 min-h-[550px] bg-surface/70 border-border shadow-2xl backdrop-blur-2xl rounded-3xl">
                    
                    {/* Close Button */}
                    {!isFinished && (
                        <button 
                            onClick={handleFinish}
                            className="absolute top-6 right-6 p-3 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-50 cursor-pointer"
                            title="结束冥想"
                        >
                            <X size={20} />
                        </button>
                    )}

                    {!isFinished ? (
                        <>
                            {/* --- THE RIPPLE ORB CONTAINER --- */}
                            {/* Positioned relatively in the center of the flex column, no margins pushed */}
                            <div className="relative w-80 h-80 flex items-center justify-center z-0">
                                {/* Ripples - Synced with phase */}
                                {phase === 'inhale' && (
                                    <>
                                        <div className="absolute inset-0 rounded-full border border-white/20" style={{ animation: 'ripple-slow 4s linear infinite' }}></div>
                                        <div className="absolute inset-0 rounded-full border border-white/10" style={{ animation: 'ripple-slow 4s linear infinite', animationDelay: '1s' }}></div>
                                    </>
                                )}
                                
                                {/* Core Breathing Sphere */}
                                <div 
                                    className="rounded-full flex items-center justify-center transition-all duration-[4000ms] ease-in-out relative z-20 overflow-hidden"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        transform: `scale(${style.scale})`,
                                        backgroundColor: style.bgColor,
                                        boxShadow: style.shadow,
                                        opacity: style.opacity
                                    }}
                                >
                                    {/* Static Gloss Overlay for 3D effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
                                    
                                    {/* Icon inside orb */}
                                    <Wind size={40} className={`transition-colors duration-[4000ms] relative z-10 ${style.iconColor}`} />
                                </div>
                            </div>

                            {/* Text Instructions */}
                            {/* Positioned absolutely at bottom to keep the orb geometrically centered in the card */}
                            <div className="absolute bottom-14 left-0 right-0 text-center space-y-6 z-10">
                                <h2 
                                    className="text-4xl font-bold text-white tracking-[0.2em] transition-opacity duration-1000"
                                    style={{ opacity: style.textOpacity }}
                                >
                                    {getPhaseText()}
                                </h2>
                                
                                <div className="inline-flex items-center justify-center gap-3 text-slate-400 font-mono text-sm tracking-widest bg-black/20 px-6 py-2 rounded-full border border-white/5">
                                    <Timer size={14} />
                                    <span>{timeDisplay}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        // SUMMARY VIEW
                        <div className="flex flex-col items-center justify-center w-full px-8 animate-fade-in text-center max-w-sm mx-auto">
                            <div className="w-20 h-20 bg-primary/15 border border-primary/20 rounded-full flex items-center justify-center mb-8">
                                <Heart size={40} className="text-white fill-white/20" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-3">冥想结束</h2>
                            <p className="text-slate-400 font-mono mb-8 text-sm">本次专注: <span className="text-fuchsia-300 font-bold ml-2">{timeDisplay}</span></p>
                            
                            <div className="w-full bg-white/5 border border-purple-500/10 rounded-2xl p-8 mb-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
                                <p className="text-base text-slate-300 italic leading-relaxed">
                                    "{quote}"
                                </p>
                            </div>

                            <NeonButton 
                                variant="primary" 
                                onClick={() => onClose(seconds)}
                                className="w-full justify-center py-3 text-base"
                            >
                                完成
                            </NeonButton>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

// --- Dashboard Entry Widget ---
const FocusResonatorEntry = ({ stats, onStart }: { stats: { count: number, minutes: number }, onStart: () => void }) => {
    return (
        <GlassCard className="h-64 flex flex-col relative overflow-hidden bg-canvas/40 group" hoverEffect>
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700"></div>
            
            {/* Header Area */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Brain size={18} className="text-cyan-400"/> 冥想空间
                    </h3>
                    <div className="h-1 w-8 bg-cyan-500/30 rounded-full"></div>
                </div>
                
                {/* Enlarged Hero Icon */}
                <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary group-hover:scale-[1.02] transition-transform duration-300">
                    <Wind size={32} />
                </div>
            </div>

            {/* Stats Area - Centered and Larger */}
            <div className="flex-1 flex items-center justify-center gap-8 relative z-10">
                <div className="text-center group/stat">
                    <div className="text-4xl font-bold text-fg font-mono tracking-tighter group-hover/stat:text-secondary transition-colors">
                        {stats.count}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                        <Activity size={10} /> 次数
                    </div>
                </div>
                
                <div className="w-px h-12 bg-border/60"></div>

                <div className="text-center group/stat">
                    <div className="text-4xl font-bold text-fg font-mono tracking-tighter group-hover/stat:text-secondary transition-colors">
                        {stats.minutes}
                        <span className="text-lg text-slate-600 ml-1 font-sans font-normal">分钟</span>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                        <Timer size={10} /> 专注
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto mb-1 relative z-10">
                <button
                    onClick={onStart}
                    className="w-full py-3.5 rounded-xl bg-secondary/12 border border-secondary/20 hover:bg-secondary/18 hover:border-secondary/30 text-fg font-bold text-sm transition-colors flex items-center justify-center gap-3"
                >
                    <Play size={16} className="fill-current" />
                    <span className="tracking-wide">开始冥想</span>
                </button>
            </div>
        </GlassCard>
    );
};

interface AuthorProfileTabProps {
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

export const AuthorProfileTab: React.FC<AuthorProfileTabProps> = ({
  user,
  onUpdateProfile,
  onUploadAvatar,
}) => {
  const [formData, setFormData] = useState<UserProfile>(() => buildProfileForm(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  
  // Meditation State
  const [showMeditation, setShowMeditation] = useState(false);
  const [meditationStats, setMeditationStats] = useState({ count: 12, minutes: 48 });

  // Preview Data
  const [previewData, setPreviewData] = useState<UserProfile>(() => buildProfileForm(user));
  const displayData = isEditing ? formData : previewData;

  // --- Cropper State ---
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = buildProfileForm(user);
    setFormData(next);
    setPreviewData(next);
    setIsEditing(false);
    setShowSaveConfirm(false);
    setShowEditConfirm(false);
    setErrorMessage('');
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

  const handleSave = async () => {
    setIsSaving(true);
    setShowSaveConfirm(false);
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
      const normalized = normalizeForm(user, formData);
      setPreviewData(normalized);
      setFormData(normalized);
      setIsEditing(false);
    } catch (err) {
      setErrorMessage((err as Error).message || '资料更新失败。');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSensitiveAction = () => {
    setShowEditConfirm(false);
    setIsEditing(true); 
  };

  const handleStartEditing = () => {
    if ((previewData.email ?? '').trim()) {
      setShowEditConfirm(true);
      return;
    }
    setIsEditing(true);
  };

  const handleMeditationComplete = (durationSeconds: number) => {
      setShowMeditation(false);
      // Only update stats if session was longer than 10 seconds to avoid accidental clicks
      if (durationSeconds > 10) {
          setMeditationStats(prev => ({
              count: prev.count + 1,
              minutes: prev.minutes + Math.ceil(durationSeconds / 60)
          }));
      }
  };

  // --- Avatar Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    setCropFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImgSrc(reader.result as string);
      setShowCropModal(true);
      setCropZoom(1);
      setCropPos({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleUrlParse = () => {
    const url = formData.avatarUrl.trim();
    if (!url) return;
    setIsLoadingUrl(true);
    setErrorMessage('');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setIsLoadingUrl(false);
      setCropImgSrc(url);
      setCropFile(null);
      setShowCropModal(true);
      setCropZoom(1);
      setCropPos({ x: 0, y: 0 });
    };
    img.onerror = () => {
      setIsLoadingUrl(false);
      setErrorMessage('图片加载失败，请检查链接或 CORS 设置。');
    };
    img.src = url;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setCropPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const generateCrop = async () => {
    if (!imgRef.current || isUploading) return;
    setIsUploading(true);
    setErrorMessage('');
    const OUTPUT_SIZE = 256;
    const VISUAL_SIZE = 280;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsUploading(false);
      return;
    }
    ctx.fillStyle = '#0F111A';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    const img = imgRef.current;
    const outputScale = OUTPUT_SIZE / VISUAL_SIZE;
    const fitRatio = Math.min(VISUAL_SIZE / img.naturalWidth, VISUAL_SIZE / img.naturalHeight);
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.scale(outputScale, outputScale);
    ctx.translate(cropPos.x, cropPos.y);
    ctx.scale(cropZoom, cropZoom);
    ctx.scale(fitRatio, fitRatio);
    try {
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('无法导出图片。');
      const baseName = cropFile?.name?.replace(/\.[^/.]+$/, '') || 'avatar';
      const croppedFile = new File([blob], `${baseName}-cropped.jpg`, { type: 'image/jpeg' });
      const url = await onUploadAvatar(croppedFile);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      setShowCropModal(false);
      setCropImgSrc(null);
      setCropFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '裁剪失败。';
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative min-h-[500px]">
        {/* --- Top Section: Profile Preview Card --- */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-muted uppercase tracking-wider">
                    {isEditing ? "编辑模式" : "作者名片"}
                </h3>
                <span className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-1 rounded border border-pink-500/20 font-bold">已认证作者</span>
            </div>
            
            <GlassCard className={`relative overflow-hidden group transition-all duration-500 ${isEditing ? 'border-accent/30' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-32 bg-fg/3"></div>
                
                <div className="relative pt-12 px-4 sm:px-8 pb-4">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        
                        {/* Avatar & Status */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-surface2 border-4 border-border shadow-xl overflow-hidden flex items-center justify-center text-3xl select-none relative group/avatar">
                                {displayData.avatarUrl ? (
                                    <img src={displayData.avatarUrl} alt="头像" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-pink-500 to-purple-500 font-bold">
                                        {displayData.displayName[0]}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center shadow-md text-lg cursor-help" title="当前状态">
                                {displayData.emojiStatus}
                            </div>
                        </div>

                        {/* Info Block */}
                        <div className="flex-1 mt-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-fg tracking-tight">{displayData.displayName}</h2>
                                <Award size={18} className="text-yellow-400" />
                            </div>
                            <p className="text-pink-400 font-medium text-sm mb-3 font-mono">@{displayData.username} · {displayData.roleTitle}</p>
                            
                            <div className="p-3 bg-surface2/40 rounded-xl border border-border text-sm text-fg/80 leading-relaxed max-w-2xl italic min-h-[3.5rem]">
                                "{displayData.bio || '笔胜于剑……'}"
                            </div>

                            <div className="flex gap-4 mt-4 text-xs font-mono text-muted">
                                <div className="flex items-center gap-1.5 hover:text-pink-400 transition-colors cursor-pointer">
                                    <Mail size={12} /> {displayData.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </section>

        {/* --- Bottom Section: Edit Form OR Creative Tools --- */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-muted uppercase tracking-wider">
                    {isEditing ? "编辑资料" : "创作工具"}
                </h3>
                {!isEditing && (
                    <NeonButton variant="secondary" onClick={handleStartEditing} icon={<Edit3 size={14}/>} className="h-8 text-xs">
                        编辑资料
                    </NeonButton>
                )}
            </div>

            {isEditing ? (
                // ================= EDIT FORM =================
                <GlassCard>
                    <div className="space-y-6 animate-fade-in">
                         {/* Enhanced Avatar Edit */}
                         <div className="flex items-center gap-5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                            <div 
                            onClick={isUploading ? undefined : triggerFileInput}
                            className="relative w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group hover:border-primary/50 transition-colors shadow-md"
                            >
                                {formData.avatarUrl ? (
                                <img src={formData.avatarUrl} alt="预览" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                <Camera size={24} className="text-muted group-hover:text-primary transition-colors" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                <Upload size={16} className="text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">头像地址</label>

                                <div className="relative group/input">
                                    <input 
                                        className="w-full bg-surface text-fg border border-border rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-primary/50 focus:bg-surface2/40 transition-colors placeholder:text-muted font-mono text-base"
                                        value={formData.avatarUrl || ''}
                                        onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                                        placeholder="https://... 或粘贴 Base64"
                                    />
                                    
                                    <button 
                                        onClick={handleUrlParse}
                                        disabled={!formData.avatarUrl || isLoadingUrl}
                                        className={`
                                            absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all
                                            ${formData.avatarUrl 
                                                ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer' 
                                                : 'bg-surface2/40 border-border text-muted cursor-not-allowed'}
                                        `}
                                        title="解析图片链接"
                                    >
                                        {isLoadingUrl ? <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" /> : <ScanLine size={16} />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                                    <LinkIcon size={10} /> 
                                    支持本地上传（点击左侧）或网络链接解析。网络图片需允许跨域访问。                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CyberInput label="显示名称" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} />
                            <CyberInput label="职位头衔" value={formData.roleTitle} onChange={(e) => setFormData({...formData, roleTitle: e.target.value})} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">当前状态</label>
                            <div className="flex gap-2">
                                {EMOTIONAL_TAGS.map((tag) => (
                                    <button
                                        key={tag.icon}
                                        onClick={() => setFormData({...formData, emojiStatus: tag.icon})}
                                        className={`
                                            w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-all
                                            ${formData.emojiStatus === tag.icon ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface2/40 border-border hover:bg-fg/5'}
                                        `}
                                        title={tag.label}
                                    >
                                        {tag.icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">个人简介</label>
                             <textarea 
                                className="w-full bg-surface text-fg border border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted min-h-[120px] resize-y"
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                maxLength={200}
                             />
                             <div className="text-right text-[10px] text-slate-600 mt-1">{formData.bio.length} / 200</div>
                        </div>

                        <div>
                            <CyberInput 
                                label="公开联系邮箱" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="name@example.com"
                            />
                        </div>

                        {errorMessage && (
                            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">
                                {errorMessage}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                            <NeonButton variant="ghost" onClick={() => { setIsEditing(false); setFormData(previewData); }} disabled={isSaving || isUploading}>取消</NeonButton>
                            <NeonButton variant="primary" icon={<Save size={14} />} onClick={() => setShowSaveConfirm(true)} disabled={isSaving || isUploading}>
                                {isSaving ? '保存中...' : '保存修改'}
                            </NeonButton>
                        </div>
                    </div>
                </GlassCard>
            ) : (
                // ================= VIEW MODE: CREATIVE WIDGETS =================
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <CyberChronometer />
                    <FocusResonatorEntry 
                        stats={meditationStats} 
                        onStart={() => setShowMeditation(true)} 
                    />
                </div>
            )}

            {/* Save Confirmation */}
            <ConfirmModal 
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleSave}
                title="保存作者资料"
                message="确认更新您的公开作者名片信息？"
                type="primary"
                confirmText="保存修改"
            />

            {/* Confirmation Modal: Sensitive Edit */}
            <ConfirmModal
                isOpen={showEditConfirm}
                onClose={() => setShowEditConfirm(false)}
                onConfirm={confirmSensitiveAction}
                title="安全警告"
                message="你将修改敏感身份信息，是否继续？"
                type="danger"
                confirmText="确认修改"
            />

            {/* Floating Meditation Overlay (Scoped to Tab) */}
            <MeditationOverlay 
                isOpen={showMeditation}
                onClose={handleMeditationComplete}
            />

            {/* --- CROPPER MODAL --- */}
            {showCropModal && cropImgSrc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <GlassCard className="max-w-lg w-full flex flex-col items-center relative border-primary/30 shadow-2xl">
                    
                    <div className="w-full flex justify-between items-center mb-6 border-b border-border pb-4">
                        <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                            <Crop size={18} className="text-primary"/> 头像裁剪
                        </h3>
                        <button onClick={() => setShowCropModal(false)} className="text-muted hover:text-fg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Crop Area - SQUARE UI */}
                    <div 
                        className="
                            relative w-[280px] h-[280px] bg-surface 
                            border-2 border-primary 
                            shadow-lg
                            rounded-md overflow-hidden cursor-move touch-none group select-none
                        "
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        ref={containerRef}
                    >
                        <div className="absolute inset-0 opacity-20 pointer-events-none" 
                            style={{backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                        
                        <div 
                            className="absolute left-1/2 top-1/2 w-full h-full flex items-center justify-center pointer-events-none"
                            style={{
                                transform: `translate(calc(-50% + ${cropPos.x}px), calc(-50% + ${cropPos.y}px)) scale(${cropZoom})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <img 
                                ref={imgRef}
                                src={cropImgSrc} 
                                alt="裁剪目标" 
                                draggable={false}
                                className="max-w-none" 
                                style={{ maxHeight: '280px', maxWidth: '280px', objectFit: 'contain' }} 
                                crossOrigin="anonymous"
                            />
                        </div>
                        
                        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                            <div className="w-full h-full border-2 border-dashed border-white/30 rounded-full"></div>
                        </div>

                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary pointer-events-none z-20"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary pointer-events-none z-20"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary pointer-events-none z-20"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary pointer-events-none z-20"></div>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30">
                            <div className="bg-black/60 px-3 py-1.5 rounded-full text-[10px] text-white backdrop-blur-sm border border-primary/30 flex items-center gap-1 shadow-lg">
                                <Maximize size={10} className="text-primary"/> 拖拽移动
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-mono mt-4 mb-4 text-center">
                        * 可视区域即最终效果，虚线圆环仅作头像展示参考。
                        <br />
                        输出尺寸：<span className="text-primary font-bold">256x256 JPEG</span>
                    </p>

                    {/* Controls */}
                    <div className="w-full space-y-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <ZoomOut size={16} className="text-slate-400" />
                            <input 
                                type="range" min="0.2" max="5" step="0.1" 
                                value={cropZoom}
                                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                            />
                            <ZoomIn size={16} className="text-slate-400" />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                            <button onClick={() => { setCropZoom(1); setCropPos({x:0,y:0}); }} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                                <RotateCcw size={12} /> 重置
                            </button>

                            <div className="flex gap-2">
                                <NeonButton variant="ghost" onClick={() => setShowCropModal(false)}>取消</NeonButton>
                                <NeonButton variant="primary" icon={<Crop size={14} />} onClick={generateCrop} disabled={isUploading}>确认裁剪</NeonButton>
                            </div>
                        </div>
                    </div>
                </GlassCard>
                </div>
            )}
        </section>
    </div>
  );
};
