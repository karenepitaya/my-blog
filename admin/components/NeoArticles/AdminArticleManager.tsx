import React from 'react';

import { AdminArticleTable } from './components/AdminArticleTable';

export const AdminArticleManager: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-white tracking-tight">
            文章管理 (Admin)
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            管理全站文章信息：管理员备注、下架（占位）、删除。
          </p>
        </div>
      </div>

      <AdminArticleTable />
    </div>
  );
};
