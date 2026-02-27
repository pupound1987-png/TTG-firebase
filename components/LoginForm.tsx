
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Settings, ShieldCheck, Key, Zap, Lock, Unlock, CheckSquare, Square } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    const savedPassword = localStorage.getItem('remembered_password');
    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError('');
    
    if (rememberMe) {
      localStorage.setItem('remembered_username', username);
      localStorage.setItem('remembered_password', password);
    } else {
      localStorage.removeItem('remembered_username');
      localStorage.removeItem('remembered_password');
    }

    setTimeout(() => {
      // IT Admin Login
      if (username === 'admin' && password === 'tci@1234') {
        onLogin({ 
          username: 'admin_it', 
          role: 'ADMIN', 
          fullName: 'IT Administrator',
          systemAccess: 'IT'
        });
      } 
      // Maintenance Admin Login
      else if (username === 'admin' && password === '1234') {
        onLogin({ 
          username: 'admin_mt', 
          role: 'ADMIN', 
          fullName: 'Maintenance Administrator',
          systemAccess: 'MAINTENANCE'
        });
      }
      else {
        setError('CRITICAL ERROR: Authorization Denied / การยืนยันตัวตนล้มเหลว');
        setIsAuthenticating(false);
      }
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 glass-card rounded-[2.5rem] relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      <div className="flex justify-center mb-8 h-24 items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="flex items-center gap-1 relative z-10">
            <div className="animate-key-insert">
              <Key size={32} className="text-blue-600 -rotate-45" />
            </div>
            <div className="animate-lock-glow bg-white/90 p-3 rounded-2xl border border-blue-200 shadow-md">
              {isAuthenticating ? (
                <Unlock size={36} className="text-blue-700" />
              ) : (
                <Lock size={36} className="text-blue-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-10">
        <div className="flex items-baseline justify-center font-tech font-bold text-slate-900 drop-shadow-sm tracking-tighter">
          <span className="text-7xl md:text-8xl italic leading-none">T</span>
          <div className="p-1 mx-0.5 bg-pink-500/10 backdrop-blur-sm rounded-full border border-pink-500/20 shadow-inner">
            <Settings size={10} className="text-pink-500 gear-animate" />
          </div>
          <span className="text-7xl md:text-8xl italic leading-none">T</span>
          <div className="p-1 mx-0.5 bg-pink-400/10 backdrop-blur-sm rounded-full border border-pink-400/20 shadow-inner">
            <Settings size={10} className="text-pink-400 gear-animate-rev" />
          </div>
          <span className="text-7xl md:text-8xl lowercase italic leading-none">g</span>
        </div>
        <p className="text-slate-700 text-[10px] mt-2 uppercase tracking-[0.2em] font-black drop-shadow-sm">Terminal Auth Protocol / โปรโตคอลการเข้าถึง</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-700 uppercase tracking-[0.3em] ml-1">Access_Identity / ชื่อผู้ใช้งาน</label>
          <div className="relative group">
            <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 transition-colors" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/70 border border-white/60 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400 font-bold text-sm shadow-inner"
              placeholder="operator_uid"
              required
              disabled={isAuthenticating}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-700 uppercase tracking-[0.3em] ml-1">Secure_Keyphrase / รหัสผ่าน</label>
          <div className="relative group">
            <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 transition-colors" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/70 border border-white/60 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400 font-bold text-sm shadow-inner"
              placeholder="********"
              required
              disabled={isAuthenticating}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <button 
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
          >
            {rememberMe ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
            Remember Key / จดจำรหัส
          </button>
        </div>

        {error && (
          <div className="bg-red-600/10 border border-red-500/30 text-red-700 text-[10px] p-3 rounded-xl text-center font-mono font-black shadow-sm">
            [ ALERT ] {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isAuthenticating}
          className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-50"
        >
          {isAuthenticating ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <span className="font-tech text-xs ml-2 tracking-widest uppercase">DECRYPTING / กำลังประมวลผล...</span>
            </div>
          ) : (
            <>
              <span className="font-tech tracking-[0.2em] uppercase">INITIALIZE_AUTH / เข้าสู่ระบบ</span>
              <Zap size={18} className="group-hover:fill-current transition-all" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200 text-center space-y-4">
        <button 
           onClick={() => onLogin({ username: 'Visitor', role: 'USER', fullName: 'Guest User', systemAccess: 'BOTH' })}
           className="text-[10px] text-slate-600 hover:text-blue-700 transition-colors uppercase font-black tracking-widest drop-shadow-sm"
        >
          _bypass_to_guest_mode / เข้าใช้งานแบบทั่วไป
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
