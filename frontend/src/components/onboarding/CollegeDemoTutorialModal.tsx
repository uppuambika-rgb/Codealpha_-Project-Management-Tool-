import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Users,
  FolderKanban,
  MessageSquare,
  Bell,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { api } from '../../services/api.ts';

interface CollegeDemoTutorialModalProps {
  onClose: () => void;
}

export const CollegeDemoTutorialModal: React.FC<CollegeDemoTutorialModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [notifTriggered, setNotifTriggered] = useState(false);
  const [resetting, setResetting] = useState(false);

  const steps = [
    {
      title: '1. Multi-User Team Roles & Auth',
      subtitle: 'Complete student collaboration environment',
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50',
      description:
        'FlowSprint includes pre-seeded college project team members: Alex Rivers (Team Lead), Maya Chen (Frontend Lead), Liam Vance (Backend Engineer), and Sophia Patel (QA). Use the "Persona" button in the top navbar to instantly test role-based permissions and task assignment without logging in and out.',
      highlights: [
        'Secure password hashing with PBKDF2 & HMAC authentication tokens',
        'Role tiers: Team Lead, Active Member, and Project Viewer',
        'One-click student persona switcher in the top navigation bar',
      ],
    },
    {
      title: '2. Interactive Kanban Boards',
      subtitle: 'Drag-and-drop workflow similar to Trello & Asana',
      icon: FolderKanban,
      color: 'text-teal-600 bg-teal-50',
      description:
        'Manage projects visually across four agile development stages: To Do, In Progress, In Review, and Completed. Seamlessly drag task cards between columns, filter by priority or assignee, and click any card to inspect its full scope.',
      highlights: [
        'HTML5 drag-and-drop with responsive drop highlights and optimistic UI',
        'Mobile-friendly quick move menu for touch devices',
        'Live search and multi-criteria filters (Priority, Assignee)',
      ],
    },
    {
      title: '3. Task Comments & Notification Hub',
      subtitle: 'Collaborative team communication',
      icon: Bell,
      color: 'text-blue-600 bg-blue-50',
      description:
        'Keep project communication organized directly on task cards. When team members comment or update a task status, recipients receive instant notification alerts in the bell icon.',
      highlights: [
        'Persistent threaded comments with author avatars and timestamps',
        'Real-time notification badges for assignments, reviews, and comments',
        'Notification bell dropdown with instant jump to task',
      ],
    },
    {
      title: '4. Analytics Dashboard & Delivery Deadlines',
      subtitle: 'Progress metrics and presentation readiness',
      icon: TrendingUp,
      color: 'text-emerald-700 bg-emerald-100',
      description:
        'The main dashboard provides an overview of completion velocity, urgency distributions, upcoming deadlines, and a live activity feed tracking all team member contributions.',
      highlights: [
        'Calculated completion rate percentages and task meters',
        'Overdue warning indicators and 7-day deadline schedule',
        'Live chronological team audit activity stream',
      ],
    },
  ];

  const current = steps[currentStep];
  const IconComponent = current.icon;

  const handleTestNotification = async () => {
    try {
      await api.notifications.testPing();
      setNotifTriggered(true);
      setTimeout(() => setNotifTriggered(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all demo projects and tasks to original college showcase state?')) return;
    setResetting(true);
    try {
      await api.dashboard.resetDemo();
      window.location.reload();
    } catch (e) {
      console.error(e);
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">College Demo & Presentation Guide</h2>
              <p className="text-xs text-slate-500">Step-by-step walkthrough for project evaluation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${current.color}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                {current.subtitle}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">{current.title}</h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {current.description}
          </p>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Features</p>
            {current.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Interactive Showcase Action on Step 2 & 3 */}
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
            <button
              onClick={handleTestNotification}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 transition"
            >
              <Send className="h-3.5 w-3.5 text-emerald-600" />
              <span>{notifTriggered ? '✓ Notification Sent!' : 'Send Test Notification'}</span>
            </button>

            <button
              onClick={handleResetData}
              disabled={resetting}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 transition"
            >
              <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Showcase Data</span>
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <span>Next Feature</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="rounded-xl bg-emerald-600 px-5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                Start Exploring
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
