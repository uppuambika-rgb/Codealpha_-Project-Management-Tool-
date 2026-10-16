export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectRole = 'lead' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  avatarUrl: string;
  department?: string;
  title?: string;
  createdAt: string;
}

export type SafeUser = Omit<User, 'passwordHash' | 'salt'>;

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: ProjectMember[];
  color: string;
  tag: string;
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

export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  notifications: Notification[];
  activities: ActivityLog[];
}
