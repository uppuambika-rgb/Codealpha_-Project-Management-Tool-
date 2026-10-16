import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  UserPlus,
  Share2,
  Trash2,
  Settings,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Project, Task, TaskStatus, TaskPriority } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useWebSocket } from '../../context/WebSocketContext.tsx';
import { TaskCard } from './TaskCard.tsx';
import { TaskDetailModal } from './TaskDetailModal.tsx';
import { NewTaskModal } from './NewTaskModal.tsx';
import { ProjectMembersModal } from '../projects/ProjectMembersModal.tsx';

interface KanbanBoardProps {
  projectId: string;
  initialOpenTaskId?: string;
  onProjectDeleted: () => void;
  onOpenTutorial: () => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  accentColor: string;
  badgeBg: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do', accentColor: 'border-slate-300', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: 'in_progress', title: 'In Progress', accentColor: 'border-amber-300', badgeBg: 'bg-amber-100 text-amber-800' },
  { id: 'review', title: 'In Review', accentColor: 'border-teal-300', badgeBg: 'bg-teal-100 text-teal-800' },
  { id: 'completed', title: 'Completed', accentColor: 'border-emerald-400', badgeBg: 'bg-emerald-100 text-emerald-800' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  initialOpenTaskId,
  onProjectDeleted,
  onOpenTutorial,
}) => {
  const { connected, onlineUsers, joinProject, leaveProject, subscribe } = useWebSocket();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Modals
  const [activeTaskId, setActiveTaskId] = useState<string | null>(initialOpenTaskId || null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<TaskStatus>('todo');
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Drag and Drop State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const loadProjectAndTasks = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.projects.get(projectId),
        api.tasks.list({ projectId }),
      ]);
      setProject(projRes.project);
      setTasks(tasksRes.tasks);
    } catch (err) {
      console.error('Failed to load project board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectAndTasks();
    joinProject(projectId);
    return () => {
      leaveProject();
    };
  }, [projectId, joinProject, leaveProject]);

  // Real-time WebSocket event listeners
  useEffect(() => {
    const unsubCreated = subscribe('task:created', (payload: { task: Task }) => {
      if (payload.task && payload.task.projectId === projectId) {
        setTasks(prev => {
          if (prev.some(t => t.id === payload.task.id)) return prev;
          return [...prev, payload.task];
        });
      }
    });

    const unsubMoved = subscribe('task:moved', (payload: { taskId: string; targetStatus: TaskStatus; newIndex: number }) => {
      setTasks(prev =>
        prev.map(t => (t.id === payload.taskId ? { ...t, status: payload.targetStatus } : t))
      );
    });

    const unsubUpdated = subscribe('task:updated', (payload: { task: Task }) => {
      if (payload.task && payload.task.projectId === projectId) {
        setTasks(prev =>
          prev.map(t => (t.id === payload.task.id ? payload.task : t))
        );
      }
    });

    const unsubDeleted = subscribe('task:deleted', (payload: { taskId: string }) => {
      setTasks(prev => prev.filter(t => t.id !== payload.taskId));
    });

    const unsubComment = subscribe('comment:added', (payload: { taskId: string }) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === payload.taskId
            ? { ...t, commentsCount: (t.commentsCount || 0) + 1 }
            : t
        )
      );
    });

    return () => {
      unsubCreated();
      unsubMoved();
      unsubUpdated();
      unsubDeleted();
      unsubComment();
    };
  }, [projectId, subscribe]);

  useEffect(() => {
    if (initialOpenTaskId) {
      setActiveTaskId(initialOpenTaskId);
    }
  }, [initialOpenTaskId]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === 'all' ||
        (assigneeFilter === 'unassigned' && !task.assigneeId) ||
        task.assigneeId === assigneeFilter;

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistically update
    const previousStatus = task.status;
    const destColumnTasks = tasks.filter(t => t.status === targetStatus && t.id !== taskId);
    const newIndex = destColumnTasks.length; // place at end

    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.tasks.move(taskId, targetStatus, newIndex);
    } catch (err) {
      console.error('Failed to move task:', err);
      // Revert on error
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
    } finally {
      setDraggingTaskId(null);
    }
  };

  const handleMoveQuick = async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.tasks.move(taskId, targetStatus, 0);
    } catch (err) {
      console.error(err);
      loadProjectAndTasks();
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!window.confirm(`Delete project "${project.name}" and all its tasks? This action is permanent.`)) {
      return;
    }
    try {
      await api.projects.delete(project.id);
      onProjectDeleted();
    } catch (err) {
      console.error(err);
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-emerald-800">Loading Kanban board...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        Project not found or you don't have permission to view it.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Project Header Bar */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
                {project.tag}
              </span>
              <span className="text-xs text-slate-400">Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Member Avatars & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Team Members Avatar Stack */}
            <div
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-200 px-2.5 py-1.5 hover:border-emerald-300 hover:bg-emerald-50/50 transition group"
              title="Manage Project Members"
            >
              <div className="flex -space-x-2 overflow-hidden">
                {project.enrichedMembers?.slice(0, 4).map(m => (
                  <img
                    key={m.userId}
                    src={m.avatarUrl}
                    alt={m.name}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                    title={`${m.name} (${m.role})`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-800">
                {project.enrichedMembers?.length || 0} Members
              </span>
              <UserPlus className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>

            {/* Live Presence indicator */}
            {onlineUsers.length > 0 && (
              <div
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-xs text-emerald-800 font-semibold"
                title={`Active on this board right now: ${onlineUsers.map(u => u.name).join(', ')}`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{onlineUsers.length} Online Now</span>
              </div>
            )}

            {/* Add Task Button */}
            <button
              onClick={() => {
                setNewTaskInitialStatus('todo');
                setShowNewTaskModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>

            {/* Delete Project */}
            <button
              onClick={handleDeleteProject}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
              title="Delete Project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 flex flex-col gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, descriptions, tags..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {project.enrichedMembers?.map(m => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>

            {(searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('all');
                  setAssigneeFilter('all');
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4-Column Responsive Kanban Board Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={e => handleDragLeave(e, col.id)}
              onDrop={e => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-150 ${
                isOver
                  ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400/40 shadow-md'
                  : 'border-slate-200/80 bg-slate-100/50'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-200/60 bg-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{col.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badgeBg}`}>
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setNewTaskInitialStatus(col.id);
                    setShowNewTaskModal(true);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  title={`Add card to ${col.title}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Tasks List Container */}
              <div className="flex flex-col gap-2.5 p-3 min-h-[380px] max-h-[calc(100vh-320px)] overflow-y-auto">
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setActiveTaskId(task.id)}
                    onMoveQuick={targetStatus => handleMoveQuick(task.id, targetStatus)}
                    onDragStart={e => handleDragStart(e, task.id)}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setDragOverColumn(null);
                    }}
                  />
                ))}

                {colTasks.length === 0 && (
                  <div
                    onClick={() => {
                      setNewTaskInitialStatus(col.id);
                      setShowNewTaskModal(true);
                    }}
                    className={`flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed py-10 px-4 text-center cursor-pointer transition ${
                      isOver
                        ? 'border-emerald-400 bg-emerald-100/30 text-emerald-800'
                        : 'border-slate-300 text-slate-400 hover:border-emerald-300 hover:text-slate-600'
                    }`}
                  >
                    <Plus className="h-5 w-5 mb-1 opacity-50" />
                    <span className="text-xs font-medium">Drop tasks or click + to add</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {activeTaskId && project && (
        <TaskDetailModal
          taskId={activeTaskId}
          project={project}
          onClose={() => setActiveTaskId(null)}
          onTaskUpdated={() => loadProjectAndTasks()}
          onTaskDeleted={() => {
            setActiveTaskId(null);
            loadProjectAndTasks();
          }}
        />
      )}

      {/* New Task Modal */}
      {showNewTaskModal && project && (
        <NewTaskModal
          project={project}
          initialStatus={newTaskInitialStatus}
          onClose={() => setShowNewTaskModal(false)}
          onTaskCreated={() => loadProjectAndTasks()}
        />
      )}

      {/* Manage Members Modal */}
      {showMembersModal && project && (
        <ProjectMembersModal
          project={project}
          onClose={() => setShowMembersModal(false)}
          onMembersUpdated={() => loadProjectAndTasks()}
        />
      )}
    </div>
  );
};
