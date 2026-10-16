export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectRole = 'lead' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  department?: string;
  title?: string;
  createdAt: string;
}

export interface EnrichedProjectMember {
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  name: string;
  email: string;
  avatarUrl: string;
  department?: string;
  title?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  color: string;
  tag: string;
  members: Array<{ userId: string; role: ProjectRole; joinedAt: string }>;
  enrichedMembers?: EnrichedProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  creatorId: string;
  dueDate: string | null;
  order: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Enriched fields from API:
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    department?: string;
  } | null;
  projectName?: string;
  projectColor?: string;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'comment_added'
  | 'status_changed'
  | 'deadline_approaching'
  | 'project_invite';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: string;
  targetTitle: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  totalTasks: number;
  myTasksCount: number;
  completedTasksCount: number;
  inProgressTasksCount: number;
  reviewTasksCount: number;
  todoTasksCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  completionRate: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  color: string;
  tag: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  membersCount: number;
  updatedAt: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  priorityDistribution: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  statusDistribution: {
    todo: number;
    in_progress: number;
    review: number;
    completed: number;
  };
  upcomingDeadlines: Array<Task & {
    projectName: string;
    projectColor: string;
    assigneeName: string;
    assigneeAvatar: string | null;
  }>;
  projectsSummary: ProjectSummary[];
  recentActivities: ActivityLog[];
}
