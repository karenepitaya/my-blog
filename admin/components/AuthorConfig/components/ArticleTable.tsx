import React, { useState } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Article } from '../types';
import { Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { NeonButton } from './ui/NeonButton';

const mockArticles: Article[] = [
  { id: '1', title: 'Getting Started with Next.js 14', author: 'Karene', status: 'published', category: 'Frontend', views: 1205, date: '2024-03-10' },
  { id: '2', title: 'The Future of AI in Web Development', author: 'System', status: 'draft', category: 'AI', views: 0, date: '2024-03-12' },
  { id: '3', title: 'Understanding Rust Ownership', author: 'Karene', status: 'published', category: 'Backend', views: 890, date: '2024-03-08' },
  { id: '4', title: 'CSS Grid vs Flexbox: A Guide', author: 'Karene', status: 'archived', category: 'Frontend', views: 3400, date: '2024-02-28' },
  { id: '5', title: 'Dockerizing your React App', author: 'DevOpsBot', status: 'published', category: 'DevOps', views: 560, date: '2024-03-01' },
];

export const ArticleTable: React.FC = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search titles, slugs, or IDs..." 
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['all', 'published', 'draft', 'trash'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide transition-all border
                ${filter === f 
                  ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'}
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <GlassCard noPadding className="min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs font-mono text-slate-500 uppercase tracking-wider">
                <th className="p-5 font-medium">Title</th>
                <th className="p-5 font-medium">Author</th>
                <th className="p-5 font-medium">Status</th>
                <th className="p-5 font-medium">Category</th>
                <th className="p-5 font-medium text-right">Views</th>
                <th className="p-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockArticles.map((article) => (
                <tr key={article.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200 group-hover:text-primary transition-colors cursor-pointer">{article.title}</span>
                      <span className="text-xs text-slate-500 mt-1 font-mono">{article.date}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white">
                        {article.author.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-400">{article.author}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border
                      ${article.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        article.status === 'draft' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        article.status === 'published' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 
                        article.status === 'draft' ? 'bg-amber-400' : 'bg-slate-400'
                      }`}></span>
                      {article.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="text-xs text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-2 py-1 rounded">
                      #{article.category}
                    </span>
                  </td>
                  <td className="p-5 text-right font-mono text-sm text-slate-400">
                    {article.views.toLocaleString()}
                  </td>
                  <td className="p-5">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Preview">
                        <ExternalLink size={14} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty State / Pagination Footer */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
          <span>Showing 1-5 of 24 items</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 rounded hover:bg-white/5 bg-white/5 text-white">1</button>
            <button className="px-3 py-1 rounded hover:bg-white/5">2</button>
            <button className="px-3 py-1 rounded hover:bg-white/5">Next</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};