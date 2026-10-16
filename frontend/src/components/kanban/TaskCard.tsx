import React from 'react';
import {
  Calendar,
  MessageSquare,
  MoreVertical,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types.ts';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onMoveQuick?: (targetStatus: TaskStatus) => void;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onMoveQuick,
  onDragStart,
  onDragEnd,
}) => {
  const [showQuickMenu, setShowQuickMenu] = React.useState(false);

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'completed';
  const isDueToday = task.dueDate === todayStr && task.status !== 'completed';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative cursor-grab rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-emerald-300 hover:shadow-md active:cursor-grabbing active:scale-[0.99] select-none"
    >
      {/* Top Header: Priority & Quick Action Menu */}
      <div className="flex items-center justify-between">
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPriorityStyle(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickMenu(!showQuickMenu);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 rounded transition"
              title="Quick Move"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {showQuickMenu && onMoveQuick && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-6 z-20 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg text-xs"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Move To</div>
                {task.status !== 'todo' && (
                  <button
                    onClick={() => {
                      onMoveQuick('todo');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-100"
                  >
                    To Do
                  </button>
                )}
                {task.status !== 'in_progress' && (
                  <button
                    onClick={() => {
                      onMoveQuick('in_progress');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-100"
                  >
                    In Progress
                  </button>
                )}
                {task.status !== 'review' && (
                  <button
                    onClick={() => {
                      onMoveQuick('review');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-100"
                  >
                    Review
                  </button>
                )}
                {task.status !== 'completed' && (
                  <button
                    onClick={() => {
                      onMoveQuick('completed');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-100"
                  >
                    Completed
                  </button>
                )}
              </div>
            )}
          </div>
          <GripVertical className="h-4 w-4 text-slate-300 opacity-40 group-hover:opacity-100 transition" />
        </div>
      </div>

      {/* Title */}
      <h4
        onClick={onClick}
        className="mt-2 text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition cursor-pointer leading-snug"
      >
        {task.title}
      </h4>

      {/* Description Snippet if present */}
      {task.description && (
        <p
          onClick={onClick}
          className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed cursor-pointer"
        >
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map(t => (
            <span
              key={t}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Comments & Assignee Avatar */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-2.5">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[11px] font-medium ${
                isOverdue
                  ? 'text-rose-600 font-bold'
                  : isDueToday
                  ? 'text-amber-600 font-bold'
                  : 'text-slate-500'
              }`}
              title={isOverdue ? 'Overdue!' : isDueToday ? 'Due today!' : `Due ${task.dueDate}`}
            >
              <Calendar className="h-3 w-3" />
              <span>{task.dueDate}</span>
            </span>
          )}

          {(task.commentsCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500" title="Comments">
              <MessageSquare className="h-3 w-3 text-slate-400" />
              <span>{task.commentsCount}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <img
            src={task.assignee.avatarUrl}
            alt={task.assignee.name}
            title={`Assigned to ${task.assignee.name}`}
            className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-300"
          />
        ) : (
          <span className="text-[10px] italic text-slate-400">Unassigned</span>
        )}
      </div>
    </div>
  );
};
