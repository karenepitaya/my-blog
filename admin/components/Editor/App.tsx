
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeBlogContent, fetchModelList, DEFAULT_SYSTEM_INSTRUCTION, DEFAULT_GEMINI_MODELS, DEFAULT_CUSTOM_MODELS } from './services/geminiService';
import { processMarkdownImages, testOssConfig } from './services/imageService';
import { LoadingState, AiAnalysisResult, GlobalConfig, AiProvider, AiConfig, OssConfig } from './types';
import { AI_PRESETS, OSS_PRESETS } from './config/presets';

// --- Icons ---
const CloudIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>);
const DatabaseIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>);
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>);
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);
const EyeSlashIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>);
const ArrowPathIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>);
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>);
const ListBulletIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 17.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>);
const WarningIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#ffb86c]" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#50fa7b]" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#bd93f9]" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>);
const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>);
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>);

// --- Processing Overlay Component ---
interface ProcessingOverlayProps {
    state: LoadingState;
    errors: Array<{path: string, reason: string, isLocalMissing?: boolean}>;
    missingPaths: string[];
    onClose: () => void;
    onUploadFolder: (files: FileList) => void;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ state, errors, missingPaths, onClose, onUploadFolder }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Determines if the visual overlay should be visible
    const isOverlayVisible = state !== LoadingState.IDLE;
    
    // Logic for rendering modal content based on specific states
    const isProcessing = [LoadingState.PROCESSING_IMAGES, LoadingState.SAVING_TO_DB, LoadingState.UPLOADING_OSS].includes(state);
    const isWaiting = state === LoadingState.WAITING_FOR_ASSETS;
    const hasErrors = errors.length > 0;
    const isCompleteWithErrors = state === LoadingState.COMPLETE && hasErrors;
    const isError = state === LoadingState.ERROR;

    const shouldRenderModal = isOverlayVisible && (isProcessing || isWaiting || isCompleteWithErrors || isError);

    // Auto-close success
    useEffect(() => {
        if (state === LoadingState.COMPLETE && !hasErrors) {
            const timer = setTimeout(onClose, 1000);
            return () => clearTimeout(timer);
        }
    }, [state, hasErrors, onClose]);

    // Apply attributes once on mount (since input is always rendered now)
    useEffect(() => {
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute("webkitdirectory", "");
            fileInputRef.current.setAttribute("directory", "");
        }
    }, []);

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUploadFolder(e.target.files);
        }
    };

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            // Important: Reset value so selecting the same folder again triggers onChange
            fileInputRef.current.value = ''; 
            fileInputRef.current.click();
        }
    };

    // Helper for status message
    let message = "正在处理...";
    if (state === LoadingState.PROCESSING_IMAGES) message = "正在分析并压缩图片资源...";
    if (state === LoadingState.SAVING_TO_DB) message = "正在同步元数据到数据库...";
    if (state === LoadingState.UPLOADING_OSS) message = "正在上传文档至对象存储...";

    return (
        <>
            <input 
                ref={fileInputRef} 
                type="file" 
                className="hidden" 
                onChange={handleFolderSelect} 
                multiple 
            />

            {shouldRenderModal && (
                <div className="fixed inset-0 z-[100] backdrop-blur-md bg-[#282a36]/60 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-[#44475a] border border-[#6272a4] rounded-xl shadow-2xl p-8 max-w-lg w-full text-center">
                        
                        {isProcessing && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#bd93f9]/30 border-t-[#bd93f9] rounded-full animate-spin"></div>
                                <h3 className="text-xl font-bold text-[#f8f8f2]">{message}</h3>
                                <p className="text-[#6272a4] text-sm">请勿关闭页面</p>
                            </div>
                        )}

                        {isWaiting && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-[#bd93f9]/10 rounded-full border border-[#bd93f9]/30">
                                    <FolderIcon />
                                </div>
                                <h3 className="text-xl font-bold text-[#f8f8f2]">缺失本地资源</h3>
                                <p className="text-[#6272a4] text-sm">
                                    检测到 markdown 引用了本地文件，请上传对应的资源文件夹以继续处理。
                                </p>
                                
                                <div className="w-full text-left bg-[#282a36] rounded p-3 text-xs max-h-32 overflow-y-auto font-mono text-[#ffb86c] mb-2 border border-[#6272a4]">
                                    {missingPaths.map((p, i) => <div key={i}>{p}</div>)}
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button onClick={onClose} className="flex-1 py-2 bg-[#44475a] text-[#f8f8f2] rounded border border-[#6272a4] hover:bg-[#6272a4]">
                                        取消保存
                                    </button>
                                    <button 
                                        onClick={handleButtonClick}
                                        className="flex-1 py-2 bg-[#bd93f9] text-[#282a36] font-bold rounded hover:bg-[#ff79c6]"
                                    >
                                        选择文件夹
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isProcessing && !isWaiting && hasErrors && (
                            <div className="text-left">
                                <div className="flex items-center gap-3 mb-4">
                                    <WarningIcon />
                                    <h3 className="text-xl font-bold text-[#ffb86c]">处理完成，但有错误</h3>
                                </div>
                                <div className="bg-[#282a36] rounded-md border border-[#ff5555]/50 p-4 max-h-60 overflow-y-auto mb-6">
                                    {errors.map((err, i) => (
                                        <div key={i} className="mb-2 last:mb-0 text-sm border-b border-[#6272a4]/30 last:border-0 pb-2 last:pb-0">
                                            <p className="text-[#ff5555] font-mono break-all">{err.path}</p>
                                            <p className="text-[#6272a4] text-xs mt-0.5">{err.reason}</p>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={onClose} className="w-full py-2 bg-[#ff5555] text-white rounded font-bold hover:bg-[#ff6e6e] transition-colors">
                                    我知道了 (保留原始内容)
                                </button>
                            </div>
                        )}

                        {!isProcessing && !isWaiting && !hasErrors && state === LoadingState.COMPLETE && (
                            <div className="flex flex-col items-center gap-4">
                                <CheckCircleIcon />
                                <h3 className="text-xl font-bold text-[#f8f8f2]">处理成功!</h3>
                            </div>
                        )}

                        {isError && !hasErrors && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 text-[#ff5555] flex items-center justify-center rounded-full bg-[#ff5555]/10">
                                    <XMarkIcon />
                                </div>
                                <h3 className="text-xl font-bold text-[#ff5555]">操作失败</h3>
                                <button onClick={onClose} className="px-6 py-2 bg-[#44475a] border border-[#6272a4] text-[#f8f8f2] rounded hover:bg-[#6272a4]">
                                    关闭
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

// --- Settings Modal ---
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentConfig: GlobalConfig;
    onSave: (config: GlobalConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
    const [config, setConfig] = useState<GlobalConfig>(currentConfig);
    const [activeTab, setActiveTab] = useState<'ai' | 'oss'>('ai');
    
    // Model Fetching State
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(true);

    // AI Testing state
    const [aiTestInput, setAiTestInput] = useState("## 测试\n\n请分析这篇关于 React 的文章...");
    const [aiTestOutput, setAiTestOutput] = useState<AiAnalysisResult | null>(null);
    const [aiTestError, setAiTestError] = useState<string | null>(null);
    const [isAiTesting, setIsAiTesting] = useState(false);

    // OSS Testing state
    const [isOssTesting, setIsOssTesting] = useState(false);
    const [ossTestResult, setOssTestResult] = useState<{success: boolean, message: string, url?: string} | null>(null);

    useEffect(() => {
        if (isOpen) {
            setConfig(currentConfig);
            setAiTestOutput(null);
            setAiTestError(null);
            setOssTestResult(null);
            updateModelList(currentConfig);
        }
    }, [isOpen, currentConfig]);

    const updateModelList = (cfg: GlobalConfig) => {
        const defaults = cfg.ai.provider === AiProvider.GEMINI 
            ? DEFAULT_GEMINI_MODELS 
            : DEFAULT_CUSTOM_MODELS;
        let modelsList = [...defaults];
        if (cfg.ai.model && !modelsList.includes(cfg.ai.model)) {
            modelsList.unshift(cfg.ai.model);
        }
        setFetchedModels(modelsList);
        setShowModelDropdown(true);
    }

    const handleFetchModels = async () => {
        setIsFetchingModels(true);
        try {
            const models = await fetchModelList(config.ai);
            if (models.length > 0) {
                setFetchedModels(models);
                setShowModelDropdown(true);
            } else {
                alert("未找到可用模型，请切换到手动输入模式。");
            }
        } catch (e) {
            console.error(e);
            alert("获取模型列表失败: " + (e as Error).message);
        } finally {
            setIsFetchingModels(false);
        }
    }

    const handleRunAiTest = async () => {
        if (!aiTestInput.trim()) return;
        setIsAiTesting(true);
        setAiTestOutput(null);
        setAiTestError(null);
        try {
            const result = await analyzeBlogContent(aiTestInput, config.ai);
            setAiTestOutput(result);
        } catch (e) {
            console.error(e);
            setAiTestError((e as Error).message || "请求过程中发生未知错误，请检查网络或配置。");
        } finally {
            setIsAiTesting(false);
        }
    }

    const handleRunOssTest = async () => {
        setIsOssTesting(true);
        setOssTestResult(null);
        try {
            const result = await testOssConfig(config.oss);
            setOssTestResult(result);
        } catch (e) {
            setOssTestResult({ success: false, message: (e as Error).message });
        } finally {
            setIsOssTesting(false);
        }
        };

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value as AiProvider;
        const defaults = newProvider === AiProvider.GEMINI ? DEFAULT_GEMINI_MODELS : DEFAULT_CUSTOM_MODELS;
        
        const newConfig = {
            ...config, 
            ai: {
                ...config.ai, 
                provider: newProvider,
                model: defaults[0]
            }
        };
        setConfig(newConfig);
        updateModelList(newConfig);
    };

    const handleSaveConfig = () => {
        if (config.oss.enabled) {
            if (!config.oss.bucket?.trim()) { alert("请填写 OSS Bucket Name"); setActiveTab('oss'); return; }
            if (!config.oss.endpoint?.trim()) { alert("请填写 OSS Endpoint"); setActiveTab('oss'); return; }
            if (!config.oss.accessKey?.trim()) { alert("请填写 OSS Access Key"); setActiveTab('oss'); return; }
            if (!config.oss.secretKey?.trim()) { alert("请填写 OSS Secret Key"); setActiveTab('oss'); return; }
        }
        onSave(config);
        onClose();
    };

    const loadAiPreset = (key: string) => {
        const preset = (AI_PRESETS as any)[key];
        if (preset) {
            const newConfig = { ...config, ai: { ...config.ai, ...preset } };
            setConfig(newConfig);
            updateModelList(newConfig);
        }
    };

    const loadOssPreset = (key: string) => {
        const preset = (OSS_PRESETS as any)[key];
        if (preset) {
             setConfig({ ...config, oss: { ...config.oss, ...preset } });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#282a36]/90 backdrop-blur-sm">
            <div className="bg-[#282a36] border border-[#6272a4] rounded-xl shadow-2xl w-[1000px] h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#6272a4] bg-[#282a36]">
                    <h3 className="text-lg font-bold text-[#f8f8f2] flex items-center gap-2"><SettingsIcon /> 全局配置</h3>
                    <button onClick={onClose} className="text-[#6272a4] hover:text-[#f8f8f2] transition-colors"><CloseIcon /></button>
                </div>
                <div className="flex border-b border-[#6272a4] px-6">
                    <button onClick={() => setActiveTab('ai')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ai' ? 'border-[#bd93f9] text-[#bd93f9]' : 'border-transparent text-[#6272a4] hover:text-[#f8f8f2]'}`}>AI 模型设置</button>
                    <button onClick={() => setActiveTab('oss')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'oss' ? 'border-[#bd93f9] text-[#bd93f9]' : 'border-transparent text-[#6272a4] hover:text-[#f8f8f2]'}`}>OSS 对象存储</button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-[#282a36] relative">
                    {activeTab === 'ai' && (
                        <div className="space-y-6 max-w-4xl mx-auto pb-40">
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                                {Object.keys(AI_PRESETS).map(key => (
                                    <button key={key} onClick={() => loadAiPreset(key)} className="px-3 py-1 bg-[#44475a] hover:bg-[#bd93f9] hover:text-[#282a36] text-[#f8f8f2] text-xs rounded border border-[#6272a4] transition-colors whitespace-nowrap">Load {key}</button>
                                ))}
                            </div>
                            
                            {/* Main AI Config */}
                            <div className="p-5 bg-[#44475a]/30 rounded-lg border border-[#6272a4] space-y-4">
                                <h4 className="text-[#f8f8f2] font-semibold flex items-center gap-2"><SparklesIcon /> 提供商配置</h4>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#6272a4] uppercase font-bold">AI 提供商</label>
                                    <select value={config.ai.provider} onChange={handleProviderChange} className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none focus:border-[#bd93f9]">
                                        <option value={AiProvider.GEMINI}>Google Gemini</option>
                                        <option value={AiProvider.CUSTOM_OPENAI}>OpenAI 兼容 (DeepSeek/Qwen/GLM)</option>
                                    </select>
                                </div>
                                {config.ai.provider === AiProvider.CUSTOM_OPENAI && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs text-[#6272a4] uppercase font-bold">Base URL</label>
                                            <input type="text" value={config.ai.baseUrl || ''} onChange={(e) => setConfig({...config, ai: {...config.ai, baseUrl: e.target.value}})} placeholder="https://api.deepseek.com/v1" className="w-full px-3 py-2 bg-[#282a36] border border-[#6272a4] rounded text-[#f8f8f2] outline-none focus:border-[#bd93f9] text-sm font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-[#6272a4] uppercase font-bold">API Key</label>
                                            <input type="password" value={config.ai.apiKey || ''} onChange={(e) => setConfig({...config, ai: {...config.ai, apiKey: e.target.value}})} placeholder="sk-..." className="w-full px-3 py-2 bg-[#282a36] border border-[#6272a4] rounded text-[#f8f8f2] outline-none focus:border-[#bd93f9] text-sm font-mono" />
                                        </div>
                                    </>
                                )}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-[#6272a4] uppercase font-bold">模型名称 (Model ID)</label>
                                        <button onClick={() => setShowModelDropdown(!showModelDropdown)} className="flex items-center gap-1 text-[10px] text-[#bd93f9] hover:underline" title={showModelDropdown ? "切换到手动输入" : "切换到列表选择"}>{showModelDropdown ? <PencilIcon /> : <ListBulletIcon />}{showModelDropdown ? "手动输入" : "列表选择"}</button>
                                    </div>
                                    <div className="flex gap-2">
                                        {showModelDropdown ? (
                                             <select value={config.ai.model} onChange={(e) => setConfig({...config, ai: {...config.ai, model: e.target.value}})} className="flex-1 px-3 py-2 bg-[#282a36] border border-[#6272a4] rounded text-[#f8f8f2] outline-none focus:border-[#bd93f9] text-sm font-mono">
                                                {fetchedModels.map(m => (<option key={m} value={m}>{m}</option>))}
                                             </select>
                                        ) : (
                                            <input type="text" value={config.ai.model} onChange={(e) => setConfig({...config, ai: {...config.ai, model: e.target.value}})} className="flex-1 px-3 py-2 bg-[#282a36] border border-[#6272a4] rounded text-[#f8f8f2] outline-none focus:border-[#bd93f9] text-sm font-mono" placeholder={config.ai.provider === AiProvider.GEMINI ? "gemini-3-flash-preview" : "deepseek-chat"} />
                                        )}
                                        <button onClick={handleFetchModels} disabled={isFetchingModels} className="px-3 bg-[#44475a] border border-[#6272a4] rounded hover:bg-[#6272a4] text-[#f8f8f2] transition-colors disabled:opacity-50" title="刷新模型列表">{isFetchingModels ? (<div className="w-5 h-5 border-2 border-[#f8f8f2] border-t-transparent rounded-full animate-spin" />) : (<ArrowPathIcon />)}</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#f8f8f2]">系统提示词 (System Prompt)</label>
                                <textarea 
                                    value={config.ai.systemInstruction} 
                                    onChange={(e) => setConfig({...config, ai: {...config.ai, systemInstruction: e.target.value}})} 
                                    rows={8} 
                                    className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] text-[#f8f8f2] rounded-md text-sm font-mono focus:ring-2 focus:ring-[#bd93f9] outline-none leading-relaxed" 
                                />
                            </div>

                            {/* AI Test Section */}
                            <div className="mt-8 pt-6 border-t border-[#6272a4] animate-in slide-in-from-bottom-5">
                                <h4 className="text-[#f8f8f2] font-semibold flex items-center gap-2 mb-4">
                                    <SparklesIcon /> 模型连接测试
                                </h4>
                                <div className="flex gap-4 h-80">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-xs text-[#6272a4] uppercase font-bold">测试输入</label>
                                        <textarea 
                                            className="flex-1 w-full p-3 bg-[#1e1f29] border border-[#6272a4] text-[#f8f8f2] rounded-lg resize-none font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#bd93f9]" 
                                            value={aiTestInput} 
                                            onChange={(e) => setAiTestInput(e.target.value)} 
                                            placeholder="输入测试文本..."
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <button 
                                            onClick={handleRunAiTest} 
                                            disabled={isAiTesting} 
                                            className="p-3 bg-[#bd93f9] text-[#282a36] rounded-full hover:bg-[#ff79c6] disabled:bg-[#44475a] disabled:text-[#6272a4] shadow-lg transition-transform active:scale-95"
                                            title="发送测试请求"
                                        >
                                            {isAiTesting ? <div className="w-5 h-5 border-2 border-[#282a36] border-t-transparent rounded-full animate-spin" /> : <SparklesIcon />}
                                        </button>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2 relative">
                                        <label className="text-xs text-[#6272a4] uppercase font-bold">响应结果</label>
                                        <div className={`flex-1 w-full bg-[#1e1f29] border ${aiTestError ? 'border-[#ff5555]' : (aiTestOutput ? 'border-[#50fa7b]' : 'border-[#6272a4]')} rounded-lg overflow-auto p-3 transition-colors`}>
                                            {aiTestError ? (
                                                <div className="text-[#ff5555] text-xs font-mono whitespace-pre-wrap">
                                                    <div className="flex items-center gap-2 font-bold mb-2">
                                                        <ExclamationTriangleIcon />
                                                        请求失败
                                                    </div>
                                                    {aiTestError}
                                                </div>
                                            ) : aiTestOutput ? (
                                                <pre className="text-xs font-mono text-[#50fa7b] whitespace-pre-wrap">
                                                    {JSON.stringify(aiTestOutput, null, 2)}
                                                </pre>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-[#6272a4] text-xs italic">
                                                    {isAiTesting ? "正在等待 API 响应..." : "准备就绪"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'oss' && (
                        <div className="space-y-6 max-w-4xl mx-auto pb-40">
                             <div className="flex gap-2 mb-4">
                                {Object.keys(OSS_PRESETS).map(key => (
                                    <button key={key} onClick={() => loadOssPreset(key)} className="px-3 py-1 bg-[#44475a] hover:bg-[#bd93f9] hover:text-[#282a36] text-[#f8f8f2] text-xs rounded border border-[#6272a4] transition-colors whitespace-nowrap">Load {key}</button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-3 p-4 bg-[#bd93f9]/10 border border-[#bd93f9] rounded-lg">
                                <input type="checkbox" checked={config.oss.enabled} onChange={(e) => setConfig({...config, oss: {...config.oss, enabled: e.target.checked}})} className="w-5 h-5 accent-[#bd93f9] rounded bg-[#282a36] border-[#6272a4]" id="oss-enable" />
                                <label htmlFor="oss-enable" className="text-[#f8f8f2] font-semibold">启用对象存储 (保存时自动上传)</label>
                            </div>

                            <div className={`space-y-4 ${!config.oss.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-[#6272a4] uppercase font-bold">Provider Type</label>
                                        <select value={config.oss.provider} onChange={(e) => setConfig({...config, oss: {...config.oss, provider: e.target.value as any}})} className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none">
                                            <option value="minio">MinIO (Self-hosted)</option>
                                            <option value="oss">Aliyun OSS</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-[#6272a4] uppercase font-bold">Bucket Name <span className="text-[#ff5555]">*</span></label>
                                        <input type="text" value={config.oss.bucket} onChange={(e) => setConfig({...config, oss: {...config.oss, bucket: e.target.value}})} className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none" required={config.oss.enabled} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#6272a4] uppercase font-bold">Endpoint <span className="text-[#ff5555]">*</span></label>
                                    <input type="text" value={config.oss.endpoint} onChange={(e) => setConfig({...config, oss: {...config.oss, endpoint: e.target.value}})} placeholder="https://play.min.io" className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none" required={config.oss.enabled} />
                                </div>
                                {config.oss.provider === 'oss' && (
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs text-[#6272a4] uppercase font-bold">Region (Area)</label>
                                            <input type="text" value={config.oss.region || ''} onChange={(e) => setConfig({...config, oss: {...config.oss, region: e.target.value}})} placeholder="cn-wulanchabu" className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none" />
                                        </div>
                                         <div className="space-y-2">
                                            <label className="text-xs text-[#6272a4] uppercase font-bold">Custom Domain (Optional)</label>
                                            <input type="text" value={config.oss.customDomain || ''} onChange={(e) => setConfig({...config, oss: {...config.oss, customDomain: e.target.value}})} placeholder="https://cdn.example.com" className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none" />
                                        </div>
                                     </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-[#6272a4] uppercase font-bold">Access Key <span className="text-[#ff5555]">*</span></label>
                                        <input type="text" value={config.oss.accessKey} onChange={(e) => setConfig({...config, oss: {...config.oss, accessKey: e.target.value}})} className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none font-mono" required={config.oss.enabled} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-[#6272a4] uppercase font-bold">Secret Key <span className="text-[#ff5555]">*</span></label>
                                        <input type="password" value={config.oss.secretKey} onChange={(e) => setConfig({...config, oss: {...config.oss, secretKey: e.target.value}})} className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded text-[#f8f8f2] outline-none font-mono" required={config.oss.enabled} />
                                    </div>
                                </div>

                                <div className="p-4 bg-[#44475a]/30 border border-[#6272a4] rounded-lg mt-4 space-y-4">
                                    <h4 className="text-[#f8f8f2] font-semibold flex items-center gap-2 text-sm"><PhotoIcon /> 图片转链配置 (压缩 & Link Replacement)</h4>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={config.image.enabled} onChange={(e) => setConfig({...config, image: {...config.image, enabled: e.target.checked}})} className="w-4 h-4 accent-[#bd93f9]" id="img-enable" />
                                        <label htmlFor="img-enable" className="text-sm text-[#f8f8f2]">启用图片处理 (Resize & Convert)</label>
                                    </div>
                                    {config.image.enabled && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-[#6272a4] uppercase font-bold">压缩质量 ({config.image.compressQuality})</label>
                                                <input type="range" min="0.1" max="1.0" step="0.1" value={config.image.compressQuality} onChange={(e) => setConfig({...config, image: {...config.image, compressQuality: parseFloat(e.target.value)}})} className="w-full accent-[#bd93f9]" />
                                            </div>
                                             <div className="space-y-1">
                                                <label className="text-[10px] text-[#6272a4] uppercase font-bold">最大宽度 (px)</label>
                                                <input type="number" value={config.image.maxWidth} onChange={(e) => setConfig({...config, image: {...config.image, maxWidth: parseInt(e.target.value)}})} className="w-full px-2 py-1 bg-[#282a36] border border-[#6272a4] rounded text-[#f8f8f2] text-sm" />
                                            </div>
                                            <div className="flex items-center gap-2 col-span-2">
                                                <input type="checkbox" checked={config.image.convertToWebP} onChange={(e) => setConfig({...config, image: {...config.image, convertToWebP: e.target.checked}})} className="w-3 h-3 accent-[#bd93f9]" id="img-webp" />
                                                <label htmlFor="img-webp" className="text-xs text-[#f8f8f2]">转换为 WebP 格式 (体积更小)</label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* OSS Test Section */}
                                <div className="mt-8 pt-6 border-t border-[#6272a4] animate-in slide-in-from-bottom-5">
                                    <h4 className="text-[#f8f8f2] font-semibold flex items-center gap-2 mb-4">
                                        <LinkIcon /> 存储连接测试
                                    </h4>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={handleRunOssTest}
                                                disabled={isOssTesting || !config.oss.enabled}
                                                className="px-4 py-2 bg-[#bd93f9] text-[#282a36] text-sm font-bold rounded hover:bg-[#ff79c6] disabled:bg-[#44475a] disabled:text-[#6272a4] transition-colors flex items-center gap-2"
                                            >
                                                {isOssTesting ? <div className="w-4 h-4 border-2 border-[#282a36] border-t-transparent rounded-full animate-spin" /> : <ArrowPathIcon />}
                                                检查配置 & 生成链接
                                            </button>
                                            <p className="text-xs text-[#6272a4]">注意：因浏览器安全策略 (CORS)，实际上传可能需要服务端签名。</p>
                                        </div>
                                        {ossTestResult && (
                                            <div className={`p-4 rounded-lg border text-sm flex flex-col gap-2 ${ossTestResult.success ? 'bg-[#50fa7b]/10 border-[#50fa7b]/50 text-[#50fa7b]' : 'bg-[#ff5555]/10 border-[#ff5555]/50 text-[#ff5555]'}`}>
                                                <div className="font-bold flex items-center gap-2">
                                                    {ossTestResult.success ? <CheckCircleIcon /> : <WarningIcon />}
                                                    {ossTestResult.success ? "测试成功 (Path Generated)" : "测试失败"}
                                                </div>
                                                <p>{ossTestResult.message}</p>
                                                {ossTestResult.url && (
                                                    <div className="mt-2 p-2 bg-[#282a36] rounded border border-[#6272a4]/50 break-all text-xs font-mono text-[#f8f8f2]">
                                                        {ossTestResult.url}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-[#6272a4] bg-[#282a36] flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#f8f8f2] bg-[#44475a] border border-[#6272a4] rounded hover:bg-[#6272a4]">取消</button>
                    <button onClick={handleSaveConfig} className="px-4 py-2 text-sm font-bold text-[#282a36] bg-[#bd93f9] rounded hover:bg-[#ff79c6]">保存配置</button>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component ---

export default function App() {
  const [content, setContent] = useState<string>("# 欢迎使用 AI 博客助手\n\n请在此处开始撰写您的文章...");
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [processingErrors, setProcessingErrors] = useState<Array<{path: string, reason: string, isLocalMissing?: boolean}>>([]);
  const [missingLocalPaths, setMissingLocalPaths] = useState<string[]>([]);
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [ossUrl, setOssUrl] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  // UI State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Hide preview mode unless saved
  const [isSaved, setIsSaved] = useState(false);

  // Global Config
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
      ai: {
          provider: AiProvider.GEMINI,
          model: DEFAULT_GEMINI_MODELS[0],
          temperature: 0.3,
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION
      },
      oss: {
          enabled: false,
          provider: 'minio',
          endpoint: 'http://localhost:9000',
          bucket: 'blog-content',
          accessKey: '',
          secretKey: ''
      },
      image: {
          enabled: false,
          compressQuality: 0.8,
          maxWidth: 1920,
          convertToWebP: true
      }
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setAnalysisResult(null); 
    if (isSaved) setIsSaved(false); // Mark as unsaved on change
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setContent(event.target.result);
        setAnalysisResult(null);
        setIsSaved(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        setCoverImage(url);
    }
  };

  const handleSaveToDb = async (uploadedFiles: File[] = []) => {
    setProcessingErrors([]); 
    setMissingLocalPaths([]);
    
    try {
        // 1. Process Images Middleware
        let finalContent = content;
        
        if (globalConfig.oss.enabled && globalConfig.image.enabled) {
            setLoadingState(LoadingState.PROCESSING_IMAGES);
            // Pass uploaded files (if any) to the service
            const result = await processMarkdownImages(content, globalConfig, uploadedFiles);
            
            // If missing local files, stop and ask for folder
            if (result.missingLocalPaths.length > 0) {
                 setProcessingErrors(result.errors);
                 setMissingLocalPaths(result.missingLocalPaths);
                 setLoadingState(LoadingState.WAITING_FOR_ASSETS);
                 return; // STOP execution
            }

            finalContent = result.content;
            setContent(result.content); // Update editor with OSS links

            if (result.errors.length > 0) {
                setProcessingErrors(result.errors);
            }
        }

        setLoadingState(LoadingState.SAVING_TO_DB);
        // Simulate DB Save
        await new Promise(resolve => setTimeout(resolve, 600));

        // Handle OSS Upload Simulation (Upload the Markdown file itself)
        if (globalConfig.oss.enabled) {
            setLoadingState(LoadingState.UPLOADING_OSS);
            await new Promise(resolve => setTimeout(resolve, 800));
            setOssUrl(`${globalConfig.oss.endpoint}/${globalConfig.oss.bucket}/draft-${Date.now()}.md`);
        }

        setLastSaved(new Date());
        setIsSaved(true); // Enable Preview
        setLoadingState(LoadingState.COMPLETE);

    } catch (e) {
        console.error("Save failed", e);
        setLoadingState(LoadingState.ERROR);
    }
  };

  const handleFolderUploadCallback = (fileList: FileList) => {
      // Resume saving with the new files
      const files = Array.from(fileList);
      handleSaveToDb(files);
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    if (!lastSaved) { alert("请先将内容保存到数据库。"); return; }

    setLoadingState(LoadingState.ANALYZING);
    try {
      const result = await analyzeBlogContent(content, globalConfig.ai);
      setAnalysisResult(result);
      setLoadingState(LoadingState.COMPLETE);
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
      alert(`分析失败: ${(error as Error).message}`);
    }
  };

  const handleMetaChange = (field: keyof AiAnalysisResult, value: any) => {
    if (!analysisResult) return;
    setAnalysisResult({ ...analysisResult, [field]: value });
  };

  const handleRemoveTag = (indexToRemove: number) => {
    if (!analysisResult) return;
    const newTags = analysisResult.tags.filter((_, index) => index !== indexToRemove);
    handleMetaChange('tags', newTags);
  };

  const handleAddTag = () => {
    if (!analysisResult || !newTagInput.trim()) return;
    if (!analysisResult.tags.includes(newTagInput.trim())) {
        const newTags = [...analysisResult.tags, newTagInput.trim()];
        handleMetaChange('tags', newTags);
    }
    setNewTagInput("");
  };

  const getStatusColor = () => {
    if (loadingState === LoadingState.WAITING_FOR_ASSETS) return "bg-[#ffb86c]"; // Orange/Yellow
    if (loadingState === LoadingState.PROCESSING_IMAGES) return "bg-[#ff79c6]";
    if (loadingState === LoadingState.SAVING_TO_DB) return "bg-[#f1fa8c]";
    if (loadingState === LoadingState.UPLOADING_OSS) return "bg-[#ffb86c]";
    if (loadingState === LoadingState.ANALYZING) return "bg-[#8be9fd]";
    if (loadingState === LoadingState.COMPLETE && processingErrors.length > 0) return "bg-[#ff5555]"; 
    if (lastSaved && !analysisResult) return "bg-[#50fa7b]";
    if (analysisResult) return "bg-[#ff79c6]";
    return "bg-[#6272a4]";
  };

  const getStatusText = () => {
     if (loadingState === LoadingState.WAITING_FOR_ASSETS) return "等待上传资源...";
     if (loadingState === LoadingState.PROCESSING_IMAGES) return "处理图片资源 (压缩/上传)...";
     if (loadingState === LoadingState.SAVING_TO_DB) return "正在同步到数据库...";
     if (loadingState === LoadingState.UPLOADING_OSS) return "正在上传文档至 OSS...";
     if (loadingState === LoadingState.ANALYZING) return "AI 正在分析...";
     if (lastSaved && !analysisResult) return `已保存 ${lastSaved.toLocaleTimeString()}`;
     if (analysisResult) return "分析完成 (可编辑)";
     return "草稿 (未保存)";
  }

  return (
    <div className="flex flex-col h-screen bg-[#282a36]">
      <ProcessingOverlay 
        state={loadingState} 
        errors={processingErrors}
        missingPaths={missingLocalPaths}
        onClose={() => setLoadingState(LoadingState.IDLE)}
        onUploadFolder={handleFolderUploadCallback}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentConfig={globalConfig}
        onSave={setGlobalConfig}
      />

      <header className="bg-[#282a36] border-b border-[#6272a4] px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-[#bd93f9] rounded-lg flex items-center justify-center text-[#282a36] font-bold shadow-lg shadow-[#bd93f9]/20">
             AI
           </div>
           <h1 className="text-xl font-bold text-[#f8f8f2] tracking-tight">博客 CMS <span className="text-[#6272a4] font-normal">| 编辑器</span></h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#f8f8f2]">
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse shadow-md shadow-current`}></span>
                {getStatusText()}
            </div>
            <div className="h-6 w-px bg-[#6272a4] mx-2"></div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#44475a] rounded-md transition-colors"
                    title="全局配置"
                >
                    <SettingsIcon />
                </button>
                <button 
                    onClick={() => handleSaveToDb()}
                    disabled={loadingState !== LoadingState.IDLE && loadingState !== LoadingState.COMPLETE && loadingState !== LoadingState.ERROR}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#f8f8f2] bg-[#44475a] border border-[#6272a4] rounded-md hover:bg-[#6272a4] disabled:opacity-50 transition-colors"
                >
                    {globalConfig.oss.enabled ? <CloudIcon /> : <DatabaseIcon />}
                    {globalConfig.oss.enabled ? "保存并上传" : "保存到数据库"}
                </button>
                <button 
                    onClick={handleAnalyze}
                    disabled={loadingState === LoadingState.ANALYZING || !lastSaved}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#282a36] bg-[#bd93f9] rounded-md hover:bg-[#ff79c6] disabled:bg-[#44475a] disabled:text-[#6272a4] disabled:cursor-not-allowed shadow-lg shadow-[#bd93f9]/20 transition-all"
                >
                    {loadingState === LoadingState.ANALYZING ? (
                         <div className="w-5 h-5 border-2 border-[#282a36]/30 border-t-[#282a36] rounded-full animate-spin" />
                    ) : (
                        <SparklesIcon />
                    )}
                    一键 AI 分析
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT: Markdown Editor / Preview */}
        <div className="flex-1 flex flex-col border-r border-[#6272a4] bg-[#282a36] relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {isSaved && (
                    <button 
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#f8f8f2] bg-[#44475a] border border-[#6272a4] rounded-md hover:bg-[#6272a4] transition-colors animate-in fade-in"
                    >
                        {isPreviewMode ? <EyeSlashIcon /> : <EyeIcon />}
                        {isPreviewMode ? "编辑模式" : "预览模式"}
                    </button>
                )}
                {!isPreviewMode && (
                    <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#f8f8f2] bg-[#44475a] border border-[#6272a4] rounded-md cursor-pointer hover:bg-[#6272a4] transition-colors">
                        <DocumentIcon />
                        导入 .md
                        <input type="file" accept=".md" onChange={handleFileUpload} className="hidden" />
                    </label>
                )}
            </div>

            {isPreviewMode ? (
                <div className="w-full h-full p-8 overflow-y-auto bg-[#282a36]">
                    <div className="markdown-body max-w-4xl mx-auto">
                        {coverImage && (
                            <img 
                                src={coverImage} 
                                alt="Cover" 
                                className="w-full h-auto rounded-xl mb-8 shadow-2xl object-cover max-h-[500px]" 
                            />
                        )}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                <textarea 
                    className="w-full h-full p-8 resize-none focus:outline-none text-[#f8f8f2] bg-[#282a36] leading-relaxed font-mono text-base placeholder-[#6272a4]"
                    value={content}
                    onChange={handleContentChange}
                    placeholder="# 开始写作..."
                    spellCheck={false}
                />
            )}
        </div>

        {/* RIGHT: Metadata Panel */}
        <div className="w-[450px] bg-[#282a36] flex flex-col border-l border-[#6272a4] overflow-y-auto">
            <div className="p-6 border-b border-[#6272a4] bg-[#282a36]">
                <h2 className="text-lg font-semibold text-[#f8f8f2] flex items-center gap-2">
                    <DocumentIcon />
                    元数据 (Metadata)
                </h2>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-[#6272a4]">模型: {globalConfig.ai.model}</p>
                    {globalConfig.oss.enabled && ossUrl && (
                        <span className="text-[10px] bg-[#50fa7b]/20 text-[#50fa7b] px-2 py-0.5 rounded border border-[#50fa7b]/30">OSS 已上传</span>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                
                {/* Cover Image Uploader - Always Visible */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">封面图 (Cover Image)</label>
                    <div className="border-2 border-dashed border-[#6272a4] rounded-lg p-4 text-center hover:border-[#bd93f9] transition-colors relative group bg-[#44475a]/20">
                        {coverImage ? (
                            <div className="relative">
                                <img src={coverImage} className="w-full h-32 object-cover rounded-md border border-[#6272a4]" alt="Cover Preview" />
                                <button onClick={() => setCoverImage(null)} className="absolute top-1 right-1 bg-black/60 text-white p-1.5 rounded-full hover:bg-[#ff5555] transition-colors">
                                    <XMarkIcon />
                                </button>
                            </div>
                        ) : (
                            <label className="cursor-pointer block">
                                <PhotoIcon className="mx-auto h-8 w-8 text-[#6272a4] mb-2 group-hover:text-[#bd93f9] transition-colors" />
                                <span className="text-sm text-[#f8f8f2] group-hover:text-[#bd93f9] transition-colors">点击上传封面</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
                            </label>
                        )}
                    </div>
                </div>

                {!analysisResult && (
                    <div className="text-center py-6 opacity-50 border-t border-[#6272a4]">
                        <div className="mx-auto w-12 h-12 bg-[#44475a] rounded-full flex items-center justify-center mb-3 text-[#f8f8f2]">
                            <SparklesIcon />
                        </div>
                        <p className="text-[#f8f8f2] font-medium text-sm">暂无 AI 分析结果</p>
                        <p className="text-xs text-[#6272a4] mt-1">保存后点击“一键 AI 分析”自动填充以下信息</p>
                    </div>
                )}

                {analysisResult && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">建议标题</label>
                            <input 
                                type="text" 
                                value={analysisResult.title} 
                                onChange={(e) => handleMetaChange('title', e.target.value)}
                                className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded-md text-[#f8f8f2] text-sm focus:ring-2 focus:ring-[#bd93f9] outline-none" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">Slug</label>
                                <input 
                                    type="text" 
                                    value={analysisResult.suggestedSlug} 
                                    onChange={(e) => handleMetaChange('suggestedSlug', e.target.value)}
                                    className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded-md text-[#f8f8f2] text-sm outline-none focus:ring-2 focus:ring-[#bd93f9]" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">阅读时间</label>
                                <input type="text" readOnly value={`${analysisResult.readingTimeMinutes} 分钟`} className="w-full px-3 py-2 bg-[#282a36] border border-[#6272a4] rounded-md text-[#6272a4] text-sm outline-none cursor-not-allowed" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">摘要</label>
                            <textarea 
                                rows={4} 
                                value={analysisResult.summary} 
                                onChange={(e) => handleMetaChange('summary', e.target.value)}
                                className="w-full px-3 py-2 bg-[#44475a] border border-[#6272a4] rounded-md text-[#f8f8f2] text-sm outline-none resize-none focus:ring-2 focus:ring-[#bd93f9]" 
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">标签</label>
                            <div className="flex flex-wrap gap-2">
                                {analysisResult.tags.map((tag, idx) => (
                                    <div key={idx} className="flex items-center gap-1 px-2.5 py-1 bg-[#bd93f9]/20 text-[#bd93f9] text-xs font-medium rounded-full border border-[#bd93f9]/50 group hover:border-[#bd93f9] transition-colors">
                                        <span>#{tag}</span>
                                        <button 
                                            onClick={() => handleRemoveTag(idx)}
                                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors"
                                        >
                                            <XMarkIcon />
                                        </button>
                                    </div>
                                ))}
                                
                                <div className="flex items-center gap-1 bg-[#44475a] border border-[#6272a4] rounded-full px-2 py-1 focus-within:border-[#bd93f9] focus-within:ring-1 focus-within:ring-[#bd93f9]">
                                    <PlusIcon />
                                    <input 
                                        type="text" 
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        onBlur={handleAddTag}
                                        placeholder="Add tag"
                                        className="bg-transparent border-none outline-none text-xs text-[#f8f8f2] w-16 placeholder-[#6272a4]"
                                    />
                                </div>
                            </div>
                        </div>
                         <div className="mt-8 pt-6 border-t border-[#6272a4]">
                             <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">Payload Preview</label>
                                <span className="text-[10px] bg-[#44475a] border border-[#6272a4] text-[#f8f8f2] px-1.5 py-0.5 rounded">实时更新</span>
                             </div>
                             <pre className="w-full p-3 bg-[#1e1f29] rounded-md overflow-x-auto border border-[#6272a4]">
                                <code className="text-xs font-mono text-[#50fa7b]">
                                    {JSON.stringify({
                                        id: "mongo_obj_123",
                                        meta: { ...analysisResult, coverImage },
                                        ossUrl: ossUrl || "not_uploaded",
                                        status: "ready"
                                    }, null, 2)}
                                </code>
                             </pre>
                         </div>
                    </>
                )}
            </div>
            
            {analysisResult && (
                <div className="p-6 bg-[#282a36] border-t border-[#6272a4] mt-auto sticky bottom-0">
                    <button className="w-full py-2.5 bg-[#ff79c6] text-[#282a36] text-sm font-bold rounded-md hover:bg-[#ff92d0] transition-colors shadow-lg shadow-[#ff79c6]/20">
                        确认并推送到 CMS
                    </button>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
