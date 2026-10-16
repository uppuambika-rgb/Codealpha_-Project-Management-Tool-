import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Clock,
  Trash2,
  Send,
  Tag,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Task, Comment, TaskStatus, TaskPriority, Project } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useWebSocket } from '../../context/WebSocketContext.tsx';
import { api } from '../../services/api.ts';

interface TaskDetailModalProps {
  taskId: string;
  project: Project;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  project,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');

  const fetchTaskDetails = async () => {
    try {
      const res = await api.tasks.get(taskId);
      setTask(res.task);
      setTitle(res.task.title);
      setDescription(res.task.description || '');
      setStatus(res.task.status);
      setPriority(res.task.priority);
      setAssigneeId(res.task.assigneeId || '');
      setDueDate(res.task.dueDate || '');
      setTagInput(res.task.tags ? res.task.tags.join(', ') : '');

      const commRes = await api.comments.list(taskId);
      setComments(commRes.comments);
    } catch (e) {
      console.error('Failed to load task details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  // Subscribe to real-time comment updates for this task
  useEffect(() => {
    const unsubCommentAdded = subscribe('comment:added', (payload: { taskId: string; comment: Comment }) => {
      if (payload.taskId === taskId) {
        setComments(prev => {
          if (prev.some(c => c.id === payload.comment.id)) return prev;
          return [...prev, payload.comment];
        });
      }
    });

    const unsubCommentDeleted = subscribe('comment:deleted', (payload: { taskId: string; commentId: string }) => {
      if (payload.taskId === taskId) {
        setComments(prev => prev.filter(c => c.id !== payload.commentId));
      }
    });

    return () => {
      unsubCommentAdded();
      unsubCommentDeleted();
    };
  }, [taskId, subscribe]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await api.tasks.update(taskId, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        tags,
      });

      onTaskUpdated();
    } catch (e) {
      console.error(e);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.comments.create(taskId, newComment.trim());
      setComments(prev => [...prev, res.comment]);
      setNewComment('');
      onTaskUpdated();
    } catch (e) {
      console.error(e);
      alert('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.comments.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onTaskUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This cannot be undone.')) {
      return;
    }
    try {
      await api.tasks.delete(taskId);
      onTaskDeleted();
    } catch (e) {
      console.error(e);
      alert('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span className="text-xs font-semibold text-slate-700">Loading task...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Project tag & Close button */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
              {project.tag}
            </span>
            <span className="text-xs font-medium text-slate-400">in {project.name}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Title Input */}
        <div className="mt-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task Title..."
            className="w-full text-lg sm:text-xl font-bold text-slate-900 focus:outline-none border-b border-transparent focus:border-emerald-500 pb-1"
          />
        </div>

        {/* 2-Column Attributes & Description */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main Left: Description & Comments (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add more details, requirements, or acceptance criteria..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="e.g. Frontend, API, Bug, Capstone"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Comments & Discussion Thread */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Discussion ({comments.length})
                </h3>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No comments yet. Start the conversation with your team!
                  </p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={c.userAvatar}
                            alt={c.userName}
                            className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="font-bold text-slate-800">{c.userName}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {user?.id === c.userId && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-slate-700 leading-relaxed pl-7">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Write a comment or update for the team..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar: Attributes (Status, Priority, Assignee, Due Date) */}
          <div className="space-y-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 p-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {project.enrichedMembers?.map((m: any) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
              </input>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-emerald-200/60 space-y-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteTask}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
