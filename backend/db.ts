import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  DatabaseSchema,
  User,
  SafeUser,
  Project,
  Task,
  Comment,
  Notification,
  ActivityLog,
  TaskStatus,
} from './types.ts';
import {
  UserModel,
  ProjectModel,
  TaskModel,
  CommentModel,
  NotificationModel,
  ActivityModel,
  getMongoStatus,
} from './mongodb.ts';

const DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Helper to hash passwords consistently
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function getInitialSeedData(): DatabaseSchema {
  const salt1 = generateSalt();
  const salt2 = generateSalt();
  const salt3 = generateSalt();
  const salt4 = generateSalt();

  const users: User[] = [
    {
      id: 'user_alex',
      name: 'Alex Rivers',
      email: 'alex@campus.edu',
      passwordHash: hashPassword('password123', salt1),
      salt: salt1,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      department: 'Computer Science',
      title: 'Team Lead & Full-Stack',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'user_maya',
      name: 'Maya Chen',
      email: 'maya@campus.edu',
      passwordHash: hashPassword('password123', salt2),
      salt: salt2,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      department: 'Design & HCI',
      title: 'UI/UX & Frontend Specialist',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'user_liam',
      name: 'Liam Vance',
      email: 'liam@campus.edu',
      passwordHash: hashPassword('password123', salt3),
      salt: salt3,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      department: 'Software Engineering',
      title: 'Backend & Cloud Architect',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'user_sophia',
      name: 'Sophia Patel',
      email: 'sophia@campus.edu',
      passwordHash: hashPassword('password123', salt4),
      salt: salt4,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      department: 'Information Systems',
      title: 'QA & Product Specialist',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];

  const projects: Project[] = [
    {
      id: 'proj_campuseats',
      name: 'Campus Eats - Food Delivery',
      description: 'On-demand campus meal ordering platform connecting university dining halls and local cafes with students.',
      ownerId: 'user_alex',
      color: 'emerald',
      tag: 'CAPSTONE-01',
      members: [
        { userId: 'user_alex', role: 'lead', joinedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
        { userId: 'user_maya', role: 'member', joinedAt: new Date(Date.now() - 18 * 86400000).toISOString() },
        { userId: 'user_liam', role: 'member', joinedAt: new Date(Date.now() - 18 * 86400000).toISOString() },
        { userId: 'user_sophia', role: 'member', joinedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj_ecotrack',
      name: 'EcoTrack - Smart Energy Monitor',
      description: 'IoT sensor dashboard monitoring dorm electricity and carbon savings across university residential buildings.',
      ownerId: 'user_maya',
      color: 'teal',
      tag: 'GREEN-IOT',
      members: [
        { userId: 'user_maya', role: 'lead', joinedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
        { userId: 'user_alex', role: 'member', joinedAt: new Date(Date.now() - 12 * 86400000).toISOString() },
        { userId: 'user_liam', role: 'member', joinedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj_studysphere',
      name: 'StudySphere - Collaborative Notes',
      description: 'Peer-to-peer study group notes sharing, flashcards and syllabus milestones for finals preparation.',
      ownerId: 'user_liam',
      color: 'green',
      tag: 'STUDY-APP',
      members: [
        { userId: 'user_liam', role: 'lead', joinedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
        { userId: 'user_alex', role: 'member', joinedAt: new Date(Date.now() - 8 * 86400000).toISOString() },
        { userId: 'user_sophia', role: 'member', joinedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const today = new Date();
  const formatFuture = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().split('T')[0];
  const formatPast = (days: number) => new Date(today.getTime() - days * 86400000).toISOString().split('T')[0];

  const tasks: Task[] = [
    // Campus Eats Tasks
    {
      id: 'task_ce_1',
      projectId: 'proj_campuseats',
      title: 'Design dining hall menu schema and allergy filter tags',
      description: 'Define relational model for food items, calorie counts, vegetarian/vegan tags, and dining hall pickup lockers.',
      status: 'completed',
      priority: 'high',
      assigneeId: 'user_maya',
      creatorId: 'user_alex',
      dueDate: formatPast(2),
      order: 0,
      tags: ['Design', 'Database'],
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'task_ce_2',
      projectId: 'proj_campuseats',
      title: 'Implement Student ID card payment & campus cash webhook',
      description: 'Connect university payment gateway API and handle mock balance checks with simulated receipts.',
      status: 'in_progress',
      priority: 'urgent',
      assigneeId: 'user_liam',
      creatorId: 'user_alex',
      dueDate: formatFuture(2),
      order: 0,
      tags: ['Backend', 'Payment', 'API'],
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'task_ce_3',
      projectId: 'proj_campuseats',
      title: 'Build interactive cart & pickup time slot selector',
      description: 'Create responsive mobile-first order review screen with 15-minute staggered batch pickup windows.',
      status: 'in_progress',
      priority: 'medium',
      assigneeId: 'user_maya',
      creatorId: 'user_alex',
      dueDate: formatFuture(4),
      order: 1,
      tags: ['Frontend', 'UI/UX'],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'task_ce_4',
      projectId: 'proj_campuseats',
      title: 'Run end-to-end stress testing with 50 simulated orders',
      description: 'Verify kitchen order board concurrency when peak lunch crowd hits between 12:00 PM and 1:30 PM.',
      status: 'review',
      priority: 'high',
      assigneeId: 'user_sophia',
      creatorId: 'user_liam',
      dueDate: formatFuture(3),
      order: 0,
      tags: ['QA', 'Testing'],
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'task_ce_5',
      projectId: 'proj_campuseats',
      title: 'Add push notification sounds for driver dispatch',
      description: 'Provide audio chime and status badge pulse when dining hall staff marks an order "Ready at Locker".',
      status: 'todo',
      priority: 'low',
      assigneeId: 'user_alex',
      creatorId: 'user_maya',
      dueDate: formatFuture(7),
      order: 0,
      tags: ['Audio', 'Notifications'],
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'task_ce_6',
      projectId: 'proj_campuseats',
      title: 'Final college presentation slides & architectural diagrams',
      description: 'Prepare 10-slide deck with component flowcharts, tech stack breakdown, and live demo guide.',
      status: 'todo',
      priority: 'high',
      assigneeId: 'user_alex',
      creatorId: 'user_alex',
      dueDate: formatFuture(6),
      order: 1,
      tags: ['Demo', 'Presentation'],
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },

    // EcoTrack Tasks
    {
      id: 'task_eco_1',
      projectId: 'proj_ecotrack',
      title: 'Configure ESP32 power consumption telemetry MQTT broker',
      description: 'Stream wattage spikes from floor level circuit sub-meters into server ingestion pipeline.',
      status: 'in_progress',
      priority: 'high',
      assigneeId: 'user_liam',
      creatorId: 'user_maya',
      dueDate: formatFuture(3),
      order: 0,
      tags: ['IoT', 'MQTT'],
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_eco_2',
      projectId: 'proj_ecotrack',
      title: 'Draft green leaderboard badges for highest saving dorms',
      description: 'Vector badges for top eco-friendly suites with gamification reward points.',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'user_maya',
      creatorId: 'user_maya',
      dueDate: formatFuture(8),
      order: 0,
      tags: ['Design', 'Gamification'],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_eco_3',
      projectId: 'proj_ecotrack',
      title: 'Calibrate baseline kWh consumption for North Quad Hall',
      description: 'Aggregate historical weekend vs weekday data to highlight heating/cooling inefficiencies.',
      status: 'completed',
      priority: 'medium',
      assigneeId: 'user_alex',
      creatorId: 'user_maya',
      dueDate: formatPast(4),
      order: 0,
      tags: ['Analytics'],
      createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // StudySphere Tasks
    {
      id: 'task_ss_1',
      projectId: 'proj_studysphere',
      title: 'Build Markdown notes editor with syntax highlighting',
      description: 'Support code snippets, math equations, and checklist bullets for CS301 Algorithms class.',
      status: 'review',
      priority: 'high',
      assigneeId: 'user_sophia',
      creatorId: 'user_liam',
      dueDate: formatFuture(1),
      order: 0,
      tags: ['Editor', 'Frontend'],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_ss_2',
      projectId: 'proj_studysphere',
      title: 'Spaced repetition flashcard algorithm (SM-2 implementation)',
      description: 'Calculate review intervals based on user difficulty ratings 1 to 5.',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'user_liam',
      creatorId: 'user_liam',
      dueDate: formatFuture(5),
      order: 0,
      tags: ['Algorithm'],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const comments: Comment[] = [
    {
      id: 'comm_1',
      taskId: 'task_ce_2',
      projectId: 'proj_campuseats',
      userId: 'user_alex',
      userName: 'Alex Rivers',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      content: 'Tested the webhook endpoint with mock tokens, latency is under 45ms. Ready for the live demo run!',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      id: 'comm_2',
      taskId: 'task_ce_2',
      projectId: 'proj_campuseats',
      userId: 'user_liam',
      userName: 'Liam Vance',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      content: 'Awesome. I added graceful error states if someone has an insufficient campus balance.',
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
    {
      id: 'comm_3',
      taskId: 'task_ce_4',
      projectId: 'proj_campuseats',
      userId: 'user_sophia',
      userName: 'Sophia Patel',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      content: 'Completed 30 virtual order cycles. All sockets and order badges synced accurately without dropouts.',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif_1',
      userId: 'user_alex',
      title: 'New Comment on Payment Gateway',
      message: 'Liam Vance commented on "Implement Student ID card payment & campus cash webhook"',
      type: 'comment_added',
      read: false,
      link: '/project/proj_campuseats?task=task_ce_2',
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
    {
      id: 'notif_2',
      userId: 'user_alex',
      title: 'QA Review Ready',
      message: 'Sophia Patel moved "Run end-to-end stress testing" to Review',
      type: 'status_changed',
      read: false,
      link: '/project/proj_campuseats?task=task_ce_4',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      id: 'notif_3',
      userId: 'user_alex',
      title: 'Upcoming Deadline Warning',
      message: 'Payment Gateway task deadline is in 2 days.',
      type: 'deadline_approaching',
      read: true,
      link: '/project/proj_campuseats?task=task_ce_2',
      createdAt: new Date(Date.now() - 40 * 3600000).toISOString(),
    },
    {
      id: 'notif_4',
      userId: 'user_maya',
      title: 'Task Assigned',
      message: 'Alex Rivers assigned you "Design dining hall menu schema and allergy filter tags"',
      type: 'task_assigned',
      read: true,
      link: '/project/proj_campuseats?task=task_ce_1',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];

  const activities: ActivityLog[] = [
    {
      id: 'act_1',
      projectId: 'proj_campuseats',
      userId: 'user_alex',
      userName: 'Alex Rivers',
      action: 'created project',
      targetTitle: 'Campus Eats - Food Delivery',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'act_2',
      projectId: 'proj_campuseats',
      userId: 'user_alex',
      userName: 'Alex Rivers',
      action: 'assigned task',
      targetTitle: 'Implement Student ID card payment',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'act_3',
      projectId: 'proj_campuseats',
      userId: 'user_maya',
      userName: 'Maya Chen',
      action: 'completed task',
      targetTitle: 'Design dining hall menu schema',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'act_4',
      projectId: 'proj_campuseats',
      userId: 'user_sophia',
      userName: 'Sophia Patel',
      action: 'submitted review for',
      targetTitle: 'Run end-to-end stress testing',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  return {
    users,
    projects,
    tasks,
    comments,
    notifications,
    activities,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadFromDisk();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.projects && parsed.tasks) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse database file, re-initializing with seed data...', e);
    }

    const initial = getInitialSeedData();
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(dataToSave?: DatabaseSchema) {
    this.ensureDataDir();
    const data = dataToSave || this.data;
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // --- Reset for Demo ---
  public resetToSeed(): DatabaseSchema {
    this.data = getInitialSeedData();
    this.saveToDisk();

    if (getMongoStatus().connected) {
      Promise.all([
        UserModel.deleteMany({}),
        ProjectModel.deleteMany({}),
        TaskModel.deleteMany({}),
        CommentModel.deleteMany({}),
        NotificationModel.deleteMany({}),
        ActivityModel.deleteMany({}),
      ])
        .then(() => {
          return Promise.all([
            UserModel.insertMany(this.data.users),
            ProjectModel.insertMany(this.data.projects),
            TaskModel.insertMany(this.data.tasks),
            CommentModel.insertMany(this.data.comments),
            NotificationModel.insertMany(this.data.notifications),
            ActivityModel.insertMany(this.data.activities),
          ]);
        })
        .then(() => console.log('✓ Reset seed data in MongoDB.'))
        .catch(err => console.error('Failed to reset MongoDB data:', err));
    }

    return this.data;
  }

  // --- MongoDB Synchronization on Startup ---
  public async initMongoSync(): Promise<void> {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('🌱 Seeding MongoDB database with initial college showcase dataset...');
        await Promise.all([
          UserModel.insertMany(this.data.users),
          ProjectModel.insertMany(this.data.projects),
          TaskModel.insertMany(this.data.tasks),
          CommentModel.insertMany(this.data.comments),
          NotificationModel.insertMany(this.data.notifications),
          ActivityModel.insertMany(this.data.activities),
        ]);
        console.log('✓ MongoDB successfully populated with initial data.');
      } else {
        console.log('📥 Loading dataset from MongoDB...');
        const [users, projects, tasks, comments, notifications, activities] = await Promise.all([
          UserModel.find().lean(),
          ProjectModel.find().lean(),
          TaskModel.find().lean(),
          CommentModel.find().lean(),
          NotificationModel.find().lean(),
          ActivityModel.find().lean(),
        ]);

        let finalProjects = projects;
        let finalTasks = tasks;
        let finalComments = comments;
        let finalNotifications = notifications;
        let finalActivities = activities;

        if (projects.length === 0 && this.data.projects.length > 0) {
          console.log('🌱 Seeding initial showcase projects and tasks into MongoDB...');
          await Promise.all([
            ProjectModel.insertMany(this.data.projects),
            TaskModel.insertMany(this.data.tasks),
            CommentModel.insertMany(this.data.comments),
            NotificationModel.insertMany(this.data.notifications),
            ActivityModel.insertMany(this.data.activities),
          ]);
          finalProjects = (await ProjectModel.find().lean()) as any;
          finalTasks = (await TaskModel.find().lean()) as any;
          finalComments = (await CommentModel.find().lean()) as any;
          finalNotifications = (await NotificationModel.find().lean()) as any;
          finalActivities = (await ActivityModel.find().lean()) as any;
          console.log('✓ Seeded projects and tasks into MongoDB.');
        }

        this.data = {
          users: users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: u.passwordHash,
            salt: u.salt,
            avatarUrl: u.avatarUrl,
            department: u.department,
            title: u.title,
            createdAt: u.createdAt,
          })),
          projects: finalProjects.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            ownerId: p.ownerId,
            color: p.color,
            tag: p.tag,
            members: p.members || [],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })),
          tasks: finalTasks.map((t: any) => ({
            id: t.id,
            projectId: t.projectId,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            assigneeId: t.assigneeId,
            creatorId: t.creatorId,
            dueDate: t.dueDate,
            order: t.order,
            tags: t.tags || [],
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
          comments: finalComments.map((c: any) => ({
            id: c.id,
            taskId: c.taskId,
            projectId: c.projectId,
            userId: c.userId,
            userName: c.userName,
            userAvatar: c.userAvatar,
            content: c.content,
            createdAt: c.createdAt,
          })),
          notifications: finalNotifications.map((n: any) => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            link: n.link,
            createdAt: n.createdAt,
          })),
          activities: finalActivities.map((a: any) => ({
            id: a.id,
            projectId: a.projectId,
            userId: a.userId,
            userName: a.userName,
            action: a.action,
            targetTitle: a.targetTitle,
            createdAt: a.createdAt,
          })),
        };

        this.saveToDisk();
        console.log(`✓ Synchronized with MongoDB: ${users.length} users, ${projects.length} projects, ${tasks.length} tasks.`);
      }
    } catch (err) {
      console.error('Error during MongoDB sync:', err);
    }
  }

  public getDatabaseInfo() {
    const status = getMongoStatus();
    return {
      type: status.connected ? 'mongodb' : 'file',
      isMongoConnected: status.connected,
      uriConfigured: status.uriConfigured,
      dbName: status.dbName,
      host: status.host,
      error: status.error,
      localFilePath: 'backend/data/db.json',
    };
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getSafeUsers(): SafeUser[] {
    return this.data.users.map(({ passwordHash, salt, ...safe }) => safe);
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): SafeUser {
    this.data.users.push(user);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      UserModel.create(user).catch(err => console.error('MongoDB createUser error:', err));
    }

    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  // --- Projects ---
  public getProjects(): Project[] {
    return this.data.projects;
  }

  public getProjectsForUser(userId: string): Project[] {
    return this.data.projects.filter(
      p => p.ownerId === userId || p.members.some(m => m.userId === userId)
    );
  }

  public getProjectById(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  public createProject(project: Project): Project {
    this.data.projects.unshift(project);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      ProjectModel.create(project).catch(err => console.error('MongoDB createProject error:', err));
    }

    return project;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.projects[idx] = {
      ...this.data.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToDisk();

    if (getMongoStatus().connected) {
      ProjectModel.findOneAndUpdate({ id }, updates).catch(err => console.error('MongoDB updateProject error:', err));
    }

    return this.data.projects[idx];
  }

  public deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    // Cascade delete tasks, comments, activities
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    this.data.comments = this.data.comments.filter(c => c.projectId !== id);
    this.data.activities = this.data.activities.filter(a => a.projectId !== id);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      Promise.all([
        ProjectModel.deleteOne({ id }),
        TaskModel.deleteMany({ projectId: id }),
        CommentModel.deleteMany({ projectId: id }),
        ActivityModel.deleteMany({ projectId: id }),
      ]).catch(err => console.error('MongoDB deleteProject error:', err));
    }

    return this.data.projects.length < initialLen;
  }

  public addProjectMember(projectId: string, member: { userId: string; role: 'lead' | 'member' | 'viewer' }): Project | undefined {
    const project = this.getProjectById(projectId);
    if (!project) return undefined;
    const existing = project.members.find(m => m.userId === member.userId);
    if (existing) {
      existing.role = member.role;
    } else {
      project.members.push({
        userId: member.userId,
        role: member.role,
        joinedAt: new Date().toISOString(),
      });
    }
    project.updatedAt = new Date().toISOString();
    this.saveToDisk();

    if (getMongoStatus().connected) {
      ProjectModel.findOneAndUpdate({ id: projectId }, { members: project.members }).catch(err => console.error('MongoDB addProjectMember error:', err));
    }

    return project;
  }

  public removeProjectMember(projectId: string, userId: string): Project | undefined {
    const project = this.getProjectById(projectId);
    if (!project) return undefined;
    project.members = project.members.filter(m => m.userId !== userId);
    project.updatedAt = new Date().toISOString();
    this.saveToDisk();

    if (getMongoStatus().connected) {
      ProjectModel.findOneAndUpdate({ id: projectId }, { members: project.members }).catch(err => console.error('MongoDB removeProjectMember error:', err));
    }

    return project;
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    return this.data.tasks;
  }

  public getTasksByProject(projectId: string): Task[] {
    return this.data.tasks
      .filter(t => t.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  public getTasksForUser(userId: string): Task[] {
    return this.data.tasks.filter(t => t.assigneeId === userId);
  }

  public getTaskById(id: string): Task | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  public createTask(task: Task): Task {
    const siblings = this.data.tasks.filter(
      t => t.projectId === task.projectId && t.status === task.status
    );
    task.order = siblings.length;
    this.data.tasks.push(task);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      TaskModel.create(task).catch(err => console.error('MongoDB createTask error:', err));
    }

    return task;
  }

  public updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToDisk();

    if (getMongoStatus().connected) {
      TaskModel.findOneAndUpdate({ id }, updates).catch(err => console.error('MongoDB updateTask error:', err));
    }

    return this.data.tasks[idx];
  }

  public reorderTask(taskId: string, targetStatus: TaskStatus, newIndex: number): Task | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const oldStatus = task.status;
    const projectId = task.projectId;

    // Filter tasks in target status (excluding moving task)
    let columnTasks = this.data.tasks
      .filter(t => t.projectId === projectId && t.status === targetStatus && t.id !== taskId)
      .sort((a, b) => a.order - b.order);

    task.status = targetStatus;
    task.updatedAt = new Date().toISOString();

    // Insert at desired position
    const insertIdx = Math.max(0, Math.min(newIndex, columnTasks.length));
    columnTasks.splice(insertIdx, 0, task);

    // Re-index all in that column
    columnTasks.forEach((t, i) => {
      t.order = i;
    });

    // If moved from another column, re-index old column
    if (oldStatus !== targetStatus) {
      const oldCol = this.data.tasks
        .filter(t => t.projectId === projectId && t.status === oldStatus && t.id !== taskId)
        .sort((a, b) => a.order - b.order);
      oldCol.forEach((t, i) => {
        t.order = i;
      });
    }

    this.saveToDisk();

    if (getMongoStatus().connected) {
      Promise.all(
        columnTasks.map(t => TaskModel.findOneAndUpdate({ id: t.id }, { status: t.status, order: t.order }))
      ).catch(err => console.error('MongoDB reorderTask error:', err));
    }

    return task;
  }

  public deleteTask(id: string): boolean {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.data.comments = this.data.comments.filter(c => c.taskId !== id);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      Promise.all([
        TaskModel.deleteOne({ id }),
        CommentModel.deleteMany({ taskId: id }),
      ]).catch(err => console.error('MongoDB deleteTask error:', err));
    }

    return this.data.tasks.length < initialLen;
  }

  // --- Comments ---
  public getComments(taskId: string): Comment[] {
    return this.data.comments
      .filter(c => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getCommentById(id: string): Comment | undefined {
    return this.data.comments.find(c => c.id === id);
  }

  public createComment(comment: Comment): Comment {
    this.data.comments.push(comment);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      CommentModel.create(comment).catch(err => console.error('MongoDB createComment error:', err));
    }

    return comment;
  }

  public deleteComment(id: string): boolean {
    const initialLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter(c => c.id !== id);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      CommentModel.deleteOne({ id }).catch(err => console.error('MongoDB deleteComment error:', err));
    }

    return this.data.comments.length < initialLen;
  }

  // --- Notifications ---
  public getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notification: Notification): Notification {
    this.data.notifications.unshift(notification);
    this.saveToDisk();

    if (getMongoStatus().connected) {
      NotificationModel.create(notification).catch(err => console.error('MongoDB createNotification error:', err));
    }

    return notification;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.saveToDisk();

    if (getMongoStatus().connected) {
      NotificationModel.updateOne({ id }, { read: true }).catch(err => console.error('MongoDB markNotificationAsRead error:', err));
    }

    return true;
  }

  public markAllNotificationsAsRead(userId: string): number {
    let count = 0;
    this.data.notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    if (count > 0) this.saveToDisk();

    if (getMongoStatus().connected) {
      NotificationModel.updateMany({ userId }, { read: true }).catch(err => console.error('MongoDB markAllNotificationsAsRead error:', err));
    }

    return count;
  }

  // --- Activities ---
  public getActivities(projectId?: string): ActivityLog[] {
    if (projectId) {
      return this.data.activities
        .filter(a => a.projectId === projectId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.activities
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }

  public logActivity(activity: ActivityLog): ActivityLog {
    this.data.activities.unshift(activity);
    if (this.data.activities.length > 200) {
      this.data.activities = this.data.activities.slice(0, 200);
    }
    this.saveToDisk();

    if (getMongoStatus().connected) {
      ActivityModel.create(activity).catch(err => console.error('MongoDB logActivity error:', err));
    }

    return activity;
  }
}

export const db = new Database();
