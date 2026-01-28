import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { NeonButton } from '../../NeoShared/ui/NeonButton';
import { CyberInput } from '../../NeoShared/ui/CyberInput';
import { ConfirmModal } from '../../NeoShared/ui/ConfirmModal';
import { useNeoToast } from '../../NeoShared/ui/Toast';
import { UserProfile } from '../types';
import type { User } from '../../../types';
import { 
    Edit3, Save, Mail, ShieldAlert, BadgeCheck, Upload, 
    Camera, X, ZoomIn, ZoomOut, Crop, RotateCcw,
    Maximize, ScanLine, Link as LinkIcon,
    Terminal, Cpu, Plus, Search, Hexagon,
    Monitor, PenTool, Globe, Server, Database
} from 'lucide-react';
import { SvgIcons, SKILL_LIBRARY, DEFAULT_SKILLS, SkillCategory, SkillDef } from '../data/techStack';

// --- MOCK USER ---
const MOCK_USER: UserProfile = {
  username: "root_admin",
  displayName: "Root Administrator",
  email: "root@dracula.io",
  roleTitle: "系统架构师 (System Architect)",
  bio: "负责数字边疆的开拓。维护系统完整性与自动化部署流水线。",
  emojiStatus: "🛡️",
  avatarUrl: ""
};

const EMOTIONAL_TAGS = [
  { icon: "🛡️", label: "安全" },
  { icon: "⚡", label: "充能" },
  { icon: "🧠", label: "思考" },
  { icon: "☕", label: "专注" },
  { icon: "🔧", label: "维护" },
];

export type ProfileTabProps = {
  user: User;
  onUpdateProfile: (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
};

const toProfileForm = (user: User): UserProfile => ({
  username: user.username ?? '',
  displayName: user.displayName ?? '',
  email: user.email ?? '',
  roleTitle: user.roleTitle ?? '',
  emojiStatus: user.emojiStatus ?? '',
  bio: user.bio ?? '',
  avatarUrl: user.avatarUrl ?? '',
});

const isDataUrl = (value: string) => value.startsWith('data:');

const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const [header, payload] = dataUrl.split(',');
  const match = /data:(.*?);base64/.exec(header);
  const mime = match?.[1] || 'application/octet-stream';
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
};

interface LogLine {
    type: 'cmd' | 'output' | 'error' | 'ascii' | 'success';
    content: string | React.ReactNode;
}

const WELCOME_MSG: LogLine[] = [
    { type: 'output', content: 'NeonOS Kernel v2.4.0-generic [x86_64]' },
    { type: 'output', content: 'Copyright (c) 2077 MultiTerm Corp.' },
    { type: 'output', content: ' ' },
    { type: 'output', content: 'Type "help" for available commands.' },
    { type: 'output', content: '---------------------------------' },
];

// --- TERMINAL ASSETS ---

const ASCII_NEOFETCH = (user: string, skills: string[]) => {
  const osName = "NeonOS (Cyberpunk 2077)";
  const host = "Neural-Link-v9";
  const kernel = "5.15.0-91-generic";
  const uptime = "99.999%";
  const pkgs = `${skills.length} (active)`;
  const shell = "zsh 5.9";
  const resolution = "4K Holographic";
  const theme = "Dracula (Dark)";
  const cpu = "Neural Quantum Core i9";
  const memory = "64GB / 128GB";
  
  // Custom Logo Art
  const art = [
    `   .:::.   `,
    `  .:::::.  `,
    ` .::(o)::. `,
    ` .:::::.::.`,
    `  ':::':::'`,
    `    ' '    `
  ];

  // Align text
  const info = [
    `${user}@${host}`,
    `------------------`,
    `OS: ${osName}`,
    `Kernel: ${kernel}`,
    `Uptime: ${uptime}`,
    `Packages: ${pkgs}`,
    `Shell: ${shell}`,
    `Resolution: ${resolution}`,
    `Theme: ${theme}`,
    `CPU: ${cpu}`,
    `Memory: ${memory}`
  ];

  // Combine Art and Info side-by-side
  let output = "\n";
  const maxLines = Math.max(art.length, info.length);
  for(let i = 0; i < maxLines; i++) {
     const artLine = art[i] || "           "; // 11 spaces
     const infoLine = info[i] || "";
     output += `  ${artLine}  ${infoLine}\n`;
  }
  return output;
};

const COW_SAY = (text: string) => {
    const len = text.length;
    const dash = '-'.repeat(len + 2);
    return `
 ${dash}
< ${text} >
 ${dash}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`;
};

const MOCK_FILES = {
    'secrets.txt': '42',
    'todo.md': '- [x] Fix bugs\n- [ ] Conquer world',
    'config.json': '{\n  "env": "production",\n  "debug": false\n}'
};

const TOP_OUTPUT = `
top - 14:05:22 up 14 days,  2:02,  1 user,  load average: 0.45, 0.60, 0.52
Tasks: 128 total,   1 running, 127 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.5 us,  1.2 sy,  0.0 ni, 96.3 id,  0.0 wa,  0.0 hi,  0.0 si
MiB Mem :  64000.0 total,  32000.0 free,  14000.0 used,  18000.0 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1337 root      20   0   8.2g   1.2g   240m S  12.4   4.2  14:20.10 neon_core
 8080 admin     20   0   4.1g   800m   120m S   5.1   1.2   4:10.05 node_server
  404 system    20   0   2.0g   400m    50m S   1.2   0.6   0:55.20 mongodb
    1 root      20   0   1.0g   100m    10m S   0.1   0.1   0:10.00 systemd
`;

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, onUpdateProfile, onUploadAvatar }) => {
  const toast = useNeoToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(() => {
    const base = toProfileForm(user);
    return { ...MOCK_USER, ...base, username: base.username || MOCK_USER.username };
  });
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [skills, setSkills] = useState<string[]>(DEFAULT_SKILLS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Terminal State
  const [termInput, setTermInput] = useState('');
  const [history, setHistory] = useState<LogLine[]>(WELCOME_MSG);
  const termEndRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);
  
  // Tech Stack Modal
  const [showIconModal, setShowIconModal] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  // Tooltip State
  const [hoveredSkill, setHoveredSkill] = useState<{name: string, def: SkillDef, rect: DOMRect} | null>(null);
  
  // Preview Data
  const [previewData, setPreviewData] = useState<UserProfile>(() => {
    const base = toProfileForm(user);
    return { ...MOCK_USER, ...base, username: base.username || MOCK_USER.username };
  });
  const displayData = isEditing ? formData : previewData;

  // --- Cropper State ---
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal
  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (isEditing) return;
    const next = toProfileForm(user);
    setFormData(prev => ({ ...prev, ...next, username: next.username || prev.username }));
    setPreviewData(prev => ({ ...prev, ...next, username: next.username || prev.username }));
  }, [user.id, user.avatarUrl, user.displayName, user.email, user.roleTitle, user.emojiStatus, user.bio, isEditing]);

  // Terminal Logic
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;

    const rawInput = termInput.trim();
    const args = rawInput.split(' ');
    const cmd = args[0].toLowerCase();
    
    const newLogs: LogLine[] = [{ type: 'cmd', content: rawInput }];

    switch (cmd) {
        case 'help':
            newLogs.push({ type: 'output', content: 'Available commands:' });
            newLogs.push({ type: 'output', content: '  whoami    - Print effective user' });
            newLogs.push({ type: 'output', content: '  neofetch  - Display system info' });
            newLogs.push({ type: 'output', content: '  ls        - List directory contents' });
            newLogs.push({ type: 'output', content: '  cat [file]- Concatenate and print files' });
            newLogs.push({ type: 'output', content: '  top       - Display Linux processes' });
            newLogs.push({ type: 'output', content: '  cowsay    - Configurable speaking cow' });
            newLogs.push({ type: 'output', content: '  clear     - Clear terminal screen' });
            break;
        case 'clear':
            setHistory([]);
            setTermInput('');
            return;
        case 'whoami':
            newLogs.push({ type: 'success', content: `User: ${displayData.username}` });
            newLogs.push({ type: 'output', content: `Role: ${displayData.roleTitle}` });
            break;
        case 'neofetch':
            newLogs.push({ type: 'ascii', content: ASCII_NEOFETCH(displayData.username, skills) });
            break;
        case 'ls':
            newLogs.push({ type: 'output', content: Object.keys(MOCK_FILES).join('   ') + '   admin_panel.exe' });
            break;
        case 'cat':
            if (args[1] && MOCK_FILES[args[1] as keyof typeof MOCK_FILES]) {
                newLogs.push({ type: 'output', content: MOCK_FILES[args[1] as keyof typeof MOCK_FILES] });
            } else if (!args[1]) {
                newLogs.push({ type: 'error', content: 'Usage: cat [filename]' });
            } else {
                newLogs.push({ type: 'error', content: `cat: ${args[1]}: No such file or directory` });
            }
            break;
        case 'top':
            newLogs.push({ type: 'ascii', content: TOP_OUTPUT.trim() });
            break;
        case 'cowsay':
            const message = args.slice(1).join(' ') || "Moo! (Try: cowsay hello)";
            newLogs.push({ type: 'ascii', content: COW_SAY(message) });
            break;
        case 'sudo':
            newLogs.push({ type: 'error', content: 'Nice try. You are already root.' });
            break;
        case 'rm':
            if (args[1] === '-rf' && args[2] === '/') {
                 newLogs.push({ type: 'error', content: 'CRITICAL: Neural link safeguards prevent self-destruction.' });
            } else {
                 newLogs.push({ type: 'error', content: 'Permission denied.' });
            }
            break;
        default:
            newLogs.push({ type: 'error', content: `Command not found: ${cmd}` });
    }

    setHistory(prev => [...prev, ...newLogs]);
    setTermInput('');
  };

  const handleSave = async () => {
    setShowSaveConfirm(false);
    try {
      let nextAvatarUrl = formData.avatarUrl?.trim() || '';

      if (nextAvatarUrl && isDataUrl(nextAvatarUrl)) {
        const file = dataUrlToFile(nextAvatarUrl, `admin-avatar-${Date.now()}.png`);
        nextAvatarUrl = await onUploadAvatar(file);
      }

      await onUpdateProfile({
        avatarUrl: nextAvatarUrl ? nextAvatarUrl : null,
        bio: formData.bio?.trim() ? formData.bio.trim() : null,
        displayName: formData.displayName?.trim() ? formData.displayName.trim() : null,
        email: formData.email?.trim() ? formData.email.trim() : null,
        roleTitle: formData.roleTitle?.trim() ? formData.roleTitle.trim() : null,
        emojiStatus: formData.emojiStatus?.trim() ? formData.emojiStatus.trim() : null,
      });

      const nextLocal = { ...formData, avatarUrl: nextAvatarUrl };
      setFormData(nextLocal);
      setPreviewData(nextLocal);
      setIsEditing(false);
      toast.success('个人资料已保存');
    } catch (err: any) {
      toast.error(err?.message ? String(err.message) : '保存失败');
    }
  };

  const confirmSensitiveAction = () => {
    setShowEditConfirm(false);
    setIsEditing(true); 
  };

  // 1. Intercept File Change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImgSrc(reader.result as string);
        setShowCropModal(true);
        setCropZoom(1);
        setCropPos({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // 2. Handle URL Parse
  const handleUrlParse = () => {
    if (!formData.avatarUrl) return;
    setIsLoadingUrl(true);
    const img = new Image();
    img.crossOrigin = 'Anonymous'; 
    img.onload = () => {
        setIsLoadingUrl(false);
        setCropImgSrc(formData.avatarUrl);
        setShowCropModal(true);
        setCropZoom(1);
        setCropPos({ x: 0, y: 0 });
    };
    img.onerror = () => {
        setIsLoadingUrl(false);
        toast.error("无法加载图片资源。请确认链接有效，且目标服务器允许跨域 (CORS) 访问。");
    };
    img.src = formData.avatarUrl;
  };

  // --- Cropper Logic ---
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

  const generateCrop = () => {
      if (!imgRef.current) return;
      const OUTPUT_SIZE = 256;
      const VISUAL_SIZE = 280;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
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
        const resultDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setFormData(prev => ({ ...prev, avatarUrl: resultDataUrl }));
        setShowCropModal(false);
      } catch (e) {
          toast.error("裁剪失败：图片资源跨域受限 (Tainted Canvas)。建议下载图片后使用本地上传。");
      }
  };

  // Add skill from modal
  const addSkill = (key: string) => {
      if (skills.includes(key)) return;
      setSkills([...skills, key]);
      setShowIconModal(false);
  };

  // Remove skill
  const removeSkill = (key: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      e.preventDefault(); 
      setSkills(skills.filter(s => s !== key));
      setHoveredSkill(null); 
  };

  const handleLinkClick = (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* --- Top Section: Profile Preview --- */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#6272a4] uppercase tracking-wider">
                {isEditing ? "实时预览" : "个人资料"}
            </h3>
            <span className="text-xs bg-danger/10 text-danger px-2 py-1 rounded border border-danger/20 font-bold">ROOT</span>
        </div>
        
        <GlassCard className={`relative overflow-hidden group transition-all duration-500 ${isEditing ? 'border-primary/50 shadow-[0_0_20px_rgba(189,147,249,0.15)]' : ''}`}>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20"></div>
          
          <div className="relative pt-12 px-4 sm:px-8 pb-4">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              
              {/* Avatar & Status */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-[#282a36] border-4 border-[#44475a] shadow-xl overflow-hidden flex items-center justify-center text-3xl select-none relative group/avatar">
                   {displayData.avatarUrl ? (
                     <img src={displayData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent font-bold">
                       {displayData.displayName?.charAt(0) || displayData.username.charAt(0)}
                     </span>
                   )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#282a36] border border-white/10 flex items-center justify-center shadow-lg text-lg animate-bounce-slow cursor-help" title="Current Vibe">
                  {displayData.emojiStatus}
                </div>
              </div>

              {/* Info Block */}
              <div className="flex-1 mt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-[#f8f8f2] tracking-tight">{displayData.displayName || displayData.username}</h2>
                  <BadgeCheck size={18} className="text-success" />
                </div>
                <p className="text-primary font-medium text-sm mb-3 font-mono">@{displayData.username} • {displayData.roleTitle}</p>
                
                <div className="p-3 bg-[#282a36]/50 rounded-xl border border-white/5 text-sm text-[#f8f8f2]/80 leading-relaxed max-w-2xl italic min-h-[3.5rem]">
                  "{displayData.bio || 'Waiting for bio...'}"
                </div>

                <div className="flex gap-4 mt-4 text-sm font-mono text-[#6272a4]">
                  <div className="flex items-center gap-1.5 hover:text-secondary transition-colors cursor-pointer">
                    <Mail size={12} /> {displayData.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* --- Bottom Section: Edit Form OR Tech/Terminal View --- */}
      <section>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#6272a4] uppercase tracking-wider">
               {isEditing ? "编辑资料" : "技能与终端"}
            </h3>
            {!isEditing && (
              <NeonButton variant="secondary" onClick={() => setIsEditing(true)} icon={<Edit3 size={14}/>} className="h-9 text-sm">
                编辑资料
              </NeonButton>
            )}
        </div>

        {isEditing ? (
            /* ================= EDIT FORM ================= */
            <GlassCard>
                {/* ... (Existing Edit Form Content) ... */}
                <div className="space-y-6 animate-fade-in">
                {/* Avatar Edit Section */}
                <div className="flex items-center gap-5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div 
                    onClick={triggerFileInput}
                    className="relative w-16 h-16 rounded-xl bg-[#0F111A] border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group hover:border-primary/50 transition-colors shadow-lg"
                    >
                        {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                        <Camera size={24} className="text-[#6272a4] group-hover:text-primary transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                        <Upload size={16} className="text-white" />
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">
                            头像源
                        </label>
                        <div className="relative group/input">
                            <input 
                                className="w-full bg-[#0F111A] text-slate-200 border border-white/[0.08] rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-primary/50 focus:bg-[#131620] focus:shadow-[0_0_0_1px_rgba(168,85,247,0.2)] transition-all placeholder-slate-600 font-mono text-base"
                                value={formData.avatarUrl || ''}
                                onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                                placeholder="https://... or paste Base64"
                            />
                            
                            <button 
                                onClick={handleUrlParse}
                                disabled={!formData.avatarUrl || isLoadingUrl}
                                className={`
                                    absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all
                                    ${formData.avatarUrl 
                                        ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:shadow-[0_0_10px_rgba(189,147,249,0.3)] cursor-pointer' 
                                        : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}
                                `}
                                title="解析链接并裁剪"
                            >
                                {isLoadingUrl ? <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" /> : <ScanLine size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                            <LinkIcon size={10} /> 
                            支持本地上传 (点击左侧) 或网络链接解析。网络图片需允许跨域访问。
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CyberInput label="登录账号" value={formData.username} disabled className="opacity-50 cursor-not-allowed border-dashed" />
                    <CyberInput label="显示名称" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} />
                    <CyberInput label="职位头衔" value={formData.roleTitle} onChange={(e) => setFormData({...formData, roleTitle: e.target.value})} />
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">状态</label>
                        <div className="flex gap-2">
                        {EMOTIONAL_TAGS.map((tag) => (
                            <button
                            key={tag.icon}
                            onClick={() => setFormData({...formData, emojiStatus: tag.icon})}
                            className={`
                                w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-all
                                ${formData.emojiStatus === tag.icon ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(189,147,249,0.3)]' : 'bg-[#44475a]/30 border-white/5 hover:bg-white/5'}
                            `}
                            >
                            {tag.icon}
                            </button>
                        ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">个人简介</label>
                    <textarea 
                    className="w-full bg-[#0F111A] text-[#f8f8f2] border border-white/[0.08] rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary/50 transition-all placeholder-[#6272a4] min-h-[150px] resize-y"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    maxLength={500}
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-danger/5 pointer-events-none rounded-xl border border-danger/10"></div>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-2 text-danger text-xs font-bold uppercase"><ShieldAlert size={12} /> 敏感数据区</div>
                        <CyberInput label="绑定邮箱" value={formData.email} disabled={!isEditing} className="border-danger/20 focus:border-danger/50" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <NeonButton variant="ghost" onClick={() => { setIsEditing(false); setFormData(previewData); }}>取消</NeonButton>
                    <NeonButton variant="primary" icon={<Save size={14} />} onClick={() => setShowSaveConfirm(true)}>保存更改</NeonButton>
                </div>
                </div>
            </GlassCard>
        ) : (
            /* ================= VIEW MODE: TECH STACK & NEURAL SHELL ================= */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Left Column: Tech Stack ONLY (Expanded) */}
                <GlassCard className="col-span-1 h-[380px] flex flex-col" noPadding>
                    <div className="p-6 pb-4 border-b border-white/5 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <Cpu size={18} className="text-secondary" />
                             <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider">技术核心</h3>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{skills.length} Loaded</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-4 relative">
                        {/* Grid of Tech Icons */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {skills.map((skillName, index) => {
                                const def = SKILL_LIBRARY[skillName];
                                const IconComponent = def ? SvgIcons[def.icon] : SvgIcons['Generic'];
                                
                                if (!def) return null;

                                return (
                                    <div
                                        key={skillName}
                                        onClick={() => handleLinkClick(def.url)}
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHoveredSkill({ name: skillName, def, rect });
                                        }}
                                        onMouseLeave={() => setHoveredSkill(null)}
                                        className={`
                                            group relative flex items-center justify-center rounded-xl border transition-all duration-300
                                            ${def.bg} ${def.border} hover:scale-105 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] cursor-pointer aspect-square
                                        `}
                                    >
                                        <button 
                                            onClick={(e) => removeSkill(skillName, e)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md transform hover:scale-110"
                                            title="移除技能"
                                        >
                                            <X size={10} strokeWidth={3} />
                                        </button>

                                        <div className={`w-1/2 h-1/2 ${def.color} transition-transform group-hover:scale-110 duration-300 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] flex items-center justify-center`}>
                                            <IconComponent className="w-full h-full" />
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <button
                                onClick={() => setShowIconModal(true)}
                                className="group relative flex items-center justify-center rounded-xl border border-dashed border-white/20 hover:border-primary/50 bg-white/5 hover:bg-primary/10 transition-all cursor-pointer aspect-square"
                            >
                                <Plus size={20} className="text-slate-500 group-hover:text-primary transition-colors" />
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* Right Column: Neural Uplink Terminal */}
                <GlassCard className="col-span-1 lg:col-span-2 h-[380px] flex flex-col relative overflow-hidden bg-[#0a0a12] border-primary/20 shadow-[0_0_30px_rgba(0,0,0,0.3)]" noPadding>
                    {/* ... Terminal content unchanged ... */}
                    {/* Terminal Scanline Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_3px,3px_100%] opacity-20" />
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0F111A] z-30 shrink-0">
                        <div className="flex items-center gap-2">
                             <Terminal size={16} className="text-emerald-500" />
                             <h3 className="text-xs font-bold text-emerald-500 font-mono tracking-wider">系统终端</h3>
                        </div>
                        <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                        </div>
                    </div>

                    {/* Console Output */}
                    <div 
                        className="flex-1 overflow-y-auto p-4 font-mono text-xs z-10 custom-scrollbar scroll-smooth"
                        onClick={() => termInputRef.current?.focus()}
                    >
                        {history.map((line, idx) => (
                            <div key={idx} className={`mb-1 break-words ${
                                line.type === 'cmd' ? 'text-slate-300 font-bold mt-3' : 
                                line.type === 'error' ? 'text-red-400' : 
                                line.type === 'success' ? 'text-emerald-400 font-bold' :
                                line.type === 'ascii' ? 'text-cyan-400 whitespace-pre leading-snug font-bold text-[10px] sm:text-xs' :
                                'text-emerald-400/90'
                            }`}>
                                {line.type === 'cmd' && <span className="text-pink-500 mr-2">➜ ~</span>}
                                {line.content}
                            </div>
                        ))}
                        <div ref={termEndRef} />
                    </div>

                    {/* Input Line */}
                    <form onSubmit={handleTerminalSubmit} className="flex items-center px-4 py-3 bg-[#0F111A] border-t border-white/10 z-30 shrink-0">
                        <span className="text-pink-500 font-mono font-bold mr-2 text-sm animate-pulse">➜</span>
                        <input 
                            ref={termInputRef}
                            type="text" 
                            className="flex-1 bg-transparent text-slate-200 font-mono text-xs focus:outline-none placeholder-slate-700"
                            placeholder="Type command... (try 'help', 'ls', 'top', 'cowsay')"
                            value={termInput}
                            onChange={(e) => setTermInput(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="opacity-0 w-0 h-0">Exec</button>
                    </form>
                </GlassCard>
            </div>
        )}
      </section>

      {/* --- FLOATING TOOLTIP (GLOBAL FIXED) --- */}
      {hoveredSkill && (
          <div 
              className="fixed z-[9999] pointer-events-none px-3 py-2 rounded-lg bg-[#1a1b26]/95 border border-white/10 shadow-xl backdrop-blur-md flex flex-col gap-0.5 animate-fade-in"
              style={{
                  top: hoveredSkill.rect.bottom + 2,
                  left: hoveredSkill.rect.left + (hoveredSkill.rect.width / 2),
                  transform: 'translate(-50%, 0)'
              }}
          >
              {/* Little Arrow (Pointing Up) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#1a1b26]/95"></div>

              <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${hoveredSkill.def.color.replace('text-', 'bg-')}`}></span>
                  <span className="text-xs font-bold text-white">{hoveredSkill.name}</span>
              </div>
              <span className="text-xs text-slate-500 font-mono pl-4">{hoveredSkill.def.category}</span>
          </div>
      )}

      {/* --- ICON SELECTOR MODAL --- */}
      {showIconModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <GlassCard className="max-w-3xl w-full flex flex-col relative border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[85vh]">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                           <Hexagon size={20} className="text-primary" />
                           <h3 className="text-lg font-bold text-white">技能库全息投影</h3>
                      </div>
                      <button onClick={() => setShowIconModal(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search technology..."
                          value={iconSearch}
                          onChange={(e) => setIconSearch(e.target.value)}
                          className="w-full bg-[#0F111A] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-primary/50 focus:outline-none"
                      />
                  </div>

                  {/* Icon Grid - Grouped */}
                  <div className="overflow-y-auto custom-scrollbar p-2 space-y-6">
                      {(['System', 'Hardware', 'Software', 'Language', 'Frontend', 'Backend', 'Database'] as SkillCategory[]).map(category => {
                          const categorySkills = Object.entries(SKILL_LIBRARY).filter(([key, val]) => 
                              val.category === category && key.toLowerCase().includes(iconSearch.toLowerCase())
                          );
                          
                          if (categorySkills.length === 0) return null;

                          return (
                              <div key={category}>
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      {category === 'System' && <Monitor size={14}/>}
                                      {category === 'Hardware' && <Cpu size={14}/>}
                                      {category === 'Software' && <PenTool size={14}/>}
                                      {category === 'Language' && <Terminal size={14}/>}
                                      {category === 'Frontend' && <Globe size={14}/>}
                                      {category === 'Backend' && <Server size={14}/>}
                                      {category === 'Database' && <Database size={14}/>}
                                      {category}
                                  </h4>
                                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                      {categorySkills.map(([key, def]) => {
                                          const Icon = SvgIcons[def.icon];
                                          const isActive = skills.includes(key);
                                          return (
                                              <button 
                                                  key={key}
                                                  onClick={() => addSkill(key)}
                                                  disabled={isActive}
                                                  className={`
                                                      flex flex-col items-center gap-2 p-2 rounded-xl border transition-all
                                                      ${isActive 
                                                          ? 'bg-primary/20 border-primary/50 opacity-50 cursor-not-allowed grayscale' 
                                                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 hover:scale-105'}
                                                  `}
                                                  title={key}
                                              >
                                                  <div className={`w-6 h-6 ${def.color}`}><Icon /></div>
                                                  <span className="text-[9px] text-slate-400 font-mono truncate w-full text-center">{key}</span>
                                              </button>
                                          );
                                      })}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </GlassCard>
          </div>
      )}

      {/* --- CROPPER MODAL (Unchanged) --- */}
      {showCropModal && cropImgSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <GlassCard className="max-w-lg w-full flex flex-col items-center relative border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               
               <div className="w-full flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <Crop size={18} className="text-primary"/> 头像裁剪
                  </h3>
                  <button onClick={() => setShowCropModal(false)} className="text-slate-500 hover:text-white transition-colors">
                     <X size={20} />
                  </button>
               </div>

               {/* Crop Area - SQUARE UI */}
               <div 
                  className="
                    relative w-[280px] h-[280px] bg-[#0F111A] 
                    border-2 border-primary 
                    shadow-[0_0_30px_rgba(189,147,249,0.15)]
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
                          alt="Crop Target" 
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
                      <div className="bg-black/60 px-3 py-1.5 rounded-full text-xs text-white backdrop-blur-sm border border-primary/30 flex items-center gap-1 shadow-lg">
                          <Maximize size={10} className="text-primary"/> 拖拽移动
                      </div>
                  </div>
               </div>
               
               <p className="text-xs text-slate-500 font-mono mt-4 mb-4 text-center">
                  * 框内可视区域即为最终结果。虚线圆环仅作头像展示参考。<br/>
                  输出尺寸: <span className="text-primary font-bold">256x256 JPEG</span>
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
                           <NeonButton variant="primary" icon={<Crop size={14} />} onClick={generateCrop}>确认裁剪</NeonButton>
                       </div>
                  </div>
               </div>
           </GlassCard>
        </div>
      )}

      {/* Confirmation Modal: Sensitive Edit */}
      <ConfirmModal
          isOpen={showEditConfirm}
          onClose={() => setShowEditConfirm(false)}
          onConfirm={confirmSensitiveAction}
          title="安全警告"
          message="您正在尝试修改核心身份信息，这可能触发安全审计。确认继续吗？"
          type="danger"
          confirmText="确认修改"
      />

      {/* Confirmation Modal: Save Changes */}
      <ConfirmModal 
          isOpen={showSaveConfirm}
          onClose={() => setShowSaveConfirm(false)}
          onConfirm={handleSave}
          title="保存个人资料"
          message="确认更新您的个人资料信息？这些更改将立即在公开页面生效。"
          type="primary"
          confirmText="保存更改"
      />

    </div>
  );
};
