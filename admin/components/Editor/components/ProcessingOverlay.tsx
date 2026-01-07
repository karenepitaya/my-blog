import React, { useEffect, useRef } from 'react';
import type { ProcessingError, ProcessingState } from '../types';
import { CheckCircleIcon, FolderIcon } from './icons';

interface ProcessingOverlayProps {
  state: ProcessingState;
  errors: ProcessingError[];
  missingPaths: string[];
  onClose: () => void;
  onUploadFolder: (files: FileList) => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  state,
  errors,
  missingPaths,
  onClose,
  onUploadFolder,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVisible = state !== 'IDLE';
  const isProcessing = state === 'PROCESSING_IMAGES' || state === 'SAVING_DRAFT' || state === 'SAVING_PUBLISH';
  const isWaiting = state === 'WAITING_FOR_ASSETS';
  const isError = state === 'ERROR';
  const isComplete = state === 'COMPLETE';
  const hasErrors = errors.length > 0;

  const ensureFolderInputAttributes = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.setAttribute('webkitdirectory', '');
    fileInputRef.current.setAttribute('directory', '');
    fileInputRef.current.setAttribute('mozdirectory', '');
    fileInputRef.current.setAttribute('msdirectory', '');
    fileInputRef.current.setAttribute('odirectory', '');
  };

  useEffect(() => {
    ensureFolderInputAttributes();
  }, []);

  useEffect(() => {
    if (isComplete && !hasErrors) {
      const timer = setTimeout(onClose, 900);
      return () => clearTimeout(timer);
    }
  }, [hasErrors, isComplete, onClose]);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    onUploadFolder(files);
  };

  const openFolderDialog = () => {
    if (!fileInputRef.current) return;
    ensureFolderInputAttributes();
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  let message = '正在处理...';
  if (state === 'PROCESSING_IMAGES') message = '正在处理图片资源...';
  if (state === 'SAVING_DRAFT') message = '正在保存草稿...';
  if (state === 'SAVING_PUBLISH') message = '正在发布文章...';

  if (!isVisible) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFolderSelect}
      />
      <div className="fixed inset-0 z-[120] backdrop-blur-md bg-[var(--admin-ui-backdrop-soft)] flex items-center justify-center p-6">
        <div className="bg-[#44475a] border border-[#6272a4] rounded-2xl shadow-2xl p-8 max-w-xl w-full text-center">
          {isProcessing && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#bd93f9]/30 border-t-[#bd93f9] rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-[#f8f8f2]">{message}</h3>
              <p className="text-xs text-[#6272a4]">请勿关闭页面</p>
            </div>
          )}

          {isWaiting && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-[#bd93f9]/10 rounded-full border border-[#bd93f9]/30">
                <FolderIcon />
              </div>
              <h3 className="text-lg font-bold text-[#f8f8f2]">需要补齐本地图片</h3>
              <p className="text-xs text-[#6272a4]">
                检测到 Markdown 引用了本地文件，请选择对应的图片目录继续上传。
              </p>
              <div className="w-full text-left bg-[#282a36] rounded-lg p-3 text-xs max-h-36 overflow-y-auto font-mono text-[#ffb86c] border border-[#6272a4]">
                {missingPaths.map((path, index) => (
                  <div key={`${path}-${index}`}>{path}</div>
                ))}
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-[#282a36] text-[#f8f8f2] rounded-lg border border-[#6272a4] hover:bg-[#6272a4]"
                >
                  取消保存
                </button>
                <button
                  onClick={openFolderDialog}
                  className="flex-1 py-2 bg-[#bd93f9] text-[#282a36] font-bold rounded-lg hover:bg-[#ff79c6]"
                >
                  选择文件夹
                </button>
              </div>
            </div>
          )}

          {isError && (
            <div className="text-left">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#ffb86c] text-lg font-black">处理失败</span>
              </div>
              {hasErrors && (
                <div className="bg-[#282a36] rounded-md border border-[#ff5555]/50 p-4 max-h-60 overflow-y-auto mb-6">
                  {errors.map((err, index) => (
                    <div key={`${err.path}-${index}`} className="mb-2 last:mb-0 text-sm">
                      <p className="text-[#ff5555] font-mono break-all">{err.path}</p>
                      <p className="text-[#6272a4] text-xs mt-0.5">{err.reason}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-2 bg-[#ff5555] text-white rounded font-bold hover:bg-[#ff6e6e]"
              >
                关闭
              </button>
            </div>
          )}

          {isComplete && !hasErrors && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircleIcon />
              <h3 className="text-lg font-bold text-[#f8f8f2]">保存成功</h3>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
