
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleStatus, Article, User, UserRole, UserStatus } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import { Card } from './ui/Card';

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

  const getStatusLabel = (status: ArticleStatus) => {
    switch (status) {
      case ArticleStatus.PUBLISHED:
        return '已发布';
      case ArticleStatus.DRAFT:
        return '草稿';
      case ArticleStatus.EDITING:
        return '编辑中';
      case ArticleStatus.PENDING_DELETE:
        return '待删除';
      default:
        return status;
    }
  };

  const StatCard = ({ label, value, subValue, tone, onClick, icon: Icon }: { 
    label: string; 
    value: React.ReactNode; 
    subValue?: string;
    tone: 'primary' | 'accent' | 'success' | 'secondary';
    onClick?: () => void;
    icon?: React.FC;
  }) => (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border border-fg/12 bg-fg/6 p-6 lg:p-8 relative overflow-hidden group transition-colors duration-200
        ${onClick ? 'cursor-pointer hover:bg-fg/8 hover:border-primary/25' : ''}
      `}
    >
      <div
        className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${
          tone === 'primary'
            ? 'bg-primary'
            : tone === 'accent'
              ? 'bg-accent'
              : tone === 'success'
                ? 'bg-success'
                : 'bg-secondary'
        }`}
      />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-sm text-muted font-semibold">{label}</p>
        {Icon && <div className="text-muted group-hover:text-fg transition-colors"><Icon /></div>}
      </div>
      <div className="flex items-baseline gap-3 relative z-10">
        <p className="text-4xl lg:text-5xl font-semibold font-mono tracking-tight text-fg">{value}</p>
        {subValue && <p className="text-sm text-muted font-mono">{subValue}</p>}
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
          tone="primary"
          icon={Icons.Articles}
          onClick={() => navigate(user.role === UserRole.ADMIN ? '/admin/articles' : '/articles')}
        />
        <StatCard 
          label="累计访问阅读" 
          value={totalViews.toLocaleString()} 
          tone="accent"
          icon={Icons.Stats}
          onClick={() => navigate('/stats')}
        />
        
        {isAdmin ? (
          <StatCard 
            label="系统作者总数" 
            value={totalAuthors} 
            subValue="活跃创作者"
            tone="success"
            icon={Icons.Users}
            onClick={() => navigate('/users')}
          />
        ) : (
          <div 
            onClick={() => navigate('/articles?action=new')}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-6 lg:p-8 relative overflow-hidden group transition-colors duration-200 cursor-pointer hover:bg-primary/8 hover:border-primary/30 flex flex-col justify-center min-h-[140px]"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-fg/6 border border-fg/12 flex items-center justify-center text-primary">
                <Icons.Plus />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-fg">新建文章</p>
                <p className="text-sm text-muted mt-1">快速开启写作</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mt-10 lg:mt-12">
        <section>
          <Card className="h-full" padded>
          <h3 className="text-base font-semibold text-fg mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full" />
            最近动态
          </h3>
          <div className="space-y-5 flex-1">
            {(isAdmin ? articles : myArticles).length === 0 ? (
              <div className="h-full flex items-center justify-center py-12">
                <p className="text-sm text-muted">暂无内容</p>
              </div>
            ) : (
              (isAdmin ? articles : myArticles).slice(0, 5).map(article => (
                <div key={article.id} className="flex justify-between items-center py-4 border-b border-fg/10 last:border-0 group cursor-pointer hover:bg-fg/5 px-2 -mx-2 rounded-lg transition-colors">
                  <div className="overflow-hidden pr-4">
                    <p className="text-sm lg:text-base font-semibold text-fg truncate leading-tight">{article.title}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[12px] text-muted font-mono">
                        {article.updatedAt.split('T')[0]}
                      </p>
                      <span className={`text-[12px] px-2 py-0.5 rounded-lg border font-semibold ${article.status === ArticleStatus.PUBLISHED ? 'text-success border-success/20 bg-success/10' : 'text-warning border-warning/20 bg-warning/10'}`}>
                        {getStatusLabel(article.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[12px] font-mono text-muted bg-fg/5 px-3 py-2 rounded-lg border border-fg/10 shrink-0 transition-colors">
                    阅读 {article.views}
                  </div>
                </div>
              ))
            )}
          </div>
          </Card>
        </section>

        <section>
          <Card className="h-full" padded>
          <h3 className="text-base font-semibold text-fg mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary rounded-full" />
            核心负载
          </h3>
          <div className="rounded-xl border border-fg/10 bg-fg/4 p-5 lg:p-6 shadow-inner">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-fg/10 bg-fg/4 p-4">
                <div className="text-xs text-muted">CPU</div>
                <div className="mt-2 text-2xl font-mono font-semibold text-success">12.4%</div>
              </div>
              <div className="rounded-xl border border-fg/10 bg-fg/4 p-4">
                <div className="text-xs text-muted">内存</div>
                <div className="mt-2 text-2xl font-mono font-semibold text-secondary">440.1MB</div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-fg/10 pt-4">
              <div className="text-xs text-muted">运行时长</div>
              <div className="text-sm font-mono text-fg">14天 02:55</div>
            </div>
          </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
