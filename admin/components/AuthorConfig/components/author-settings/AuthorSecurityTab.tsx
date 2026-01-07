import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { CyberInput } from '../ui/CyberInput';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface AuthorSecurityTabProps {
    onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
}

export const AuthorSecurityTab: React.FC<AuthorSecurityTabProps> = ({ onChangePassword }) => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleSubmit = async () => {
        const currentPassword = formData.oldPassword.trim();
        const newPassword = formData.newPassword.trim();
        const confirmPassword = formData.confirmPassword.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            setStatus('error');
            setShowSaveConfirm(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus('error');
            setShowSaveConfirm(false);
            return;
        }

        setIsSaving(true);
        setShowSaveConfirm(false);
        try {
            await onChangePassword({ currentPassword, newPassword });
            setStatus('success');
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            setStatus('error');
            alert((err as Error).message || '密码更新失败。');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <GlassCard>
                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><ShieldCheck size={18} /></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-200">安全设置</h3>
                    </div>
                </div>

                <div className="max-w-md mx-auto space-y-4 py-2">
                     <div className="space-y-3">
                        <CyberInput 
                            type="password" 
                            label="当前密码" 
                            value={formData.oldPassword} 
                            onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
                        />
                        <div className="w-full h-px bg-white/5 my-3"></div>
                        <CyberInput 
                            type="password" 
                            label="新密码" 
                            value={formData.newPassword} 
                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        />
                        <CyberInput 
                            type="password" 
                            label="确认新密码" 
                            value={formData.confirmPassword} 
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className={status === 'error' ? 'border-red-500/50' : ''}
                        />
                     </div>

                     {status === 'error' && (
                         <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                             <AlertCircle size={14} /> 两次输入的密码不一致                         </div>
                     )}

                     {status === 'success' && (
                         <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                             <ShieldCheck size={14} /> 密码修改成功，请重新登录
                         </div>
                     )}

                     <div className="flex justify-end pt-2">
                         <NeonButton variant="primary" icon={<KeyRound size={14} />} onClick={() => setShowSaveConfirm(true)} disabled={isSaving}>
                             重置密码
                         </NeonButton>
                     </div>
                </div>
            </GlassCard>

            {/* Save Confirmation */}
            <ConfirmModal 
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleSubmit}
                title="确认重置密码"
                message="修改密码会让当前会话失效，请妥善保存新密码。"
                type="danger"
                confirmText="确认重置"
            />
        </div>
    );
};
