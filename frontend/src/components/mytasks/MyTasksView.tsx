import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Calendar,
  Clock,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Task, TaskStatus } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

interface MyTasksViewProps {
  onSelectProjectTask: (projectId: string, taskId: string) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ onSelectProjectTask }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchMyTasks = async () => {
    try {
      const res = await api.tasks.list({ assignedToMe: true });
      setTasks(res.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [user?.id]);

  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await api.tasks.update(taskId, { status: newStatus });
    } catch (err) {
      console.error(err);
      fetchMyTasks();
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-emerald-800">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Assigned Tasks
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Work assigned to <span className="font-semibold text-emerald-800">{user?.name}</span> across all campus projects.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Tasks ({tasks.length})</option>
            <option value="todo">To Do ({tasks.filter(t => t.status === 'todo').length})</option>
            <option value="in_progress">In Progress ({tasks.filter(t => t.status === 'in_progress').length})</option>
            <option value="review">In Review ({tasks.filter(t => t.status === 'review').length})</option>
            <option value="completed">Completed ({tasks.filter(t => t.status === 'completed').length})</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold text-slate-700">No tasks found matching filter</p>
            <p className="text-xs text-slate-500 mt-1">Check back later or pick tasks from the project board.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map(task => {
              const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'completed';
              return (
                <div
                  key={task.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-emerald-50/20 px-2 rounded-xl transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                        {task.projectName}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : task.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 text-[11px] font-medium ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{task.dueDate} {isOverdue && '(Overdue)'}</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onSelectProjectTask(task.projectId, task.id)}
                      className="mt-1 text-sm font-bold text-slate-900 group-hover:text-emerald-700 cursor-pointer transition line-clamp-1"
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={e => handleQuickStatusChange(task.id, e.target.value as TaskStatus)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => onSelectProjectTask(task.projectId, task.id)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                      title="Open in Project Board"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
