import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, Clock, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { KanbanBoard } from './components/kanban/KanbanBoard.tsx';
import { MyTasksView } from './components/mytasks/MyTasksView.tsx';
import { NewProjectModal } from './components/projects/NewProjectModal.tsx';
import { NewTaskModal } from './components/kanban/NewTaskModal.tsx';
import { CollegeDemoTutorialModal } from './components/onboarding/CollegeDemoTutorialModal.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { Project, Notification } from './types.ts';
import { api } from './services/api.ts';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { subscribe } = useWebSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'mytasks' | 'project'>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [openTaskId, setOpenTaskId] = useState<string | undefined>(undefined);

  // Projects list for sidebar
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasksCount, setMyTasksCount] = useState<number>(0);

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showGlobalNewTaskModal, setShowGlobalNewTaskModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Real-time toast state
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  const loadSidebarData = async () => {
    if (!user) return;
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.projects.list(),
        api.tasks.list({ assignedToMe: true }),
      ]);
      setProjects(projRes.projects);
      setMyTasksCount(tasksRes.tasks.length);

      // Default to first project if user navigates to project view without ID
      if (!activeProjectId && projRes.projects.length > 0) {
        setActiveProjectId(projRes.projects[0].id);
      }
    } catch (e) {
      console.error('Failed to load projects list:', e);
    }
  };

  useEffect(() => {
    loadSidebarData();
  }, [user?.id]);

  // Real-time WebSocket listeners
  useEffect(() => {
    const unsubNotif = subscribe('notification:new', (notif: Notification) => {
      setToastNotification(notif);
      loadSidebarData();
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    });

    const unsubProject = subscribe('project:updated', () => {
      loadSidebarData();
    });

    const unsubDashboard = subscribe('dashboard:refresh', () => {
      loadSidebarData();
    });

    return () => {
      unsubNotif();
      unsubProject();
      unsubDashboard();
    };
  }, [subscribe]);

  // Show tutorial on very first visit if desired
  useEffect(() => {
    const hasSeen = localStorage.getItem('flowsprint_seen_tutorial');
    if (!hasSeen && user) {
      setShowTutorialModal(true);
      localStorage.setItem('flowsprint_seen_tutorial', 'true');
    }
  }, [user?.id]);

  const handleSelectProject = (projectId: string, taskId?: string) => {
    setActiveProjectId(projectId);
    setOpenTaskId(taskId);
    setActiveView('project');
  };

  const handleSelectView = (view: 'dashboard' | 'mytasks' | 'project') => {
    setActiveView(view);
    setOpenTaskId(undefined);
  };

  const handleProjectCreated = (newProjectId: string) => {
    loadSidebarData();
    handleSelectProject(newProjectId);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50/40">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-bold text-emerald-800">Initializing FlowSprint...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        activeProjectId={activeProjectId}
        projects={projects}
        onSelectView={handleSelectView}
        onSelectProject={handleSelectProject}
        onOpenNewProject={() => setShowNewProjectModal(true)}
        onOpenTutorial={() => setShowTutorialModal(true)}
        myTasksCount={myTasksCount}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenTutorial={() => setShowTutorialModal(true)}
          activeView={activeView}
          projectName={activeProject?.name}
          onSelectProject={handleSelectProject}
          onNavigate={handleSelectView}
        />

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              onSelectProject={handleSelectProject}
              onOpenNewProject={() => setShowNewProjectModal(true)}
              onOpenNewTask={() => {
                if (projects.length > 0) {
                  setShowGlobalNewTaskModal(true);
                } else {
                  setShowNewProjectModal(true);
                }
              }}
              onNavigateToMyTasks={() => handleSelectView('mytasks')}
            />
          )}

          {activeView === 'mytasks' && (
            <MyTasksView
              onSelectProjectTask={(projId, taskId) => handleSelectProject(projId, taskId)}
            />
          )}

          {activeView === 'project' && activeProjectId && (
            <KanbanBoard
              key={activeProjectId}
              projectId={activeProjectId}
              initialOpenTaskId={openTaskId}
              onProjectDeleted={() => {
                loadSidebarData();
                handleSelectView('dashboard');
              }}
              onOpenTutorial={() => setShowTutorialModal(true)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {showGlobalNewTaskModal && activeProject && (
        <NewTaskModal
          project={activeProject}
          onClose={() => setShowGlobalNewTaskModal(false)}
          onTaskCreated={() => {
            loadSidebarData();
          }}
        />
      )}

      {showTutorialModal && (
        <CollegeDemoTutorialModal onClose={() => setShowTutorialModal(false)} />
      )}

      {/* Real-time WebSocket Alert Toast */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            {toastNotification.type === 'comment_added' ? (
              <MessageSquare className="h-4 w-4" />
            ) : toastNotification.type === 'deadline_approaching' ? (
              <Clock className="h-4 w-4 text-amber-600" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-xs font-bold text-slate-900 truncate">{toastNotification.title}</p>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{toastNotification.message}</p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}
