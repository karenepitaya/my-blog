import React from 'react';
import { Search, Palette, Github, Twitter, Globe, ArrowUpRight, BookOpen, Heart, Layers, Mail, Share2, Code2, Copy } from 'lucide-react';

// --- Theme Constants (Rose Pine Moon) ---
const THEME = {
  bg: '#191724',       // Base Background
  cardBg: '#1f1d2e',   // Surface
  cardBorder: '#26233a', // Highlight Low
  accent: '#c4a7e7',   // Iris (Purple)
  accentHover: '#ebbcba', // Rose
  textMain: '#e0def4', // Text
  textMuted: '#908caa',// Subtle
  pillBg: '#2a273f',   // Overlay
  pillBorder: 'rgba(121, 116, 156, 0.2)',
};

// --- Extended Data Interface for this specific theme ---
type RosePineSocial = { platform: string; url: string };

interface RosePineAuthor {
  name: string;
  handle: string;
  role: string;
  bio: string;
  motto: string;
  email: string;
  avatar: string;
  skills: string[];
  socials: RosePineSocial[];
  stats: {
    commits: number;
    projects: number;
    coffee: number;
    uptime: string;
    articles: number;
    categories: number;
    likes: string;
  };
  latestLog: string;
}

const AUTHOR_DATA: RosePineAuthor = {
  name: "Karene",
  handle: "karene_log",
  role: "Visual Engineer",
  bio: "Designing with code, painting with pixels.", // Fallback bio
  motto: "Code is poetry written for machines to dream. Exploring the void between design and logic.",
  email: "hello@karene.dev",
  avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Karene&backgroundColor=c4a7e7",
  skills: ["React", "TypeScript", "Astro", "WebGL", "Tailwind"],
  socials: [
    { platform: "Github", url: "#" },
    { platform: "Twitter", url: "#" }
  ],
  stats: { 
    commits: 2340, projects: 15, coffee: 800, uptime: "Active",
    articles: 42, categories: 8, likes: "1.2k"
  },
  latestLog: "Refactoring the soul of the website."
};

const AUTHOR_DATA_2: RosePineAuthor = {
    name: "Zero",
    handle: "zero_dev",
    role: "System Arch",
    bio: "Optimizing the void.",
    motto: "Simplicity is the ultimate sophistication in a complex world.",
    email: "root@zero.sh",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Zero&backgroundColor=9ccfd8",
    skills: ["Rust", "Go"],
    socials: [{ platform: "Github", url: "#" }],
    stats: { 
        commits: 6666, projects: 42, coffee: 1024, uptime: "Idle",
        articles: 128, categories: 14, likes: "4.5k"
    },
    latestLog: "Kernel compilation finished."
};

// --- Shared Styles ---
const cardBase = `bg-[#1f1d2e] border border-[#26233a] rounded-2xl overflow-hidden transition-all duration-300`;
const pillBase = `px-3 py-1 rounded-full text-xs font-medium border border-[#26233a] bg-[#2a273f] text-[#908caa] flex items-center gap-2`;
const iconBtn = `p-2 rounded-lg bg-[#2a273f] text-[#908caa] hover:text-[#c4a7e7] hover:bg-[#26233a] transition-colors border border-transparent hover:border-[#c4a7e7]/30`;
const labelStyle = `text-[10px] uppercase tracking-[0.2em] font-bold text-[#eb6f92] mb-3 block`;


// --- 1. LARGE CARD (Banner Style) ---
// Layout: Split Grid. Left: Identity & Tech. Right: Stats & Contact.
const AuthorCardLarge: React.FC<{ author: RosePineAuthor }> = ({ author }) => {
  return (
    <div className={`${cardBase} w-full p-0 flex flex-col md:flex-row group hover:shadow-xl hover:shadow-[#c4a7e7]/5 hover:border-[#c4a7e7]/30`}>
        
        {/* Left Section: Identity & Skills (60%) */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#26233a]">
            <span className={labelStyle}>Author Profile</span>
            
            <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 shrink-0 rounded-full p-1 border border-[#c4a7e7]/20 bg-[#26233a]">
                    <img src={author.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold text-[#e0def4] tracking-tight">{author.name}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#c4a7e7]/10 text-[#c4a7e7] border border-[#c4a7e7]/20">
                            {author.role}
                        </span>
                    </div>
                    <p className="text-[#908caa] text-sm leading-relaxed max-w-md italic mb-1">
                        "{author.motto}"
                    </p>
                    <a href={`mailto:${author.email}`} className="text-xs text-[#ebbcba] hover:underline decoration-dashed underline-offset-4 flex items-center gap-1 mt-2">
                        <Mail size={12} /> {author.email}
                    </a>
                </div>
            </div>

            {/* Tech Stack */}
            <div>
                <span className="text-[10px] text-[#908caa]/60 uppercase tracking-widest mb-3 block">Tech Stack</span>
                <div className="flex flex-wrap gap-2">
                    {author.skills.map(skill => (
                        <span key={skill} className={`${pillBase} hover:border-[#c4a7e7]/50 hover:text-[#e0def4] cursor-default transition-colors`}>
                            <Code2 size={12} /> {skill}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Section: Stats & Contact (40%) */}
        <div className="md:w-80 bg-[#191724]/30 p-8 flex flex-col justify-between">
             
             {/* Stats Grid */}
             <div className="space-y-4">
                 <span className="text-[10px] text-[#908caa]/60 uppercase tracking-widest block">Contributions</span>
                 <div className="grid grid-cols-2 gap-3">
                     <div className="bg-[#2a273f]/50 p-3 rounded-xl border border-[#26233a] flex flex-col items-center justify-center text-center">
                         <BookOpen size={16} className="text-[#c4a7e7] mb-1"/>
                         <span className="text-lg font-bold text-[#e0def4]">{author.stats.articles}</span>
                         <span className="text-[10px] text-[#908caa]">Articles</span>
                     </div>
                     <div className="bg-[#2a273f]/50 p-3 rounded-xl border border-[#26233a] flex flex-col items-center justify-center text-center">
                         <Layers size={16} className="text-[#9ccfd8] mb-1"/>
                         <span className="text-lg font-bold text-[#e0def4]">{author.stats.categories}</span>
                         <span className="text-[10px] text-[#908caa]">Cats</span>
                     </div>
                     <div className="col-span-2 bg-[#2a273f]/50 p-3 rounded-xl border border-[#26233a] flex items-center justify-between px-6">
                         <div className="flex items-center gap-2">
                            <Heart size={16} className="text-[#eb6f92]"/>
                            <span className="text-[10px] text-[#908caa]">Appreciations</span>
                         </div>
                         <span className="text-lg font-bold text-[#e0def4]">{author.stats.likes}</span>
                     </div>
                 </div>
             </div>

             {/* Actions */}
             <div className="mt-8 pt-6 border-t border-[#26233a]">
                 <div className="flex gap-2 justify-end">
                     <button className={`${iconBtn} w-full flex items-center justify-center gap-2 text-xs font-bold bg-[#c4a7e7] text-[#1f1d2e] hover:bg-[#c4a7e7]/90 hover:text-[#1f1d2e]`}>
                        <Mail size={14} /> Contact Me
                     </button>
                     {author.socials.map(s => (
                         <a key={s.platform} href={s.url} className={iconBtn}>
                             {s.platform === 'Github' ? <Github size={16} /> : <Twitter size={16} />}
                         </a>
                     ))}
                 </div>
             </div>
        </div>
    </div>
  );
};


// --- 2. MEDIUM CARD (List/Grid Style) ---
// Layout: Vertical. No Tech Stack. Compact Stats.
const AuthorCardMedium: React.FC<{ author: RosePineAuthor }> = ({ author }) => {
    return (
        <div className={`${cardBase} p-6 flex flex-col h-full hover:-translate-y-1 hover:border-[#c4a7e7]/40 hover:shadow-xl hover:shadow-[#c4a7e7]/5`}>
            
            {/* Header: Identity */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-[#26233a] bg-[#2a273f] p-0.5">
                        <img src={author.avatar} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#e0def4]">{author.name}</h3>
                        <span className="text-xs text-[#c4a7e7] font-mono mb-1 block">{author.role}</span>
                        <a href={`mailto:${author.email}`} className="text-[10px] text-[#908caa] hover:text-[#e0def4] flex items-center gap-1">
                           <Mail size={10} /> {author.email}
                        </a>
                    </div>
                </div>
                
                {/* Socials (Top Right) */}
                <div className="flex gap-1">
                    {author.socials.slice(0, 2).map(s => (
                        <a key={s.platform} href={s.url} className="p-1.5 rounded-md hover:bg-[#2a273f] text-[#908caa] hover:text-[#e0def4] transition-colors">
                            {s.platform === 'Github' ? <Github size={14} /> : <Twitter size={14} />}
                        </a>
                    ))}
                </div>
            </div>

            {/* Body: Motto */}
            <div className="mb-6 flex-1">
                <p className="text-sm text-[#908caa] leading-relaxed italic border-l-2 border-[#26233a] pl-3">
                    "{author.motto}"
                </p>
            </div>

            {/* Footer: Stats Row & Contact */}
            <div className="pt-4 border-t border-[#26233a]">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-4 text-[#908caa]">
                        <div className="flex items-center gap-1.5" title="Articles">
                            <BookOpen size={14} className="text-[#c4a7e7]"/> 
                            <span className="font-mono text-[#e0def4]">{author.stats.articles}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Categories">
                            <Layers size={14} className="text-[#9ccfd8]"/> 
                            <span className="font-mono text-[#e0def4]">{author.stats.categories}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Likes">
                            <Heart size={14} className="text-[#eb6f92]"/> 
                            <span className="font-mono text-[#e0def4]">{author.stats.likes}</span>
                        </div>
                    </div>
                    
                    <button className="flex items-center gap-1.5 text-[#c4a7e7] hover:text-[#ebbcba] transition-colors font-bold text-[10px] uppercase tracking-wider">
                        <Share2 size={12} /> Connect
                    </button>
                </div>
            </div>

        </div>
    );
};


// --- 3. LITE CARD (Footer/Compact Style) ---
// Layout: Horizontal Bar. Truncated Motto.
const AuthorCardLite: React.FC<{ author: RosePineAuthor }> = ({ author }) => {
    // Truncate function
    const truncate = (str: string, words: number) => {
        return str.split(" ").slice(0, words).join(" ") + "...";
    };

    return (
        <div className={`${cardBase} w-full max-w-3xl p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 hover:border-[#c4a7e7]/30`}>
            
            {/* Left: Identity */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full border border-[#26233a] bg-[#2a273f] p-0.5">
                    <img src={author.avatar} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-base font-bold text-[#e0def4]">{author.name}</h3>
                    <a href={`mailto:${author.email}`} className="text-[10px] text-[#908caa] hover:text-[#c4a7e7] transition-colors truncate max-w-[120px]">
                        {author.email}
                    </a>
                </div>
            </div>

            {/* Middle: Motto (Truncated) & Label */}
            <div className="flex-1 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-[#26233a] pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                 <div className="text-[9px] text-[#908caa]/50 uppercase tracking-widest font-bold mb-1">Author Bio</div>
                 <p className="text-xs text-[#908caa] italic">
                    "{truncate(author.motto, 10)}"
                 </p>
            </div>

            {/* Right: Stats Pill */}
            <div className="flex items-center gap-4 shrink-0 bg-[#2a273f]/50 px-4 py-2 rounded-full border border-[#26233a] sm:ml-auto">
                <div className="flex items-center gap-1.5 text-[10px]">
                    <BookOpen size={12} className="text-[#c4a7e7]"/> 
                    <span className="text-[#e0def4] font-mono">{author.stats.articles}</span>
                </div>
                <div className="w-px h-3 bg-[#26233a]"></div>
                <div className="flex items-center gap-1.5 text-[10px]">
                    <Layers size={12} className="text-[#9ccfd8]"/> 
                    <span className="text-[#e0def4] font-mono">{author.stats.categories}</span>
                </div>
                <div className="w-px h-3 bg-[#26233a]"></div>
                <div className="flex items-center gap-1.5 text-[10px]">
                    <Heart size={12} className="text-[#eb6f92]"/> 
                    <span className="text-[#e0def4] font-mono">{author.stats.likes}</span>
                </div>
            </div>

        </div>
    );
};


export const BlogThemeDesign: React.FC = () => {
  return (
    <div className="min-h-screen w-full font-sans flex flex-col pb-12 transition-colors duration-300" style={{ backgroundColor: THEME.bg }}>
      
      {/* --- HEADER --- */}
      <header className="w-full max-w-4xl mx-auto pt-12 px-6 mb-12">
         <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg w-full max-w-md" style={{ backgroundColor: THEME.cardBg }}>
                <div className="px-3 py-1 rounded-md text-sm font-bold shadow-lg" style={{ backgroundColor: THEME.accent, color: '#191724' }}>
                    Karene's Blog
                </div>
                <div className="flex-1"></div>
                <Search size={18} className="text-[#908caa] cursor-pointer hover:text-white" />
                <Palette size={18} className="text-[#908caa] cursor-pointer hover:text-white" />
            </div>
         </div>
      </header>

      {/* --- MAIN DEMO CONTENT --- */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 flex flex-col gap-20">
        
        {/* SECTION 1: Banner Card (Large) */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#908caa] text-xs font-mono uppercase tracking-widest pl-2 border-l-2 border-[#c4a7e7]">
                Variant 1: Author Banner (Large)
            </div>
            <AuthorCardLarge author={AUTHOR_DATA} />
        </section>


        {/* SECTION 2: Grid Cards (Medium) */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#908caa] text-xs font-mono uppercase tracking-widest pl-2 border-l-2 border-[#9ccfd8]">
                Variant 2: Authors List (Medium)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AuthorCardMedium author={AUTHOR_DATA} />
                <AuthorCardMedium author={AUTHOR_DATA_2} />
            </div>
        </section>


        {/* SECTION 3: Footer Card (Lite) */}
        <section className="space-y-4">
             <div className="flex items-center gap-2 text-[#908caa] text-xs font-mono uppercase tracking-widest pl-2 border-l-2 border-[#eb6f92]">
                Variant 3: Footer Signature (Lite)
            </div>
            <AuthorCardLite author={AUTHOR_DATA} />
        </section>

      </main>

      {/* --- SITE FOOTER --- */}
      <footer className="mt-24 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col items-center gap-6 text-[#908caa]">
         <div className="flex items-center gap-8 opacity-60">
            <Github size={20} className="hover:text-white cursor-pointer" />
            <Twitter size={20} className="hover:text-white cursor-pointer" />
            <Globe size={20} className="hover:text-white cursor-pointer" />
         </div>
         <div className="text-xs font-mono opacity-40">
            © 2025 Rose Pine Design System
         </div>
      </footer>

    </div>
  );
};
