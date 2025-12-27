
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { ApiService } from '../services/api';

interface AuthProps {
  onLogin: (user: User, token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.AUTHOR);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { user, token } = await ApiService.login(username, password, role);
      onLogin(user, token);
    } catch (err) {
      setError('Login failed. Check your username, password, and role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-mono text-[#f8f8f2] relative overflow-hidden">
      <div className="w-full max-w-lg space-y-8 lg:space-y-10 relative z-10">
        <div className="text-center space-y-3">
          {isDev && (
            <div className="inline-block px-4 py-1.5 bg-[#44475a]/30 border border-[#50fa7b]/30 rounded-full mb-2 lg:mb-4 animate-in fade-in zoom-in duration-700">
               <span className="text-[10px] text-[#50fa7b] font-black tracking-[0.2em] uppercase">测试环境已连接</span>
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#f8f8f2] uppercase italic drop-shadow-[0_0_15px_rgba(189,147,249,0.3)]">MultiTerm</h1>
          
          {isDev && (
            <div className="space-y-4">
              <p className="text-[#6272a4] text-[10px] lg:text-xs tracking-[0.3em] font-black uppercase opacity-80">身份认证网关 v2.5 (Refactored)</p>
              
              <div className="bg-[#21222c]/60 backdrop-blur-sm border border-[#44475a] rounded-xl p-4 max-w-md mx-auto animate-in slide-in-from-top-2 duration-500 shadow-xl">
                <div className="flex flex-col gap-2 text-left">
                  <p className="text-[9px] text-[#6272a4] font-black uppercase mb-1 border-b border-[#44475a] pb-1 tracking-widest">快速拨号 / DEBUG_ACCOUNTS</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] lg:text-[11px]">
                    <span className="text-[#bd93f9] cursor-pointer hover:underline" onClick={() => setUsername('admin')}>admin</span>
                    <span className="text-[#f1fa8c] text-right font-bold">passw0rd</span>
                    <span className="text-[#bd93f9] cursor-pointer hover:underline" onClick={() => setUsername('author01')}>author01</span>
                    <span className="text-[#f1fa8c] text-right font-bold">passw0rd</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-[#21222c]/80 backdrop-blur-md border-2 border-[#44475a] p-8 lg:p-10 rounded-2xl space-y-6 lg:space-y-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#bd93f9] via-[#ff79c6] to-transparent opacity-50" />
          
          <div className="flex gap-2 p-1.5 bg-[#282a36] border-2 border-[#44475a] rounded-xl">
            {[UserRole.AUTHOR, UserRole.ADMIN].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-[10px] lg:text-xs font-black rounded-lg transition-all uppercase tracking-widest ${role === r ? 'bg-[#bd93f9] text-[#282a36] shadow-lg shadow-purple-500/20' : 'text-[#6272a4] hover:text-[#f8f8f2]'}`}
              >
                {r === UserRole.ADMIN ? '管理员入口' : '作者入口'}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="group">
              <label className="block text-[9px] lg:text-[10px] text-[#6272a4] uppercase font-black mb-2 ml-1 tracking-widest group-focus-within:text-[#bd93f9] transition-colors">USERNAME</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 text-sm lg:text-base text-[#f8f8f2] focus:border-[#bd93f9] outline-none rounded-xl transition-all placeholder-[#44475a] shadow-inner"
              />
            </div>
            <div className="group">
              <label className="block text-[9px] lg:text-[10px] text-[#6272a4] uppercase font-black mb-2 ml-1 tracking-widest group-focus-within:text-[#bd93f9] transition-colors">准入密钥 / Access_Key</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 text-sm lg:text-base text-[#f8f8f2] focus:border-[#bd93f9] outline-none rounded-xl transition-all placeholder-[#44475a] shadow-inner"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-[#ff5545]/10 border border-[#ff5545]/50 text-[#ff5545] text-xs font-bold rounded-xl animate-in shake-2 duration-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 lg:py-5 bg-[#bd93f9] hover:bg-[#ff79c6] disabled:bg-[#44475a] text-[#282a36] font-black text-xs lg:text-sm rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group shadow-xl uppercase tracking-[0.2em]"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-3 border-[#282a36] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                初始化身份认证会话
                <span className="group-hover:translate-x-1.5 transition-transform">→</span>
              </>
            )}
          </button>
        </form>

        {isDev && (
          <div className="flex justify-between items-center px-4 pt-4 border-t border-[#44475a]/30 animate-in fade-in slide-in-from-bottom-2 duration-1000 relative">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#50fa7b] shadow-[0_0_8px_#50fa7b]" />
                <span className="text-[10px] text-[#6272a4] uppercase font-black tracking-widest">Mock_Data_Ready</span>
             </div>
             <div className="text-[10px] text-[#6272a4] font-mono italic opacity-60">System_Node_Vite_HMR: Enabled</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
