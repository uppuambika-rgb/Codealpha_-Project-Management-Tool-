import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Layers,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login, register, switchDemoUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, department, title });
      } else {
        await login(email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (userId: string) => {
    setError(null);
    setLoading(true);
    try {
      await switchDemoUser(userId);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-600/30 text-white">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Flow<span className="text-emerald-600">Sprint</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isRegister ? 'Create an account to join your college project' : 'Sign in to access your projects & Kanban boards'}
          </p>
        </div>

        {/* Quick One-Click Demo Personas for College Presentation */}
        <div className="mt-5 rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            <span>One-Click College Demo Login</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user_alex')}
              className="flex items-center gap-2 rounded-xl bg-white p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-100/50 transition border border-slate-200"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="Alex"
                className="h-6 w-6 rounded-full object-cover"
              />
              <div className="truncate">
                <span className="font-bold text-slate-800 block truncate">Alex R.</span>
                <span className="text-[10px] text-slate-500 block truncate">Team Lead</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user_maya')}
              className="flex items-center gap-2 rounded-xl bg-white p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-100/50 transition border border-slate-200"
            >
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
                alt="Maya"
                className="h-6 w-6 rounded-full object-cover"
              />
              <div className="truncate">
                <span className="font-bold text-slate-800 block truncate">Maya C.</span>
                <span className="text-[10px] text-slate-500 block truncate">UI / UX</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user_liam')}
              className="flex items-center gap-2 rounded-xl bg-white p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-100/50 transition border border-slate-200"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Liam"
                className="h-6 w-6 rounded-full object-cover"
              />
              <div className="truncate">
                <span className="font-bold text-slate-800 block truncate">Liam V.</span>
                <span className="text-[10px] text-slate-500 block truncate">Backend Dev</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user_sophia')}
              className="flex items-center gap-2 rounded-xl bg-white p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-100/50 transition border border-slate-200"
            >
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                alt="Sophia"
                className="h-6 w-6 rounded-full object-cover"
              />
              <div className="truncate">
                <span className="font-bold text-slate-800 block truncate">Sophia P.</span>
                <span className="text-[10px] text-slate-500 block truncate">QA & Product</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              !isRegister ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              isRegister ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {isRegister && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="Computer Science"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Frontend Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {!isRegister && (
              <p className="mt-1 text-[10px] text-slate-400">
                Default demo password is <span className="font-mono font-semibold text-slate-600">password123</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
