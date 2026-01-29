import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { UserRole, User } from '../types';
import { ApiService } from '../services/api';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { FormField } from './ui/FormField';
import { Input } from './ui/Input';

interface AuthProps {
  onLogin: (user: User, token: string) => void;
}

type DebugAccount = {
  username: string;
  password: string;
};

type DebugAccounts = {
  admin: DebugAccount | null;
  author: DebugAccount | null;
};

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.AUTHOR);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugAccounts, setDebugAccounts] = useState<DebugAccounts | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isDev = Boolean(import.meta.env.DEV);

  useEffect(() => {
    if (!isDev) return;
    let active = true;
    ApiService.getDebugAccounts()
      .then(data => {
        if (active) setDebugAccounts(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isDev]);

  const handleDebugFill = (account: DebugAccount | null) => {
    if (!account) return;
    setUsername(account.username);
    setPassword(account.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { user, token } = await ApiService.login(username, password, role);
      onLogin(user, token);
    } catch (err) {
      setError('登录失败，请检查用户名、密码和角色。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const adminAccount = debugAccounts?.admin ?? null;
  const authorAccount = debugAccounts?.author ?? null;
  const adminUsername = adminAccount?.username || '未配置';
  const adminPassword = adminAccount?.password || '未配置';
  const authorUsername = authorAccount?.username || '未配置';
  const authorPassword = authorAccount?.password || '未配置';
  const adminClickableClass = adminAccount
    ? 'cursor-pointer'
    : 'cursor-not-allowed opacity-60';
  const authorClickableClass = authorAccount
    ? 'cursor-pointer'
    : 'cursor-not-allowed opacity-60';

  return (
    <div className="admin-theme min-h-screen bg-canvas text-fg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle ambient backdrop (low AI vibe, no animation). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-260px] right-[-260px] h-[520px] w-[520px] rounded-full bg-secondary/6 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-fg/[0.03] via-transparent to-transparent" />
      </div>

      <div className="w-full max-w-md md:max-w-lg space-y-5 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">MultiTerm</h1>
          <p className="text-sm text-muted">管理后台登录 · karenepitaya.xyz</p>
          {isDev ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/5 px-3 py-1 text-[12px] text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              开发模式：可用测试账号填充
            </div>
          ) : null}
        </div>

        <Card padded={false} className="overflow-hidden">
          <div className="p-6 sm:p-7 border-b border-fg/10">
            <div
              role="radiogroup"
              aria-label="选择登录角色"
              className="grid grid-cols-2 gap-1 rounded-xl border border-fg/10 bg-fg/4 p-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={role === UserRole.AUTHOR}
                onClick={() => setRole(UserRole.AUTHOR)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  role === UserRole.AUTHOR ? 'bg-fg/8 text-fg' : 'text-muted hover:text-fg hover:bg-fg/5'
                }`}
              >
                作者登录
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === UserRole.ADMIN}
                onClick={() => setRole(UserRole.ADMIN)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  role === UserRole.ADMIN ? 'bg-fg/8 text-fg' : 'text-muted hover:text-fg hover:bg-fg/5'
                }`}
              >
                管理员登录
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5" aria-busy={isSubmitting}>
            <FormField label="用户名 / 邮箱" required hint="支持用户名或邮箱；请确保角色选择正确。">
              <Input
                type="text"
                required
                disabled={isSubmitting}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名或邮箱"
                autoComplete="username"
              />
            </FormField>

            <FormField label="密码" required hint="区分大小写。">
              <div className="relative">
                <Input
                  type={passwordVisible ? 'text' : 'password'}
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className="pr-12"
                  onKeyDown={handlePasswordKeyEvent}
                  onKeyUp={handlePasswordKeyEvent}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    setCapsLockOn(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(v => !v)}
                  disabled={isSubmitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-fg hover:bg-fg/5 transition-colors disabled:opacity-60"
                  aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                >
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordFocused && capsLockOn ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-warning">
                  <TriangleAlert className="w-4 h-4" />
                  大写锁定已开启
                </div>
              ) : null}
            </FormField>

            {error ? (
              <Alert role="alert" variant="danger">
                {error}
              </Alert>
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              登录
            </Button>
          </form>
        </Card>

        {isDev ? (
          <Card padded={false}>
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-fg">测试账号（仅开发）</div>
                  <div className="mt-1 text-xs text-muted">点击卡片可自动填充到表单。</div>
                </div>
                <div className="text-[11px] text-muted font-mono shrink-0">Vite HMR: on</div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <button
                  type="button"
                  className={`text-left rounded-xl border border-fg/10 bg-fg/4 px-4 py-3 transition-colors hover:bg-fg/6 disabled:hover:bg-fg/4 ${adminClickableClass}`}
                  onClick={() => handleDebugFill(adminAccount)}
                  disabled={!adminAccount}
                >
                  <div className="text-xs text-muted">管理员</div>
                  <div className="mt-1 font-semibold text-fg truncate">{adminUsername}</div>
                  <div className="mt-1 text-xs text-warning/90 truncate">{adminPassword}</div>
                </button>

                <button
                  type="button"
                  className={`text-left rounded-xl border border-fg/10 bg-fg/4 px-4 py-3 transition-colors hover:bg-fg/6 disabled:hover:bg-fg/4 ${authorClickableClass}`}
                  onClick={() => handleDebugFill(authorAccount)}
                  disabled={!authorAccount}
                >
                  <div className="text-xs text-muted">作者</div>
                  <div className="mt-1 font-semibold text-fg truncate">{authorUsername}</div>
                  <div className="mt-1 text-xs text-warning/90 truncate">{authorPassword}</div>
                </button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default Auth;
