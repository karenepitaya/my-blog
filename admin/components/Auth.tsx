import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, TriangleAlert, User as UserIcon, Shield, Lock, Terminal } from 'lucide-react';
import { UserRole, User } from '../types';
import { ApiService } from '../services/api';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.AUTHOR);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('multiTerm_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { user } = await ApiService.login(username, password, role);
      if (rememberMe) {
        localStorage.setItem('multiTerm_username', username);
      } else {
        localStorage.removeItem('multiTerm_username');
      }
      onLogin(user);
    } catch (err) {
      setError('登录失败，请检查用户名、密码和角色。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const usernameLabel = role === UserRole.ADMIN ? '管理员 ID / 邮箱' : '用户名';
  const usernamePlaceholder = role === UserRole.ADMIN ? 'admin@multiterm.io' : '请输入用户名';

  return (
    <div className="admin-theme min-h-screen bg-canvas text-fg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-260px] right-[-260px] h-[520px] w-[520px] rounded-full bg-secondary/6 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-fg/[0.03] via-transparent to-transparent" />
      </div>

      <div className="w-full max-w-sm sm:max-w-md space-y-6 relative z-10">
        <div className="flex items-center justify-center gap-4">
          <div className="soft-glow rounded-2xl p-3 bg-fg/5 border border-fg/10">
            <Terminal className="h-9 w-9 text-primary" />
          </div>
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-semibold tracking-tight font-terminal bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
              MultiTerm Admin
            </h1>
          </div>
        </div>

        <div className="login-card glass-panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
          <span aria-hidden className="login-glow-line" />

          <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSubmitting} noValidate>
            <div
              role="radiogroup"
              aria-label="选择登录角色"
              className="role-switch flex items-center rounded-xl p-1 bg-fg/5 border border-fg/10"
            >
              <span
                aria-hidden
                className="role-slider role-slider-motion"
                style={{ left: role === UserRole.AUTHOR ? '4px' : 'calc(50%)' }}
              />
              <button
                type="button"
                role="radio"
                aria-checked={role === UserRole.AUTHOR}
                onClick={() => setRole(UserRole.AUTHOR)}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  role === UserRole.AUTHOR ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                <UserIcon className={`h-4 w-4 ${role === UserRole.AUTHOR ? 'text-primary' : 'text-muted'}`} />
                普通用户
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === UserRole.ADMIN}
                onClick={() => setRole(UserRole.ADMIN)}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  role === UserRole.ADMIN ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                <Shield className={`h-4 w-4 ${role === UserRole.ADMIN ? 'text-primary' : 'text-muted'}`} />
                管理员
              </button>
            </div>

            <div className="space-y-5">
              <div className="login-field">
                <label htmlFor="username" className="login-label">
                  {usernameLabel} <span className="text-danger">*</span>
                </label>
                <div className={`login-input ${error ? 'login-input-error' : ''}`}>
                  <UserIcon className="login-input-icon" />
                  <input
                    id="username"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder={usernamePlaceholder}
                    autoComplete="username"
                    className="login-input-control"
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => setUsernameFocused(false)}
                    aria-invalid={Boolean(error)}
                  />
                </div>
                {usernameFocused ? <div className="login-hint">支持用户名或邮箱。</div> : null}
              </div>

              <div className="login-field">
                <label htmlFor="password" className="login-label">
                  密码 <span className="text-danger">*</span>
                </label>
                <div className={`login-input ${error ? 'login-input-error' : ''}`}>
                  <Lock className="login-input-icon" />
                  <input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="login-input-control"
                    onKeyDown={handlePasswordKeyEvent}
                    onKeyUp={handlePasswordKeyEvent}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false);
                      setCapsLockOn(false);
                    }}
                    aria-invalid={Boolean(error)}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(v => !v)}
                    disabled={isSubmitting}
                    className="login-input-action"
                    aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordFocused ? <div className="login-hint">区分大小写。</div> : null}
                {passwordFocused && capsLockOn ? (
                  <div className="login-hint text-warning flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4" />
                    大写锁定已开启
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="login-checkbox-box" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-muted">记住我</span>
              </label>
              <a
                href="#"
                className="text-primary/80 hover:text-primary transition-colors font-medium"
              >
                忘记密码？
              </a>
            </div>

            {error ? (
              <Alert role="alert" variant="danger">
                {error}
              </Alert>
            ) : null}

            <Button type="submit" size="lg" className="w-full soft-glow" loading={isSubmitting}>
              登录
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
