import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Layers,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  FolderKanban,
  MessageSquare,
  Bell,
  Database,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const LoginPage: React.FC = () => {
  const { login, register, switchDemoUser, availableUsers } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    api.dashboard.getDbStatus().then(setDbStatus).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await register({ name, email, password, department, title });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (userId: string) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await switchDemoUser(userId);
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Banner / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl text-center mb-6">
        <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2 border border-emerald-200 shadow-xs mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            Flow<span className="text-emerald-600">Sprint</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-semibold text-emerald-800">Collaborative Project Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to your team's sprint workspace
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Similar to Trello & Asana. Organize group projects, assign task cards, communicate in real time, and monitor sprint progress.
        </p>
      </div>

      {/* Main 2-Column Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden">
        {/* Left Col: Feature Highlights (5 cols on md) */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6 sm:p-8 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur-xs mb-4">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>Full-Stack College Project</span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              Designed for Team Collaboration
            </h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed mb-6">
              Complete agile workflow with real-time sync, multi-user accounts, and task communication.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Group Projects & Kanban Boards</p>
                  <p className="text-[11px] text-emerald-100/70">Drag-and-drop tasks across To Do, In Progress, Review, and Done.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Task Assignment & Deadlines</p>
                  <p className="text-[11px] text-emerald-100/70">Assign tasks to teammates with priorities, tags, and calendar due dates.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Task Comments & Discussion</p>
                  <p className="text-[11px] text-emerald-100/70">Threaded communication within each card with author avatars and timestamps.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Real-Time WebSockets & Alerts</p>
                  <p className="text-[11px] text-emerald-100/70">Instant live card movements, comment updates, and notification badges.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Database Persistence</p>
                  <p className="text-[11px] text-emerald-100/70">Supports MongoDB Atlas connection via .env with local persistent JSON fallback.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Database connection badge */}
          <div className="mt-6 pt-4 border-t border-emerald-600/40 flex items-center justify-between text-[11px]">
            <span className="text-emerald-200">Database Engine:</span>
            <span className="font-mono font-bold text-white flex items-center gap-1.5 bg-emerald-950/40 px-2 py-0.5 rounded-md">
              <span className={`h-1.5 w-1.5 rounded-full ${dbStatus?.isMongoConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {dbStatus?.isMongoConnected ? `MongoDB (${dbStatus.dbName || 'Atlas'})` : 'Local Persistent JSON'}
            </span>
          </div>
        </div>

        {/* Right Col: Sign In & Create Account Form (7 cols on md) */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  !isRegister
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Sign In (Existing Account)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  isRegister
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Create Account (New User)</span>
              </button>
            </div>

            {/* Sub-header description */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {isRegister ? 'Create your new student account' : 'Sign in to your account'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRegister
                  ? 'Register with your college email to start or join projects.'
                  : 'Enter your credentials to access your Kanban project boards.'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
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

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Department / Major
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
                        placeholder="Full-Stack Engineer"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isRegister && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Sample accounts use password: <span className="font-mono font-semibold text-slate-600">password123</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 disabled:opacity-50 transition"
              >
                <span>{loading ? 'Processing...' : isRegister ? 'Complete Registration' : 'Sign In to Workspace'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Quick One-Click Demo Logins for Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2.5">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <span>Or 1-Click Fast Sign-In with Demo Accounts:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('user_alex')}
                className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-50/70 transition border border-slate-200 group"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Alex"
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-300"
                />
                <div className="truncate">
                  <span className="font-bold text-slate-800 block truncate group-hover:text-emerald-800">Alex Rivers</span>
                  <span className="text-[10px] text-slate-500 block truncate">Team Lead</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('user_maya')}
                className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-50/70 transition border border-slate-200 group"
              >
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
                  alt="Maya"
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-300"
                />
                <div className="truncate">
                  <span className="font-bold text-slate-800 block truncate group-hover:text-emerald-800">Maya Chen</span>
                  <span className="text-[10px] text-slate-500 block truncate">Frontend Lead</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('user_liam')}
                className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-50/70 transition border border-slate-200 group"
              >
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt="Liam"
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-300"
                />
                <div className="truncate">
                  <span className="font-bold text-slate-800 block truncate group-hover:text-emerald-800">Liam Vance</span>
                  <span className="text-[10px] text-slate-500 block truncate">Backend Dev</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('user_sophia')}
                className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-left text-xs shadow-xs hover:border-emerald-300 hover:bg-emerald-50/70 transition border border-slate-200 group"
              >
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                  alt="Sophia"
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-300"
                />
                <div className="truncate">
                  <span className="font-bold text-slate-800 block truncate group-hover:text-emerald-800">Sophia Patel</span>
                  <span className="text-[10px] text-slate-500 block truncate">QA Specialist</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
