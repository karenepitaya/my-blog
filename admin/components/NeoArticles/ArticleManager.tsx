
import React from 'react';
import { Plus } from 'lucide-react';
import { NeonButton } from '../NeoShared/ui/NeonButton';
import { useNeoAdminRuntime } from '../NeoShared/runtime/NeoAdminRuntimeContext';
import { ArticleTable } from './components/ArticleTable';

export const ArticleManager: React.FC = () => {
    const runtime = useNeoAdminRuntime();
    return (
        <div className="animate-fade-in space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-white tracking-tight">
                        文章管理 (Articles)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 max-w-lg">
                        管理您的所有文章内容，支持快速筛选、编辑与发布状态管理。
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-secondary/20 blur-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <NeonButton variant="secondary" icon={<Plus size={16}/>} className="relative z-10 px-6" onClick={() => runtime.openEditorRoute()}>
                            撰写新文章
                        </NeonButton>
                    </div>
                </div>
            </div>

            <ArticleTable />
        </div>
    );
};
