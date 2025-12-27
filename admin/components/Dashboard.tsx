
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleStatus, Article, User, UserRole, UserStatus } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';

interface DashboardProps {
  user: User;
  articles: Article[];
  users: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, articles, users }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const navigate = useNavigate();
  
  const myArticles = articles.filter(a => a.authorId === user.id);
  const totalArticles = isAdmin ? articles.length : myArticles.length;
  const publishedCount = (isAdmin ? articles : myArticles).filter(a => a.status === ArticleStatus.PUBLISHED).length;
  const totalViews = (isAdmin ? articles : myArticles).reduce((sum, a) => sum + a.views, 0);
  
  const totalAuthors = users.filter(u => u.role === UserRole.AUTHOR && u.status === UserStatus.ACTIVE).length; 

  // 使用 CSS 变量实现动态光晕颜色
  const StatCard = ({ label, value, subValue, colorClass, shadowColor, onClick, icon: Icon }: { 
    label: string; 
    value: React.ReactNode; 
    subValue?: string;
    colorClass: string; 
    shadowColor: string;
    onClick?: () => void;
    icon?: React.FC;
  }) => (
    <div 
      onClick={onClick}
      style={{ '--card-glow': shadowColor } as React.CSSProperties}
      className={`
        bg-[#21222c] border border-[#44475a] p-6 lg:p-8 rounded-xl relative overflow-hidden group transition-all duration-300
        ${onClick 
          ? 'cursor-pointer hover:border-[var(--card-glow)]/50 hover:bg-[#2a2d37] hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_var(--card-glow)]' 
          : ''}
      `}
    >
      <div className={`absolute top-0 right-0 w-36 h-36 -mr-10 -mt-10 opacity-10 rounded-full ${colorClass} blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-xs lg:text-sm text-[#6272a4] tracking-[0.15em] font-black uppercase group-hover:text-[#f8f8f2] transition-colors">{label}</p>
        {Icon && <div className="text-[#6272a4] group-hover:text-[var(--card-glow)] transition-colors scale-125 duration-300"><Icon /></div>}
      </div>
      <div className="flex items-baseline gap-3 relative z-10">
        <p className="text-4xl lg:text-5xl font-black font-mono tracking-tighter drop-shadow-lg" style={{ color: shadowColor }}>{value}</p>
        {subValue && <p className="text-sm lg:text-base text-[#6272a4] font-mono opacity-80 font-bold group-hover:text-[#f8f8f2] transition-colors">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="控制台总览" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <StatCard 
          label="内容资产管理" 
          value={totalArticles} 
          subValue={`/ ${publishedCount} 已发布`}
          colorClass="bg-[#bd93f9]" 
          shadowColor="#bd93f9"
          icon={Icons.Articles}
          onClick={() => navigate('/articles')}
        />
        <StatCard 
          label="累计访问阅读" 
          value={totalViews.toLocaleString()} 
          colorClass="bg-[#ff79c6]" 
          shadowColor="#ff79c6"
          icon={Icons.Stats}
          onClick={() => navigate('/stats')}
        />
        
        {isAdmin ? (
          <StatCard 
            label="系统作者总数" 
            value={totalAuthors} 
            subValue="活跃创作者"
            colorClass="bg-[#50fa7b]" 
            shadowColor="#50fa7b"
            icon={Icons.Users}
            onClick={() => navigate('/users')}
          />
        ) : (
          <div 
            onClick={() => navigate('/articles?action=new')}
            className="bg-[#21222c] border border-[#bd93f9]/30 p-6 lg:p-8 rounded-xl relative overflow-hidden group transition-all duration-300 cursor-pointer hover:border-[#bd93f9] hover:bg-[#2a2d37] hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_#bd93f9] flex flex-col justify-center min-h-[140px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#bd93f9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#bd93f9]/10 flex items-center justify-center text-[#bd93f9] border border-[#bd93f9]/20 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_15px_#bd93f9]">
                <Icons.Plus />
              </div>
              <div>
                <p className="text-xs font-black text-[#bd93f9] uppercase tracking-widest group-hover:text-[#f8f8f2] transition-colors">启动在线写作序列</p>
                <p className="text-[9px] text-[#6272a4] font-mono mt-1 uppercase italic tracking-tighter opacity-60">Initiate_Writing_Sequence_</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mt-10 lg:mt-12">
        <section className="bg-[#21222c] border border-[#44475a] rounded-xl p-6 lg:p-8 shadow-xl flex flex-col h-full hover:border-[#6272a4] transition-colors duration-300">
          <h3 className="text-xs lg:text-sm font-black text-[#f8f8f2] mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
            <span className="w-2 h-2 bg-[#bd93f9] rounded-full shadow-[0_0_8px_#bd93f9] animate-pulse" />
            最近活动日志 / RECENT_LOGS
          </h3>
          <div className="space-y-5 flex-1">
            {(isAdmin ? articles : myArticles).length === 0 ? (
              <div className="h-full flex items-center justify-center py-12">
                <p className="text-xs text-[#6272a4] font-mono italic uppercase tracking-widest">待命状态 (STANDBY_MODE)_</p>
              </div>
            ) : (
              (isAdmin ? articles : myArticles).slice(0, 5).map(article => (
                <div key={article.id} className="flex justify-between items-center py-4 border-b border-[#44475a]/40 last:border-0 group cursor-pointer hover:bg-[#44475a]/10 px-2 -mx-2 rounded-lg transition-colors">
                  <div className="overflow-hidden pr-4">
                    <p className="text-sm lg:text-base font-bold text-[#f8f8f2] group-hover:text-[#bd93f9] transition-colors truncate leading-tight">{article.title}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] lg:text-xs text-[#6272a4] font-mono uppercase font-bold tracking-tight">
                        {article.updatedAt.split('T')[0]}
                      </p>
                      <span className={`text-[9px] lg:text-[10px] px-2 py-0.5 rounded border font-black uppercase tracking-tighter ${article.status === ArticleStatus.PUBLISHED ? 'text-[#50fa7b] border-[#50fa7b]/20 bg-[#50fa7b]/5' : 'text-[#f1fa8c] border-[#f1fa8c]/20 bg-[#f1fa8c]/5'}`}>
                        {article.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] lg:text-xs font-mono text-[#6272a4] bg-[#282a36] px-3 py-2 rounded border border-[#44475a] shrink-0 group-hover:border-[#bd93f9]/50 group-hover:text-[#bd93f9] group-hover:shadow-[0_0_10px_rgba(189,147,249,0.2)] transition-all font-bold">
                    READS: {article.views}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-[#21222c] border border-[#44475a] rounded-xl p-6 lg:p-8 shadow-xl flex flex-col h-full hover:border-[#6272a4] transition-colors duration-300">
          <h3 className="text-xs lg:text-sm font-black text-[#f8f8f2] mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
            <span className="w-2 h-2 bg-[#8be9fd] rounded-full shadow-[0_0_8px_#8be9fd] animate-pulse" />
            核心负载状态 / CORE_LOAD
          </h3>
          <div className="flex-1 bg-[#282a36] border border-[#44475a] rounded-lg relative overflow-hidden flex flex-col p-6 lg:p-8 min-h-[240px] shadow-inner group">
             <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#bd93f9 1px, transparent 0)', backgroundSize: '24px 24px'}} />
             {/* 模拟波形动画 */}
             <div className="flex-1 flex items-end justify-between gap-1.5 mb-10 px-1 relative z-10">
                {[30, 65, 45, 85, 55, 75, 35, 55, 95, 45, 70, 45, 85, 40].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-[#44475a]/20 border-t border-[#bd93f9]/10 rounded-t-sm transition-all duration-500 hover:bg-[#bd93f9]/40 hover:border-[#bd93f9]/60 hover:shadow-[0_0_10px_#bd93f9]" 
                    style={{
                      height: `${h}%`, 
                      animation: `pulseHeight 2s infinite ${i * 0.1}s alternate`
                    }} 
                  />
                ))}
                <style>{`
                  @keyframes pulseHeight {
                    0% { transform: scaleY(1); opacity: 0.5; }
                    100% { transform: scaleY(1.1); opacity: 0.8; }
                  }
                `}</style>
             </div>
             <div className="flex justify-between items-center border-t border-[#44475a] pt-6 relative z-10">
               <div className="flex gap-6 lg:gap-8">
                 <div className="flex flex-col group/item">
                    <span className="text-[10px] lg:text-xs text-[#6272a4] uppercase font-black tracking-[0.15em] mb-1 group-hover/item:text-[#50fa7b] transition-colors">CPU_LOAD</span>
                    <span className="text-sm lg:text-base font-mono text-[#50fa7b] font-bold shadow-green-glow">12.4%</span>
                 </div>
                 <div className="flex flex-col group/item">
                    <span className="text-[10px] lg:text-xs text-[#6272a4] uppercase font-black tracking-[0.15em] mb-1 group-hover/item:text-[#8be9fd] transition-colors">MEM_USAGE</span>
                    <span className="text-sm lg:text-base font-mono text-[#8be9fd] font-bold">440.1MB</span>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[10px] lg:text-xs font-mono text-[#6272a4] uppercase font-bold tracking-widest">System_Uptime</p>
                 <p className="text-xs lg:text-sm font-mono text-[#f8f8f2] italic font-bold">14D_02H_55M</p>
               </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
