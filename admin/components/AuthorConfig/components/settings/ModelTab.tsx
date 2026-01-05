import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { CyberInput } from '../ui/CyberInput';
import { AIVendor } from '../../types';
import { DEFAULT_AI_SYSTEM_PROMPT } from '../../../../constants';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Zap, ChevronDown, ShieldAlert, Globe2 } from 'lucide-react';

// Custom SVG Icons for Vendors
const Icons = {
  Qwen: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C10.8333 17 9.75 16.6 8.9 15.9L6 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Doubao: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
       <path d="M12 22C16.5 22 20 18.5 20 12C20 7.5 16.5 4 13 4C9 4 4 8 4 14C4 18.5 8 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
       <circle cx="9" cy="11" r="1.5" fill="currentColor" />
       <circle cx="15" cy="11" r="1.5" fill="currentColor" />
       <path d="M10 15C10 15 11 16 12 16C13 16 14 15 14 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  DeepSeek: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
       <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
       <path d="M21 12C21 16.9706 16.9706 21 12 21C9.6 21 7.4 20 5.8 18.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
       <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
       <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.3"/>
       <path d="M3 12L7 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  MiniMax: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18V9L9 15L15 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 9L21 15V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 9V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Gemini: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M17 17L18.25 20.75L22 22L18.25 23.25L17 27L15.75 23.25L12 22L15.75 20.75L17 17Z" fill="currentColor" transform="scale(0.5) translate(12,12)"/>
    </svg>
  ),
  GLM: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 9V4M9.5 13.5L5 18M14.5 13.5L19 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="4" r="2" fill="currentColor"/>
      <circle cx="5" cy="18" r="2" fill="currentColor"/>
      <circle cx="19" cy="18" r="2" fill="currentColor"/>
    </svg>
  )
};

// We prefer OpenAI-Compatible endpoints where available for easier integration
const VENDORS: AIVendor[] = [
  { id: 'qwen', name: '通义千问', icon: <Icons.Qwen />, color: '#bd93f9', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { id: 'doubao', name: '豆包', icon: <Icons.Doubao />, color: '#50fa7b', defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3' },
  { id: 'deepseek', name: 'DeepSeek', icon: <Icons.DeepSeek />, color: '#8be9fd', defaultBaseUrl: 'https://api.deepseek.com' }, // Supports /v1/models
  { id: 'minimax', name: 'MiniMax', icon: <Icons.MiniMax />, color: '#ff79c6', defaultBaseUrl: 'https://api.minimax.chat/v1' },
  { id: 'gemini', name: 'Gemini', icon: <Icons.Gemini />, color: '#f1fa8c', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta' }, // Not OpenAI compatible
  { id: 'glm', name: '智谱 GLM', icon: <Icons.GLM />, color: '#ff5555', defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4' }, // OpenAI compatible V4 endpoint
];

interface ModelTabProps {
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
  onFetchModels: (input: {
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

const resolveVendor = (config?: ModelTabProps['config']) => {
  if (config?.vendorId) {
    const matched = VENDORS.find(v => v.id === config.vendorId);
    if (matched) return matched;
  }
  return inferVendorFromBaseUrl(config?.baseUrl) ?? VENDORS[0];
};

export const ModelTab: React.FC<ModelTabProps> = ({ config, onUpdateAiConfig, onFetchModels }) => {
  const initialVendor = resolveVendor(config);
  const [selectedVendor, setSelectedVendor] = useState<AIVendor>(initialVendor);
  const [baseUrl, setBaseUrl] = useState(() => config?.baseUrl ?? initialVendor.defaultBaseUrl);
  const [apiKey, setApiKey] = useState(() => config?.apiKey ?? '');
  
  // State for Model Data
  const [modelName, setModelName] = useState(() => config?.model ?? '');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(() => config?.prompt ?? '');
  
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [latency, setLatency] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'failed'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const activeVendor = resolveVendor(config);
  const activeModelName = config?.model?.trim() || '';
  const activePrompt = config?.prompt?.trim() || '';
  const promptPreview = activePrompt || DEFAULT_AI_SYSTEM_PROMPT;
  const activeVendorLabel = config?.vendorId || config?.baseUrl ? activeVendor.name : '未配置';
  const activeVendorColor = config?.vendorId || config?.baseUrl ? activeVendor.color : '#6272a4';
  const activeModelLabel = activeModelName || '未配置';
  const promptStatusLabel = activePrompt ? '自定义' : '默认';

  useEffect(() => {
    const resolved = resolveVendor(config);
    setSelectedVendor(resolved);
    setBaseUrl(config?.baseUrl ?? resolved.defaultBaseUrl);
    setApiKey(config?.apiKey ?? '');
    setModelName(config?.model ?? '');
    setPrompt(config?.prompt ?? '');
    setAvailableModels([]);
    setTestStatus('idle');
    setErrorMsg('');
    setLatency(0);
    setSaveStatus('idle');
    setSaveMessage('');
  }, [config?.vendorId, config?.baseUrl, config?.apiKey, config?.model, config?.prompt]);

  const requestModels = async () => {
    const key = apiKey.trim();
    if (!key) {
      throw new Error('API_KEY_REQUIRED');
    }

    const resolvedBaseUrl = baseUrl.trim() || selectedVendor.defaultBaseUrl;
    const result = await onFetchModels({
      vendorId: selectedVendor.id,
      apiKey: key,
      baseUrl: resolvedBaseUrl,
    });

    setLatency(result.latencyMs);
    return result.models;
  };

  const handleSelectVendor = (vendor: AIVendor) => {
    setSelectedVendor(vendor);
    setBaseUrl(vendor.defaultBaseUrl);
    setApiKey('');
    setModelName('');
    setAvailableModels([]);
    setTestStatus('idle');
    setErrorMsg('');
    setLatency(0);
  };

  const handleResetDefaults = () => {
    setBaseUrl(selectedVendor.defaultBaseUrl);
    setApiKey('');
    setModelName('');
    setPrompt('');
    setAvailableModels([]);
    setTestStatus('idle');
    setErrorMsg('');
    setLatency(0);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus('failed');
      setErrorMsg('请先填写 API Key');
      return;
    }

    setTestStatus('loading');
    setErrorMsg('');

    try {
      const models = await requestModels();
      setTestStatus('success');
      setAvailableModels(models);
      if (!modelName && models.length > 0) {
        setModelName(models[0]);
      }
    } catch (err: unknown) {
      setTestStatus('failed');
      if (err instanceof Error && err.message === 'API_KEY_REQUIRED') {
        setErrorMsg('请先填写 API Key');
      } else {
        setErrorMsg(err instanceof Error ? err.message : '请求失败，请检查配置');
      }
    }
  };

  const handleRefreshModels = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('请先填写 API Key');
      return;
    }
    setIsRefreshingModels(true);
    setErrorMsg('');

    try {
      const models = await requestModels();
      setAvailableModels(models);
      if (!models.includes(modelName)) {
        setModelName(models[0] || '');
      }
      if (testStatus !== 'success') setTestStatus('success');
    } catch (err: unknown) {
      setTestStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : '请求失败，请检查配置');
    } finally {
      setIsRefreshingModels(false);
    }
  };
  const handleSaveConfig = async () => {
    const payload = {
      vendorId: selectedVendor.id,
      apiKey: apiKey.trim() ? apiKey.trim() : null,
      baseUrl: baseUrl.trim() ? baseUrl.trim() : null,
      model: modelName.trim() ? modelName.trim() : null,
      prompt: prompt.trim() ? prompt.trim() : null,
    };

    setIsSaving(true);
    setErrorMsg('');
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      await onUpdateAiConfig(payload);
      setSaveStatus('success');
      setSaveMessage('配置已保存，模型已就绪');
    } catch (err) {
      setSaveStatus('failed');
      const message = (err as Error).message || '保存失败';
      setSaveMessage(message);
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="relative overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-mono text-[#6272a4] uppercase tracking-wider">当前 AI 配置</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeVendorColor }} />
              <h3 className="text-lg font-bold text-[#f8f8f2]">
                {activeVendorLabel}
                <span className="text-[#6272a4] font-mono text-xs ml-2">MODEL</span>
              </h3>
            </div>
            <p className="text-[11px] text-[#6272a4] font-mono mt-1">
              {activeModelLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] px-2 py-1 rounded border border-white/10 text-[#f8f8f2]/80">
              提示词：{promptStatusLabel}
            </span>
            {saveStatus !== 'idle' && (
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded border ${
                  saveStatus === 'success'
                    ? 'text-[#50fa7b] border-[#50fa7b]/40 bg-[#50fa7b]/10'
                    : saveStatus === 'failed'
                      ? 'text-[#ff5555] border-[#ff5555]/40 bg-[#ff5555]/10'
                      : 'text-[#f1fa8c] border-[#f1fa8c]/40 bg-[#f1fa8c]/10'
                }`}
              >
                {saveStatus === 'saving' ? '保存中...' : saveMessage || '已保存'}
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/5 bg-[#0F111A]/70 p-3">
          <div className="flex items-center justify-between text-[10px] text-[#6272a4] font-mono mb-2">
            <span>系统提示词预览</span>
            <span>{promptStatusLabel}</span>
          </div>
          <pre className="text-[11px] text-slate-300 whitespace-pre-wrap max-h-28 overflow-auto">
            {promptPreview}
          </pre>
        </div>
      </GlassCard>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#6272a4] uppercase tracking-wider mb-3 pl-1">选择模型厂商 (Provider)</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {VENDORS.map((vendor) => (
            <button
              key={vendor.id}
              onClick={() => handleSelectVendor(vendor)}
              className={`
                relative group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 overflow-hidden
                ${selectedVendor.id === vendor.id 
                  ? 'bg-[#44475a]/60 border-white/20 shadow-lg' 
                  : 'bg-[#282a36]/50 border-white/5 hover:bg-[#44475a]/30 hover:border-white/10'}
              `}
            >
              <div 
                className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`}
                style={{ backgroundColor: vendor.color }}
              />
              
              <div 
                className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 relative z-10
                  ${selectedVendor.id === vendor.id ? 'scale-110' : 'grayscale-[0.5] group-hover:grayscale-0'}
                `}
                style={{ 
                  backgroundColor: selectedVendor.id === vendor.id ? `${vendor.color}20` : 'rgba(255,255,255,0.03)',
                  color: selectedVendor.id === vendor.id ? vendor.color : '#6272a4',
                  boxShadow: selectedVendor.id === vendor.id ? `0 0 20px ${vendor.color}30` : 'none'
                }}
              >
                <div className="w-7 h-7">
                  {vendor.icon}
                </div>
              </div>
              
              <span className={`text-xs font-bold tracking-wide transition-colors relative z-10 ${selectedVendor.id === vendor.id ? 'text-[#f8f8f2]' : 'text-[#6272a4] group-hover:text-[#f8f8f2]'}`}>
                {vendor.name}
              </span>

              {selectedVendor.id === vendor.id && (
                <div 
                  className="absolute inset-0 rounded-xl border transition-opacity duration-500 opacity-50"
                  style={{ borderColor: vendor.color, boxShadow: `inset 0 0 10px ${vendor.color}10` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="relative overflow-hidden">
        <div 
            className="absolute top-0 left-0 w-1 h-full transition-colors duration-500"
            style={{ backgroundColor: selectedVendor.color }}
        />

        <div className="flex items-center justify-between mb-6 pl-2">
           <h3 className="text-sm font-bold text-[#f8f8f2] flex items-center gap-2">
             参数配置 (Configuration)
             <span className="text-[10px] font-normal font-mono text-[#6272a4] px-2 py-0.5 border border-white/10 rounded-md">
               {selectedVendor.id.toUpperCase()}_NODE
             </span>
           </h3>
           <div className="text-[10px] text-[#6272a4] font-mono flex items-center gap-1">
             <Globe2 size={10} /> 
             {selectedVendor.id === 'gemini' ? 'Google API' : 'OpenAI Compatible'}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
           <div className="space-y-4">
              <CyberInput 
                label="接口地址 (Base URL)" 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
              
              <div className="relative group">
                  <label className="block text-xs font-mono text-[#6272a4] mb-1.5 uppercase tracking-wider ml-1">
                      模型选择 (Select Model)
                  </label>
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <select 
                              className={`
                                w-full bg-[#0F111A] text-[#f8f8f2] 
                                border border-white/[0.08] rounded-xl pl-4 pr-10 py-3 
                                appearance-none
                                focus:outline-none focus:border-primary/50 focus:bg-[#131620]
                                focus:shadow-[0_0_0_1px_rgba(168,85,247,0.2)]
                                transition-all duration-200 cursor-pointer
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                              value={modelName}
                              onChange={(e) => setModelName(e.target.value)}
                              disabled={availableModels.length === 0}
                          >
                             {availableModels.length === 0 ? (
                               <option value="">{isRefreshingModels ? "Loading..." : "请先获取模型列表"}</option>
                             ) : (
                               availableModels.map((m) => (
                                 <option key={m} value={m} className="bg-[#151621] text-slate-200 py-2">
                                   {m}
                                 </option>
                               ))
                             )}
                          </select>
                          
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-primary transition-colors">
                             <ChevronDown size={16} />
                          </div>
                      </div>

                      <button 
                        onClick={handleRefreshModels}
                        disabled={isRefreshingModels || isSaving || !apiKey.trim()}
                        className={`
                           w-12 rounded-xl border flex items-center justify-center transition-all active:scale-95
                           ${isRefreshingModels 
                             ? 'bg-primary/20 border-primary text-primary' 
                             : 'bg-[#0F111A] border-white/10 text-[#6272a4] hover:text-primary hover:border-primary/30 hover:bg-[#151621]'}
                           disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        title="通过 API 获取模型列表"
                      >
                         <RefreshCw size={18} className={isRefreshingModels ? "animate-spin" : ""} />
                      </button>
                  </div>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="relative">
                <CyberInput 
                  type="password"
                  label="鉴权密钥 (API Key)" 
                  value={apiKey}
                  onChange={(e) => {
                      setApiKey(e.target.value);
                      if (testStatus === 'failed') {
                          setTestStatus('idle'); // Clear error state on input
                          setErrorMsg('');
                      }
                  }}
                  placeholder={
                      selectedVendor.id === 'glm' ? "Auth Token / Key" : 
                      selectedVendor.id === 'gemini' ? "API Key" : "sk-..."
                  }
                  className={testStatus === 'failed' ? 'border-danger/50 focus:border-danger' : ''}
                />
              </div>
              
              <div className={`
                h-[76px] rounded-xl border p-3 flex items-center justify-between transition-colors duration-300
                ${testStatus === 'failed' ? 'bg-danger/5 border-danger/20' : 'bg-[#0F111A] border-white/[0.05]'}
              `}>
                 <div className="flex items-center gap-3">
                    <div className={`
                       w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300
                       ${testStatus === 'idle' ? 'bg-[#44475a] border-[#6272a4] text-[#6272a4]' : ''}
                       ${testStatus === 'loading' ? 'bg-secondary/10 border-secondary/30 text-secondary' : ''}
                       ${testStatus === 'success' ? 'bg-success/10 border-success/30 text-success' : ''}
                       ${testStatus === 'failed' ? 'bg-danger/10 border-danger/30 text-danger' : ''}
                    `}>
                       {testStatus === 'idle' && <Zap size={18} />}
                       {testStatus === 'loading' && <Loader2 size={18} className="animate-spin" />}
                       {testStatus === 'success' && <CheckCircle2 size={18} />}
                       {testStatus === 'failed' && <AlertCircle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                       <div className={`text-xs font-bold ${testStatus === 'failed' ? 'text-danger' : 'text-[#f8f8f2]'}`}>
                          {testStatus === 'idle' && '等待测试连接'}
                          {testStatus === 'loading' && '请求 API 中...'}
                          {testStatus === 'success' && 'API 连接正常'}
                          {testStatus === 'failed' && '请求失败'}
                       </div>
                       <div className="text-[10px] text-[#6272a4] font-mono truncate max-w-[140px]" title={errorMsg}>
                          {testStatus === 'failed' ? (
                              <span className="text-danger flex items-center gap-1 mt-0.5"><ShieldAlert size={10}/> {errorMsg || 'Error'}</span>
                          ) : (
                              testStatus === 'success' ? `Latency: ${latency}ms | ${availableModels.length} models` : 'Ready to fetch'
                          )}
                       </div>
                    </div>
                 </div>
                 
                 <NeonButton 
                   variant={testStatus === 'failed' ? 'danger' : 'primary'} 
                   onClick={handleTestConnection}
                   disabled={testStatus === 'loading' || isSaving || !apiKey.trim()}
                   className="h-8 text-xs px-4"
                 >
                   {testStatus === 'loading' ? 'Fetching...' : '测试 & 刷新'}
                 </NeonButton>
              </div>
           </div>
        </div>

        <div className="mt-8 pl-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-[#f8f8f2]">自定义 AI 提示词</h4>
            <button
              type="button"
              onClick={() => setPrompt('')}
              disabled={isSaving}
              className="text-[11px] text-[#6272a4] hover:text-[#f8f8f2] transition-colors disabled:opacity-50"
            >
              使用默认提示词
            </button>
          </div>
          <p className="text-[11px] text-[#6272a4] mb-3">
            留空将使用系统默认提示词（用于文章分析与摘要生成）。
          </p>
          <textarea
            className="w-full min-h-[140px] bg-[#0F111A] text-[#f8f8f2] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-all placeholder-[#6272a4]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={DEFAULT_AI_SYSTEM_PROMPT}
          />
          <div className="mt-2 text-[10px] text-[#6272a4] font-mono">
            当前状态：{prompt.trim() ? '已自定义提示词' : '使用系统默认提示词'}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pl-2 pt-4 border-t border-white/5">
             <span className="text-xs text-[#6272a4] self-center mr-auto">
               * 模型列表通过后端代理请求，避免浏览器 CORS 限制。
             </span>
             {saveStatus !== 'idle' && (
               <span
                 className={`text-xs font-bold self-center px-2 py-1 rounded border ${
                   saveStatus === 'success'
                     ? 'text-[#50fa7b] border-[#50fa7b]/40 bg-[#50fa7b]/10'
                     : saveStatus === 'failed'
                       ? 'text-[#ff5555] border-[#ff5555]/40 bg-[#ff5555]/10'
                       : 'text-[#f1fa8c] border-[#f1fa8c]/40 bg-[#f1fa8c]/10'
                 }`}
               >
                 {saveStatus === 'saving' ? '保存中...' : saveMessage}
               </span>
             )}
             <NeonButton variant="ghost" onClick={handleResetDefaults} disabled={isSaving}>恢复默认</NeonButton>
             <NeonButton icon={<CheckCircle2 size={16} />} onClick={handleSaveConfig} disabled={isSaving}>保存配置</NeonButton>
        </div>
      </GlassCard>
    </div>
  );
};
