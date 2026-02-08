import React, { useEffect, useMemo, useState } from 'react';
import { ModelTab as AdminModelTab } from '../settings/ModelTab';
import { VENDORS } from '../../data/aiVendors';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Bot, Save, Edit3, Zap, ShieldCheck, Quote } from 'lucide-react';
import { AIVendor } from '../../types';
import { DEFAULT_AI_SYSTEM_PROMPT } from '../../../../constants';

interface AuthorModelTabProps {
    config?: {
        vendorId?: string;
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        prompt?: string;
    };
    onUpdateAiConfig: (input: {
        vendorId?: string | null;
        apiKey?: string | null;
        baseUrl?: string | null;
        model?: string | null;
        prompt?: string | null;
    }) => Promise<void>;
    onFetchAiModels: (input: {
        vendorId?: string | null;
        apiKey?: string | null;
        baseUrl?: string | null;
    }) => Promise<{ models: string[]; latencyMs: number }>;
}

const inferVendorFromBaseUrl = (value?: string) => {
    if (!value) return undefined;
    const lowered = value.toLowerCase();
    if (lowered.includes('generativelanguage.googleapis.com')) return VENDORS.find(v => v.id === 'gemini');
    if (lowered.includes('dashscope.aliyuncs.com')) return VENDORS.find(v => v.id === 'qwen');
    if (lowered.includes('volces.com')) return VENDORS.find(v => v.id === 'doubao');
    if (lowered.includes('deepseek.com')) return VENDORS.find(v => v.id === 'deepseek');
    if (lowered.includes('minimax')) return VENDORS.find(v => v.id === 'minimax');
    if (lowered.includes('bigmodel.cn')) return VENDORS.find(v => v.id === 'glm');
    return undefined;
};

const resolveVendor = (config?: AuthorModelTabProps['config']) => {
    if (config?.vendorId) {
        const matched = VENDORS.find(v => v.id === config.vendorId);
        if (matched) return matched;
    }
    return inferVendorFromBaseUrl(config?.baseUrl) ?? VENDORS[0];
};

const buildDraftConfig = (config?: AuthorModelTabProps['config']) => ({
    vendorId: config?.vendorId ?? '',
    apiKey: config?.apiKey ?? '',
    baseUrl: config?.baseUrl ?? '',
    model: config?.model ?? '',
    prompt: config?.prompt ?? '',
});

const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
};

export const AuthorModelTab: React.FC<AuthorModelTabProps> = ({
    config,
    onUpdateAiConfig,
    onFetchAiModels,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showPromptConfirm, setShowPromptConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [draftConfig, setDraftConfig] = useState(() => buildDraftConfig(config));
    const [tempPrompt, setTempPrompt] = useState(() => config?.prompt ?? '');

    useEffect(() => {
        const next = buildDraftConfig(config);
        setDraftConfig(next);
        setTempPrompt(next.prompt);
    }, [config]);

    const activeConfig = config ?? draftConfig;
    const activeVendor = useMemo(() => resolveVendor(activeConfig), [activeConfig]);
    const activeModel = activeConfig?.model?.trim() || '';
    const activePrompt = activeConfig?.prompt?.trim() || '';
    const promptPreview = activePrompt || DEFAULT_AI_SYSTEM_PROMPT;
    const isConnected = Boolean(activeModel && (activeConfig?.vendorId || activeConfig?.baseUrl));

    const handleSavePrompt = async () => {
        const nextConfig = { ...draftConfig, prompt: tempPrompt };
        setIsSaving(true);
        setErrorMessage('');
        try {
            await onUpdateAiConfig({
                vendorId: toNullable(nextConfig.vendorId),
                apiKey: toNullable(nextConfig.apiKey),
                baseUrl: toNullable(nextConfig.baseUrl),
                model: toNullable(nextConfig.model),
                prompt: toNullable(nextConfig.prompt),
            });
            setDraftConfig(nextConfig);
            setShowPromptConfirm(false);
            setIsEditing(false);
        } catch (err) {
            setErrorMessage((err as Error).message || '更新提示词失败。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnectionSave = async (data: {
        vendor: AIVendor;
        model: string;
        status: 'success' | 'failed';
        baseUrl: string;
        apiKey: string;
    }) => {
        const nextConfig = {
            ...draftConfig,
            vendorId: data.vendor.id,
            model: data.model,
            baseUrl: data.baseUrl,
            apiKey: data.apiKey,
        };

        setIsSaving(true);
        setErrorMessage('');
        try {
            await onUpdateAiConfig({
                vendorId: toNullable(nextConfig.vendorId),
                apiKey: toNullable(nextConfig.apiKey),
                baseUrl: toNullable(nextConfig.baseUrl),
                model: toNullable(nextConfig.model),
                prompt: toNullable(nextConfig.prompt),
            });
            setDraftConfig(nextConfig);
            setIsEditing(false);
        } catch (err) {
            setErrorMessage((err as Error).message || '更新 AI 配置失败。');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-muted uppercase tracking-wider">
                   {isEditing ? "编辑 AI 配置" : "当前 AI 配置"}
                </h3>
                {!isEditing && (
                  <NeonButton variant="secondary" onClick={() => setIsEditing(true)} icon={<Edit3 size={14}/>} className="h-8 text-xs">
                    配置连接
                  </NeonButton>
                )}
            </div>

            
            {isEditing ? (
                <div className="space-y-8 animate-fade-in">
                    
                    <AdminModelTab 
                        onSave={handleConnectionSave}
                        onFetchModels={onFetchAiModels}
                        initialValues={{
                            vendor: activeVendor,
                            model: draftConfig.model,
                            baseUrl: draftConfig.baseUrl || activeVendor.defaultBaseUrl,
                            apiKey: draftConfig.apiKey,
                        }}
                    />

                    
                    <GlassCard>
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Bot size={20} /></div>
                                <h3 className="text-sm font-bold text-fg">AI 角色设定</h3>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <textarea 
                                    className="w-full bg-surface text-fg border border-border rounded-xl px-4 py-4 focus:outline-none focus:border-primary/50 focus:bg-surface2/40 transition-colors placeholder:text-muted font-mono text-sm leading-relaxed min-h-[200px] resize-y"
                                    value={tempPrompt}
                                    onChange={(e) => setTempPrompt(e.target.value)}
                                    placeholder={DEFAULT_AI_SYSTEM_PROMPT}
                                />
                            </div>

                            {errorMessage && (
                                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="flex items-center justify-end pt-2">
                                <div className="flex gap-3">
                                    <NeonButton variant="ghost" onClick={() => { setIsEditing(false); setTempPrompt(draftConfig.prompt); }} disabled={isSaving}>取消</NeonButton>
                                    <NeonButton variant="primary" icon={<Save size={14}/>} onClick={() => setShowPromptConfirm(true)} disabled={isSaving}>
                                        保存提示词
                                    </NeonButton>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    
                    <GlassCard className="relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center shadow-md group-hover:scale-[1.02] transition-transform duration-300">
                                        <div className="w-8 h-8" style={{ color: activeVendor.color }}>
                                            {activeVendor.icon}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-canvas border border-border flex items-center justify-center">
                                        <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-white tracking-tight">{activeVendor.name}</h2>
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                                            {activeModel || '未设置'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-mono">
                                        <span className={`flex items-center gap-1.5 ${isConnected ? 'text-success' : 'text-muted'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ring-1 ring-border/60 ${isConnected ? 'bg-success' : 'bg-muted'}`}></div>
                                            {isConnected ? '已连接' : '未配置'}
                                        </span>
                                        <span className="text-slate-600">|</span>
                                        <span className="text-slate-500">延迟：--</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:flex flex-col items-end gap-1">
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">服务节点</div>
                                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-sm">
                                    <ShieldCheck size={14} className="text-primary"/> 
                                    <span>认证有效</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    
                    <GlassCard className="relative group">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Bot size={20} /></div>
                                <h3 className="text-sm font-bold text-fg">AI 角色设定</h3>
                            </div>
                        </div>
                        
                        <div className="relative p-6 rounded-xl bg-surface border border-border font-mono text-sm text-fg/90 leading-relaxed shadow-inner">
                            <Quote size={20} className="absolute top-4 left-4 text-white/5 transform -scale-x-100" />
                            <div className="relative z-10 pl-4 border-l-2 border-purple-500/30">
                                {promptPreview}
                            </div>
                            <Quote size={20} className="absolute bottom-4 right-4 text-white/5" />
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <span>系统上下文窗口：128k</span>
                            <span>Token 数：{promptPreview.length}（估算）</span>
                        </div>
                    </GlassCard>
                </div>
            )}

            
            <ConfirmModal 
                isOpen={showPromptConfirm}
                onClose={() => setShowPromptConfirm(false)}
                onConfirm={handleSavePrompt}
                title="保存提示词"
                message="确认将此提示词应用于后续 AI 生成？"
                type="primary"
                confirmText="保存"
            />
        </div>
    );
};
