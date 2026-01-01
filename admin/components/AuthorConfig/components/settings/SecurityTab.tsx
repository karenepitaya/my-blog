import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { CyberInput } from '../ui/CyberInput';
import { ShieldAlert, KeyRound } from 'lucide-react';

interface SecurityTabProps {
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ onChangePassword }) => {
  const [formData, setFormData] = useState({ current: '', next: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    const currentPassword = formData.current.trim();
    const newPassword = formData.next.trim();
    const confirmPassword = formData.confirm.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('请完整填写密码信息。');
      setSuccessMessage('');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('两次输入的新密码不一致。');
      setSuccessMessage('');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onChangePassword({ currentPassword, newPassword });
      setSuccessMessage('密码已更新，请重新登录确认。');
      setFormData({ current: '', next: '', confirm: '' });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassCard className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-danger">
        <ShieldAlert size={14} /> 安全设置
      </div>

      <div className="grid grid-cols-1 gap-4">
        <CyberInput
          type="password"
          label="当前密码"
          value={formData.current}
          onChange={(e) => setFormData(prev => ({ ...prev, current: e.target.value }))}
          placeholder="请输入当前密码"
          editable={false}
        />
        <CyberInput
          type="password"
          label="新密码"
          value={formData.next}
          onChange={(e) => setFormData(prev => ({ ...prev, next: e.target.value }))}
          placeholder="至少 6 位"
          editable={false}
        />
        <CyberInput
          type="password"
          label="确认新密码"
          value={formData.confirm}
          onChange={(e) => setFormData(prev => ({ ...prev, confirm: e.target.value }))}
          placeholder="再次输入新密码"
          editable={false}
        />
      </div>

      {(errorMessage || successMessage) && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            errorMessage
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          {errorMessage || successMessage}
        </div>
      )}

      <div className="flex justify-end">
        <NeonButton
          variant="primary"
          icon={<KeyRound size={14} />}
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '更新密码'}
        </NeonButton>
      </div>
    </GlassCard>
  );
};
