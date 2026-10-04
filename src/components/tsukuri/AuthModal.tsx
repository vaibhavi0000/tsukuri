import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserAccount } from './tsukuriData.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: UserAccount = {
      name: name || (email.split('@')[0] || 'Collector'),
      email,
      phone,
      token: `tsu_usr_${Date.now()}`,
    };
    // Save to local storage for persistence
    localStorage.setItem('tsukuri_user', JSON.stringify(user));
    setSuccessMsg(tab === 'signin' ? `Welcome back, ${user.name}!` : `Account created! Welcome to TsuKURI_3D.`);
    setTimeout(() => {
      onLoginSuccess(user);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#e8ece1] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-4 border-white overflow-hidden text-[#1a2e26]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center hover:bg-[#1e4b3e] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1e4b3e] text-white flex items-center justify-center font-bubbly text-xl mx-auto mb-2 shadow-xs">
            造
          </div>
          <h2 className="font-bubbly text-2xl tracking-tight text-[#1a2e26]">
            {tab === 'signin' ? 'MEMBER SIGN IN' : 'JOIN TSUKURI CLUB'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Optional account to track your custom 3D prints & past drops.
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-white/70 p-1 rounded-full border border-slate-200 mt-4 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => { setTab('signin'); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                tab === 'signin' ? 'bg-[#1e4b3e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                tab === 'signup' ? 'bg-[#1e4b3e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {successMsg ? (
          <div className="p-6 bg-white rounded-3xl text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#1e4b3e] mx-auto animate-bounce" />
            <p className="font-bubbly text-lg text-[#1e4b3e]">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#1a2e26] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1e4b3e]" />
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#1a2e26] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#1e4b3e]" />
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="aarav@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
              />
            </div>

            {tab === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#1a2e26] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#1e4b3e]" />
                  Phone Number (for Courier Updates)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#1a2e26] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1e4b3e]" />
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-sm tracking-wide flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all mt-4"
            >
              <span>{tab === 'signin' ? 'SIGN IN & CONTINUE' : 'CREATE ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
