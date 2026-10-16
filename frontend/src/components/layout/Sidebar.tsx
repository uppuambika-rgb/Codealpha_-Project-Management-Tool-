import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Plus,
  X,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Database,
} from 'lucide-react';
import { Project } from '../../types.ts';
import { api } from '../../services/api.ts';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'dashboard' | 'mytasks' | 'project';
  activeProjectId?: string;
  projects: Project[];
  onSelectView: (view: 'dashboard' | 'mytasks') => void;
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  onOpenTutorial: () => void;
  myTasksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  activeProjectId,
  projects,
  onSelectView,
  onSelectProject,
  onOpenNewProject,
  onOpenTutorial,
  myTasksCount = 0,
}) => {
  const [dbStatus, setDbStatus] = React.useState<any>(null);

  React.useEffect(() => {
    api.dashboard.getDbStatus().then(setDbStatus).catch(() => {});
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-emerald-100 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header inside Sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-emerald-100/80 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-extrabold shadow-sm">
              FS
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">Flow<span className="text-emerald-600">Sprint</span></span>
              <span className="block text-[10px] font-medium text-emerald-700/80 uppercase tracking-widest">Project Hub</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Core */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Views */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Main</p>
            <button
              onClick={() => {
                onSelectView('dashboard');
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                activeView === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard Overview</span>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectView('mytasks');
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                activeView === 'mytasks'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="h-4 w-4" />
                <span>My Assigned Tasks</span>
              </div>
              {myTasksCount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeView === 'mytasks' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {myTasksCount}
                </span>
              )}
            </button>
          </div>

          {/* Projects Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Projects ({projects.length})</span>
              <button
                onClick={onOpenNewProject}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-xs"
                title="Create New Project"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-1 mt-1">
              {projects.map(p => {
                const isActive = activeView === 'project' && activeProjectId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition text-left group ${
                      isActive
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          p.color === 'emerald'
                            ? 'bg-emerald-500'
                            : p.color === 'teal'
                            ? 'bg-teal-500'
                            : p.color === 'cyan'
                            ? 'bg-cyan-500'
                            : p.color === 'indigo'
                            ? 'bg-indigo-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">{p.tag}</span>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                    </div>
                  </button>
                );
              })}

              {projects.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400 italic">No projects found. Create one!</p>
              )}
            </div>
          </div>
        </div>

        {/* College Demo Banner Footer */}
        <div className="border-t border-emerald-100 bg-emerald-50/50 p-4">
          <div className="rounded-xl border border-emerald-200 bg-white p-3 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold">College Project Demo</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
              Full-stack Kanban with role-based tasks, live comments & notifications.
            </p>

            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100">
              <span className="flex items-center gap-1 font-medium">
                <Database className="h-3 w-3 text-emerald-600" />
                <span>DB:</span>
              </span>
              <span className="font-semibold text-emerald-800 truncate max-w-[140px]">
                {dbStatus?.isMongoConnected ? `MongoDB (${dbStatus.dbName || 'Atlas'})` : 'Local JSON File'}
              </span>
            </div>

            <button
              onClick={onOpenTutorial}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <Sparkles className="h-3 w-3" />
              <span>Show Project Guide</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
