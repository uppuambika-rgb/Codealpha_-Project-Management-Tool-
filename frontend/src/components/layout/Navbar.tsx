import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Users,
  LogOut,
  RotateCcw,
  Menu,
  Check,
  MessageSquare,
  Clock,
  Layers,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useWebSocket } from '../../context/WebSocketContext.tsx';
import { Notification } from '../../types.ts';
import { api } from '../../services/api.ts';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenTutorial: () => void;
  activeView: string;
  projectName?: string;
  onSelectProject: (projectId: string, taskId?: string) => void;
  onNavigate: (view: 'dashboard' | 'mytasks' | 'project') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenTutorial,
  activeView,
  projectName,
  onSelectProject,
  onNavigate,
}) => {
  const { user, availableUsers, switchDemoUser, logout } = useAuth();
  const { connected, subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  // Poll notifications periodically and fetch on load
  const loadNotifications = async () => {
    try {
      const res = await api.notifications.list();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  // Subscribe to real-time notification push over WebSocket
  useEffect(() => {
    const unsubscribe = subscribe('notification:new', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    return () => unsubscribe();
  }, [subscribe]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (demoRef.current && !demoRef.current.contains(e.target as Node)) {
        setShowDemoSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkSingleRead = async (id: string, link?: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setShowNotifDropdown(false);

      if (link) {
        // Parse link like /project/proj_campuseats?task=task_ce_2
        const match = link.match(/\/project\/([^?]+)(?:\?task=(.+))?/);
        if (match) {
          const projId = match[1];
          const taskId = match[2];
          onSelectProject(projId, taskId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerTestNotif = async () => {
    try {
      const res = await api.notifications.testPing();
      setNotifications(prev => [res.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all project, task, and comment demo data to initial college showcase defaults?')) {
      return;
    }
    setResettingDemo(true);
    try {
      await api.dashboard.resetDemo();
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to reset demo data');
      setResettingDemo(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-emerald-100 bg-white/95 px-4 backdrop-blur-md transition-all sm:px-6">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50/50 text-slate-600 transition hover:bg-emerald-100 lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5 text-emerald-700" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-sm shadow-emerald-600/20 text-white font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <span className="hidden font-extrabold tracking-tight text-slate-900 sm:inline-block text-lg">
            Flow<span className="text-emerald-600">Sprint</span>
          </span>
          <div className="hidden h-4 w-px bg-slate-200 md:block mx-1" />
          <div className="hidden text-xs font-semibold uppercase tracking-wider text-emerald-800 md:flex items-center gap-1.5">
            {activeView === 'dashboard' && <span className="bg-emerald-100/70 text-emerald-800 px-2.5 py-0.5 rounded-full">Dashboard</span>}
            {activeView === 'mytasks' && <span className="bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">My Assigned Tasks</span>}
            {activeView === 'project' && (
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full truncate max-w-[200px]">
                {projectName || 'Project Board'}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}
              title={connected ? 'WebSocket connected: Live real-time updates active' : 'Connecting to WebSocket server...'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="hidden xl:inline">{connected ? 'Live Sync' : 'Offline'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Action Stack */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* College Demo Tutorial Button */}
        <button
          onClick={onOpenTutorial}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 hover:border-emerald-300 transition"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 fill-emerald-500/20" />
          <span>Demo Guide</span>
        </button>

        {/* Demo User Switcher Dropdown */}
        <div className="relative" ref={demoRef}>
          <button
            onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:border-emerald-400 hover:bg-emerald-50/40 transition"
            title="Switch demo persona for testing role-based features"
          >
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden lg:inline text-slate-500 font-normal">Persona:</span>
            <span className="font-semibold text-emerald-900 max-w-[90px] truncate">{user?.name.split(' ')[0]}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showDemoSwitcher && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-emerald-100 bg-white p-2 shadow-xl z-50">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-800">Switch College Demo User</p>
                <p className="text-[11px] text-slate-500">Test multi-user permissions, task assignment, and comments.</p>
              </div>
              <div className="mt-1 space-y-1">
                {availableUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      await switchDemoUser(u.id);
                      setShowDemoSwitcher(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      user?.id === u.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-emerald-200"
                      />
                      <div className="truncate">
                        <div className="truncate font-medium">{u.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{u.title || u.department}</div>
                      </div>
                    </div>
                    {user?.id === u.id && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 transition"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-emerald-100 bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTriggerTestNotif}
                    className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-800 transition"
                    title="Send simulated notification to test"
                  >
                    <Send className="h-3 w-3" />
                    <span>Test Ping</span>
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-400" />
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkSingleRead(n.id, n.link)}
                      className={`cursor-pointer rounded-xl p-2.5 transition text-left flex items-start gap-3 ${
                        n.read ? 'bg-white opacity-75 hover:bg-slate-50' : 'bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-100/80'
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        {n.type === 'comment_added' ? (
                          <MessageSquare className="h-3.5 w-3.5" />
                        ) : n.type === 'deadline_approaching' ? (
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 rounded-full p-0.5 ring-2 ring-emerald-500/20 hover:ring-emerald-500/50 transition"
          >
            <img
              src={user?.avatarUrl}
              alt={user?.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-emerald-100 bg-white p-2 shadow-2xl z-50">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    {user?.department || 'Student Team'}
                  </span>
                </div>
              </div>

              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('mytasks');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>My Assigned Tasks</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenTutorial();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>College Demo Tour</span>
                </button>

                <button
                  onClick={handleResetDemoData}
                  disabled={resettingDemo}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition"
                  title="Restore clean showcase data"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${resettingDemo ? 'animate-spin' : ''}`} />
                  <span>Reset Demo Data</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
