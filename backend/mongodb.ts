import mongoose, { Schema } from 'mongoose';
import type {
  User,
  Project,
  Task,
  Comment,
  Notification,
  ActivityLog,
} from './types.ts';

// User Schema
const UserSchema = new Schema<User>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  department: { type: String, default: '' },
  title: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Project Schema
const ProjectSchema = new Schema<Project>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: String, required: true },
  color: { type: String, default: 'emerald' },
  tag: { type: String, default: 'PROJ' },
  members: [
    {
      userId: { type: String, required: true },
      role: { type: String, enum: ['lead', 'member', 'viewer'], default: 'member' },
      joinedAt: { type: String, default: () => new Date().toISOString() },
    },
  ],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

// Task Schema
const TaskSchema = new Schema<Task>({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'completed'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assigneeId: { type: String, default: null },
  creatorId: { type: String, required: true },
  dueDate: { type: String, default: null },
  order: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

// Comment Schema
const CommentSchema = new Schema<Comment>({
  id: { type: String, required: true, unique: true },
  taskId: { type: String, required: true, index: true },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  content: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Notification Schema
const NotificationSchema = new Schema<Notification>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['task_assigned', 'comment_added', 'status_changed', 'deadline_approaching', 'project_invite'],
    required: true,
  },
  read: { type: Boolean, default: false },
  link: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Activity Schema
const ActivitySchema = new Schema<ActivityLog>({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  targetTitle: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model<Project>('Project', ProjectSchema);
export const TaskModel = mongoose.models.Task || mongoose.model<Task>('Task', TaskSchema);
export const CommentModel = mongoose.models.Comment || mongoose.model<Comment>('Comment', CommentSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model<Notification>('Notification', NotificationSchema);
export const ActivityModel = mongoose.models.Activity || mongoose.model<ActivityLog>('Activity', ActivitySchema);

export interface MongoStatus {
  connected: boolean;
  uriConfigured: boolean;
  dbName?: string;
  host?: string;
  error?: string;
}

let mongoStatus: MongoStatus = {
  connected: false,
  uriConfigured: false,
};

export function getMongoStatus(): MongoStatus {
  return mongoStatus;
}

export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

  if (!uri || !uri.trim()) {
    mongoStatus = {
      connected: false,
      uriConfigured: false,
    };
    console.log('ℹ MONGODB_URI is not set in .env. Using persistent JSON database (backend/data/db.json).');
    return false;
  }

  mongoStatus.uriConfigured = true;

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 5000,
    });

    mongoStatus = {
      connected: true,
      uriConfigured: true,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
    };

    console.log(`✓ Successfully connected to MongoDB! Database: [${mongoose.connection.name}] on host [${mongoose.connection.host}]`);
    return true;
  } catch (err: any) {
    mongoStatus = {
      connected: false,
      uriConfigured: true,
      error: err.message || 'Connection failed',
    };
    console.warn(`⚠ Failed to connect to MongoDB (${err.message}). Falling back to local persistent JSON database.`);
    return false;
  }
}
