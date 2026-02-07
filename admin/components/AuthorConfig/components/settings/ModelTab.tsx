import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { CyberInput } from '../ui/CyberInput';
import { ConfirmModal } from '../ui/ConfirmModal';
import { AIVendor } from '../../types';
import { VENDORS } from '../../data/aiVendors';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Zap, ChevronDown, ShieldAlert, Globe2 } from 'lucide-react';

// Re-export for compatibility if needed, though mostly used internally or from data/aiVendors now
export { VENDORS }; 

interface ModelTabProps {
    onSave?: (data: {
        vendor: AIVendor;
        model: string;
        status: 'success' | 'failed';
        baseUrl: string;
        apiKey: string;
    }) => void;
    onFetchModels?: (input: {
        vendorId?: string | null;
        apiKey?: string | null;
        baseUrl?: string | null;
    }) => Promise<{ models: string[]; latencyMs: number }>;
    initialValues?: {
        vendor?: AIVendor;
        model?: string;
        baseUrl?: string;
        apiKey?: string;
    };
}

export const ModelTab: React.FC<ModelTabProps> = ({ onSave, onFetchModels, initialValues }) => {
  // Initialize state with props or defaults
  const [selectedVendor, setSelectedVendor] = useState<AIVendor>(initialValues?.vendor || VENDORS[0]);
  const [baseUrl, setBaseUrl] = useState(initialValues?.baseUrl || selectedVendor.defaultBaseUrl);
  const [apiKey, setApiKey] = useState(initialValues?.apiKey || '');
  const [modelName, setModelName] = useState(initialValues?.model || '');
  const hasUserSelectedVendor = useRef(false);
  
  // Internal State
  const [availableModels, setAvailableModels] = useState<string[]>(initialValues?.model ? [initialValues.model] : []); // Pre-fill if exists to anchor selection
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [latency, setLatency] = useState(0);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // When vendor selection changes manually, reset or update defaults
  useEffect(() => {
    const isInitialVendor = initialValues?.vendor?.id === selectedVendor.id;
    if (!hasUserSelectedVendor.current && isInitialVendor) {
        return;
    }
    if (!isInitialVendor || hasUserSelectedVendor.current) {
        setBaseUrl(selectedVendor.defaultBaseUrl);
        setApiKey(''); 
        setTestStatus('idle');
        setErrorMsg('');
        setAvailableModels([]);
        setModelName('');
    }
  }, [selectedVendor, initialValues]);

  // --- Real API Fetch Implementation ---
  const fetchModelsFromApi = async (url: string, key: string, vendorId: string) => {
    let fetchUrl = '';
    let headers: Record<string, string> = {};

    if (vendorId === 'gemini') {
        const cleanUrl = url.replace(/\/$/, ''); 
        fetchUrl = `${cleanUrl}/models?key=${key}`;
    } else {
        const cleanUrl = url.replace(/\/$/, '');
        fetchUrl = cleanUrl.endsWith('/models') ? cleanUrl : `${cleanUrl}/models`;
        headers = {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        };
    }

    const start = performance.now();
    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: headers,
        });

        const end = performance.now();
        setLatency(Math.round(end - start));

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`);
        }

        const data = await response.json() as { models?: Array<{ name?: string }>; data?: Array<{ id?: string }> };
        
        let modelList: string[] = [];
        
        if (vendorId === 'gemini') {
            if (data.models && Array.isArray(data.models)) {
                modelList = data.models.map((m) => String(m?.name ?? '').replace('models/', '')).filter(Boolean);
            }
        } else {
            if (data.data && Array.isArray(data.data)) {
                modelList = data.data.map((m) => String(m?.id ?? '').trim()).filter(Boolean);
            }
        }

        if (modelList.length === 0) {
            throw new Error("未找到可用模型");
        }

        return modelList;
    } catch (error: unknown) {
        console.error("Fetch Error:", error);
        throw error;
    }
  };

  const requestModels = async () => {
    const key = apiKey.trim();
    if (!key) {
      throw new Error('API_KEY_REQUIRED');
    }
    const resolvedBaseUrl = baseUrl.trim() || selectedVendor.defaultBaseUrl;
    if (onFetchModels) {
      const result = await onFetchModels({
        vendorId: selectedVendor.id,
        apiKey: key,
        baseUrl: resolvedBaseUrl,
      });
      setLatency(result.latencyMs);
      return result.models;
    }
    return fetchModelsFromApi(resolvedBaseUrl, key, selectedVendor.id);
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
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setErrorMsg('请求失败（可能是 CORS 或地址错误）');
      } else {
        setErrorMsg(err instanceof Error ? err.message : '请求失败');
      }
    }
  };

  const handleRefreshModels = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('请先填写 API Key，再刷新模型列表');
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
      setErrorMsg(err instanceof Error ? err.message : '刷新失败');
    } finally {
      setIsRefreshingModels(false);
    }
  };

  const handleSaveConfig = () => {
    if (onSave) {
      onSave({
        vendor: selectedVendor,
        model: modelName,
        status: testStatus === 'success' ? 'success' : 'failed',
        baseUrl: baseUrl.trim() || selectedVendor.defaultBaseUrl,
        apiKey: apiKey.trim(),
      });
    }
    setShowSaveConfirm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 pl-1">选择模型厂商</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {VENDORS.map((vendor) => (
            <button
              key={vendor.id}
              onClick={() => {
                hasUserSelectedVendor.current = true;
                setSelectedVendor(vendor);
              }}
              className={`
                relative group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 overflow-hidden
                ${selectedVendor.id === vendor.id 
                  ? 'bg-surface2/60 border-border shadow-sm' 
                  : 'bg-surface/40 border-border/60 hover:bg-surface2/40 hover:border-border'}
              `}
            >
              <div 
                className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`}
                style={{ backgroundColor: vendor.color }}
              />
              
              <div 
                className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 relative z-10
                  ${selectedVendor.id === vendor.id ? 'scale-110' : 'scale-100'}
                `}
                style={{ 
                  backgroundColor: selectedVendor.id === vendor.id ? `${vendor.color}20` : 'rgba(255,255,255,0.03)',
                  boxShadow: selectedVendor.id === vendor.id ? `0 0 20px ${vendor.color}30` : 'none'
                }}
              >
                <div className="w-7 h-7">
                  {vendor.icon}
                </div>
              </div>
              
              <span className={`text-xs font-bold tracking-wide transition-colors relative z-10 ${selectedVendor.id === vendor.id ? 'text-fg' : 'text-muted group-hover:text-fg'}`}>
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
           <h3 className="text-sm font-bold text-fg flex items-center gap-2">
             参数配置
             <span className="text-[10px] font-normal font-mono text-muted px-2 py-0.5 border border-border rounded-md">
               {selectedVendor.id.toUpperCase()}_NODE
             </span>
           </h3>
           <div className="text-[10px] text-muted font-mono flex items-center gap-1">
             <Globe2 size={10} /> 
             {selectedVendor.id === 'gemini' ? 'Google API' : 'OpenAI 兼容'}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
           <div className="space-y-4">
              <CyberInput 
                label="接口地址" 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
              
              <div className="relative group">
                  <label className="block text-xs font-mono text-muted mb-1.5 uppercase tracking-wider ml-1">
                      模型选择
                  </label>
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <select 
                              className={`
                                w-full bg-surface text-fg
                                border border-border rounded-xl pl-4 pr-10 py-3 
                                appearance-none
                                focus:outline-none focus:border-primary/50 focus:bg-surface2/40
                                transition-colors cursor-pointer text-base
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                              value={modelName}
                              onChange={(e) => setModelName(e.target.value)}
                              // Allow selection if we provided a default model via props, even if list is empty
                              disabled={availableModels.length === 0 && !initialValues?.model}
                          >
                             {(availableModels.length === 0 && !initialValues?.model) ? (
                               <option value="">{isRefreshingModels ? "加载中..." : "请先获取模型列表"}</option>
                             ) : (
                               <>
                                {availableModels.map((m) => (
                                 <option key={m} value={m} className="bg-surface2 text-fg py-2">
                                   {m}
                                 </option>
                                ))}
                                {/* Anchor: If we have a model set but list is empty (failed to fetch), still show it as option */}
                                {availableModels.length === 0 && modelName && <option value={modelName}>{modelName}</option>}
                               </>
                             )}
                          </select>
                          
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none group-focus-within:text-primary transition-colors">
                             <ChevronDown size={16} />
                          </div>
                      </div>

                      <button 
                        onClick={handleRefreshModels}
                        disabled={isRefreshingModels || !apiKey}
                        className={`
                           w-12 rounded-xl border flex items-center justify-center transition-all active:scale-95
                           ${isRefreshingModels 
                             ? 'bg-primary/20 border-primary text-primary' 
                             : 'bg-surface border-border text-muted hover:text-primary hover:border-primary/30 hover:bg-surface2/40'}
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
                  label="鉴权密钥" 
                  value={apiKey}
                  onChange={(e) => {
                      setApiKey(e.target.value);
                      if (testStatus === 'failed') {
                          setTestStatus('idle'); // Clear error state on input
                          setErrorMsg('');
                      }
                  }}
                  placeholder={
                      selectedVendor.id === 'glm' ? "认证 Token / Key" : 
                      selectedVendor.id === 'gemini' ? "API Key" : "sk-..."
                  }
                  className={testStatus === 'failed' ? 'border-danger/50 focus:border-danger' : ''}
                />
              </div>
              
              <div className={`
                min-h-[76px] rounded-xl border p-3 flex items-center justify-center transition-colors duration-300
                ${testStatus === 'failed' ? 'bg-danger/5 border-danger/20' : 'bg-surface border-border'}
              `}>
                 <div className="flex items-center gap-3 w-full">
                    <div className={`
                       w-10 h-10 shrink-0 rounded-full flex items-center justify-center border transition-all duration-300
                       ${testStatus === 'idle' ? 'bg-surface2 border-border text-muted' : ''}
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
                       <div className={`text-xs font-bold ${testStatus === 'failed' ? 'text-danger' : 'text-fg'}`}>
                          {testStatus === 'idle' && '等待测试连接'}
                          {testStatus === 'loading' && '请求 API 中...'}
                          {testStatus === 'success' && 'API 连接正常'}
                          {testStatus === 'failed' && '请求失败'}
                       </div>
                       <div className="text-[10px] text-muted font-mono break-all leading-tight mt-0.5" title={errorMsg}>
                          {testStatus === 'failed' ? (
                              <span className="text-danger flex items-start gap-1"><ShieldAlert size={10} className="mt-0.5 shrink-0"/> {errorMsg || '错误'}</span>
                          ) : (
                              testStatus === 'success' ? `延迟: ${latency}ms | 可用模型: ${availableModels.length}` : '准备就绪'
                          )}
                       </div>
                    </div>
                 </div>
                 
                 {/* Simplified Test Button with !p-0 to fix invisible icon */}
                 <NeonButton 
                   variant={testStatus === 'failed' ? 'danger' : 'primary'} 
                   onClick={handleTestConnection}
                   disabled={testStatus === 'loading' || !apiKey}
                   className="h-10 w-10 !p-0 ml-auto flex items-center justify-center rounded-xl shrink-0"
                   title="测试连接"
                 >
                   <Zap size={18} className={testStatus === 'loading' ? "animate-pulse" : ""} />
                 </NeonButton>
              </div>
           </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pl-2 pt-4 border-t border-border">
             <span className="text-xs text-muted self-center mr-auto">
               * 前端直连可能因 CORS 失败，建议使用支持跨域的代理
             </span>
             <NeonButton variant="ghost">重置默认</NeonButton>
             <NeonButton icon={<CheckCircle2 size={16} />} disabled={testStatus !== 'success'} onClick={() => setShowSaveConfirm(true)}>保存配置</NeonButton>
        </div>
      </GlassCard>

      {/* Save Confirmation */}
      <ConfirmModal 
          isOpen={showSaveConfirm}
          onClose={() => setShowSaveConfirm(false)}
          onConfirm={handleSaveConfig}
          title="保存模型配置"
          message="确认应用新的 AI 模型连接设置？这将影响所有依赖 AI 的功能组件。"
          type="primary"
          confirmText="保存配置"
      />
    </div>
  );
};
