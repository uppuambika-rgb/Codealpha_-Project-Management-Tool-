import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  Users,
  Activity,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardData } from '../../types.ts';
import { api } from '../../services/api.ts';

interface DashboardViewProps {
  onSelectProject: (projectId: string, taskId?: string) => void;
  onOpenNewProject: () => void;
  onOpenNewTask: () => void;
  onNavigateToMyTasks: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectProject,
  onOpenNewProject,
  onOpenNewTask,
  onNavigateToMyTasks,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.dashboard.get();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-emerald-800">Loading FlowSprint dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        Could not retrieve dashboard data. Please try refreshing.
      </div>
    );
  }

  const { metrics, priorityDistribution, statusDistribution, upcomingDeadlines, projectsSummary, recentActivities } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-700/10 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
              Welcome back
            </span>
            <span className="text-xs text-emerald-100 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">
            {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 max-w-xl">
            {user?.title || 'Team Member'} • {user?.department || 'College Project Team'}. Here is your project sprint summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm hover:bg-emerald-50 transition active:scale-95"
          >
            <Plus className="h-4 w-4 text-emerald-700" />
            <span>New Project</span>
          </button>
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-emerald-700/60 backdrop-blur-xs px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-95"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Total Projects */}
        <div className="rounded-2xl border border-emerald-100/80 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Projects</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FolderKanban className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.totalProjects}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">In Workspace</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="rounded-2xl border border-emerald-100/80 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Tasks</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.pendingTasksCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">of {metrics.totalTasks} total</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="rounded-2xl border border-emerald-100/80 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completion</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{metrics.completionRate}%</span>
            <span className="text-[11px] text-slate-500 font-medium">({metrics.completedTasksCount} done)</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        {/* Assigned to Me */}
        <div
          onClick={onNavigateToMyTasks}
          className="cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Assigned To Me</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">{metrics.myTasksCount}</span>
              <span className="text-[11px] text-emerald-700 font-medium">Tasks pending</span>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Main Content Split: Projects Summary & Upcoming Deadlines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Projects Progress (2 cols on lg) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Projects Cards */}
          <div className="rounded-2xl border border-emerald-100/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800">Projects Overview</h2>
              </div>
              <button
                onClick={onOpenNewProject}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projectsSummary.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="group cursor-pointer rounded-xl border border-slate-200/80 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/20 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-md bg-emerald-100/80 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                        {proj.tag}
                      </span>
                      <h3 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {proj.name}
                      </h3>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {proj.description || 'College project collaboration workspace.'}
                  </p>

                  <div className="mt-3.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{proj.membersCount} members</span>
                      </span>
                      <span className="font-semibold text-emerald-700">{proj.progress}% Done</span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status & Priority Distribution */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Status Breakdown */}
            <div className="rounded-2xl border border-emerald-100/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasks By Status</h3>
              <div className="mt-4 space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      To Do
                    </span>
                    <span className="font-bold">{statusDistribution.todo}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${metrics.totalTasks ? (statusDistribution.todo / metrics.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      In Progress
                    </span>
                    <span className="font-bold">{statusDistribution.in_progress}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${metrics.totalTasks ? (statusDistribution.in_progress / metrics.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-teal-500" />
                      In Review
                    </span>
                    <span className="font-bold">{statusDistribution.review}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${metrics.totalTasks ? (statusDistribution.review / metrics.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                    <span className="font-bold text-emerald-700">{statusDistribution.completed}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${metrics.totalTasks ? (statusDistribution.completed / metrics.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="rounded-2xl border border-emerald-100/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasks By Priority</h3>
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-rose-50/70 px-3 py-2 text-xs">
                  <span className="font-semibold text-rose-800">Urgent</span>
                  <span className="rounded-md bg-rose-200/80 px-2 py-0.5 font-bold text-rose-900">{priorityDistribution.urgent}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50/70 px-3 py-2 text-xs">
                  <span className="font-semibold text-amber-800">High</span>
                  <span className="rounded-md bg-amber-200/80 px-2 py-0.5 font-bold text-amber-900">{priorityDistribution.high}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50/70 px-3 py-2 text-xs">
                  <span className="font-semibold text-blue-800">Medium</span>
                  <span className="rounded-md bg-blue-200/80 px-2 py-0.5 font-bold text-blue-900">{priorityDistribution.medium}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-700">Low</span>
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 font-bold text-slate-800">{priorityDistribution.low}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines & Recent Activities */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="rounded-2xl border border-emerald-100/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800">Upcoming Deadlines</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                {upcomingDeadlines.length} Due Soon
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="mx-auto mb-1 h-6 w-6 text-emerald-400" />
                  No pending deadlines!
                </div>
              ) : (
                upcomingDeadlines.map(t => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isOverdue = t.dueDate && t.dueDate < todayStr;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectProject(t.projectId, t.id)}
                      className="cursor-pointer py-3 transition hover:bg-emerald-50/40 rounded-lg px-2 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 line-clamp-1">{t.title}</span>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {t.dueDate}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[150px]">{t.projectName}</span>
                        <span>{t.assigneeName}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Real-time Team Activity Log */}
          <div className="rounded-2xl border border-emerald-100/90 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">Live Team Activity</h2>
            </div>

            <div className="mt-3 space-y-3">
              {recentActivities.slice(0, 7).map(act => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2">
                      <span className="font-semibold text-slate-900">{act.userName}</span>{' '}
                      <span className="text-slate-600">{act.action}</span>{' '}
                      <span className="font-semibold text-emerald-800">"{act.targetTitle}"</span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
