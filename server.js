// backend/server.ts
import dotenv from "dotenv";
import http from "http";
import path2 from "path";
import fs2 from "fs";
import express2 from "express";
import { createServer as createViteServer } from "vite";

// backend/app.ts
import express from "express";

// backend/routes/authRoutes.ts
import { Router } from "express";
import crypto3 from "crypto";

// backend/db.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";

// backend/mongodb.ts
import mongoose, { Schema } from "mongoose";
var UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  avatarUrl: { type: String, default: "" },
  department: { type: String, default: "" },
  title: { type: String, default: "" },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var ProjectSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  ownerId: { type: String, required: true },
  color: { type: String, default: "emerald" },
  tag: { type: String, default: "PROJ" },
  members: [
    {
      userId: { type: String, required: true },
      role: { type: String, enum: ["lead", "member", "viewer"], default: "member" },
      joinedAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
    }
  ],
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() },
  updatedAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var TaskSchema = new Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["todo", "in_progress", "review", "completed"], default: "todo" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  assigneeId: { type: String, default: null },
  creatorId: { type: String, required: true },
  dueDate: { type: String, default: null },
  order: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() },
  updatedAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var CommentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  taskId: { type: String, required: true, index: true },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: "" },
  content: { type: String, required: true },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["task_assigned", "comment_added", "status_changed", "deadline_approaching", "project_invite"],
    required: true
  },
  read: { type: Boolean, default: false },
  link: { type: String },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var ActivitySchema = new Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  targetTitle: { type: String, required: true },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
var ProjectModel = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
var TaskModel = mongoose.models.Task || mongoose.model("Task", TaskSchema);
var CommentModel = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
var NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
var ActivityModel = mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
var mongoStatus = {
  connected: false,
  uriConfigured: false
};
function getMongoStatus() {
  return mongoStatus;
}
async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri || !uri.trim()) {
    mongoStatus = {
      connected: false,
      uriConfigured: false
    };
    console.log("\u2139 MONGODB_URI is not set in .env. Using persistent JSON database (backend/data/db.json).");
    return false;
  }
  mongoStatus.uriConfigured = true;
  try {
    console.log("\u23F3 Connecting to MongoDB...");
    await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 5e3
    });
    mongoStatus = {
      connected: true,
      uriConfigured: true,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host
    };
    console.log(`\u2713 Successfully connected to MongoDB! Database: [${mongoose.connection.name}] on host [${mongoose.connection.host}]`);
    return true;
  } catch (err) {
    mongoStatus = {
      connected: false,
      uriConfigured: true,
      error: err.message || "Connection failed"
    };
    console.warn(`\u26A0 Failed to connect to MongoDB (${err.message}). Falling back to local persistent JSON database.`);
    return false;
  }
}

// backend/db.ts
var DATA_DIR = path.resolve(process.cwd(), "backend", "data");
var DB_FILE = path.join(DATA_DIR, "db.json");
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
}
function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}
function getInitialSeedData() {
  const salt1 = generateSalt();
  const salt2 = generateSalt();
  const salt3 = generateSalt();
  const salt4 = generateSalt();
  const users = [
    {
      id: "user_alex",
      name: "Alex Rivers",
      email: "alex@campus.edu",
      passwordHash: hashPassword("password123", salt1),
      salt: salt1,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      department: "Computer Science",
      title: "Team Lead & Full-Stack",
      createdAt: new Date(Date.now() - 30 * 864e5).toISOString()
    },
    {
      id: "user_maya",
      name: "Maya Chen",
      email: "maya@campus.edu",
      passwordHash: hashPassword("password123", salt2),
      salt: salt2,
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      department: "Design & HCI",
      title: "UI/UX & Frontend Specialist",
      createdAt: new Date(Date.now() - 25 * 864e5).toISOString()
    },
    {
      id: "user_liam",
      name: "Liam Vance",
      email: "liam@campus.edu",
      passwordHash: hashPassword("password123", salt3),
      salt: salt3,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      department: "Software Engineering",
      title: "Backend & Cloud Architect",
      createdAt: new Date(Date.now() - 20 * 864e5).toISOString()
    },
    {
      id: "user_sophia",
      name: "Sophia Patel",
      email: "sophia@campus.edu",
      passwordHash: hashPassword("password123", salt4),
      salt: salt4,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      department: "Information Systems",
      title: "QA & Product Specialist",
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString()
    }
  ];
  const projects = [
    {
      id: "proj_campuseats",
      name: "Campus Eats - Food Delivery",
      description: "On-demand campus meal ordering platform connecting university dining halls and local cafes with students.",
      ownerId: "user_alex",
      color: "emerald",
      tag: "CAPSTONE-01",
      members: [
        { userId: "user_alex", role: "lead", joinedAt: new Date(Date.now() - 20 * 864e5).toISOString() },
        { userId: "user_maya", role: "member", joinedAt: new Date(Date.now() - 18 * 864e5).toISOString() },
        { userId: "user_liam", role: "member", joinedAt: new Date(Date.now() - 18 * 864e5).toISOString() },
        { userId: "user_sophia", role: "member", joinedAt: new Date(Date.now() - 15 * 864e5).toISOString() }
      ],
      createdAt: new Date(Date.now() - 20 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "proj_ecotrack",
      name: "EcoTrack - Smart Energy Monitor",
      description: "IoT sensor dashboard monitoring dorm electricity and carbon savings across university residential buildings.",
      ownerId: "user_maya",
      color: "teal",
      tag: "GREEN-IOT",
      members: [
        { userId: "user_maya", role: "lead", joinedAt: new Date(Date.now() - 14 * 864e5).toISOString() },
        { userId: "user_alex", role: "member", joinedAt: new Date(Date.now() - 12 * 864e5).toISOString() },
        { userId: "user_liam", role: "member", joinedAt: new Date(Date.now() - 10 * 864e5).toISOString() }
      ],
      createdAt: new Date(Date.now() - 14 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "proj_studysphere",
      name: "StudySphere - Collaborative Notes",
      description: "Peer-to-peer study group notes sharing, flashcards and syllabus milestones for finals preparation.",
      ownerId: "user_liam",
      color: "green",
      tag: "STUDY-APP",
      members: [
        { userId: "user_liam", role: "lead", joinedAt: new Date(Date.now() - 10 * 864e5).toISOString() },
        { userId: "user_alex", role: "member", joinedAt: new Date(Date.now() - 8 * 864e5).toISOString() },
        { userId: "user_sophia", role: "member", joinedAt: new Date(Date.now() - 7 * 864e5).toISOString() }
      ],
      createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  const today = /* @__PURE__ */ new Date();
  const formatFuture = (days) => new Date(today.getTime() + days * 864e5).toISOString().split("T")[0];
  const formatPast = (days) => new Date(today.getTime() - days * 864e5).toISOString().split("T")[0];
  const tasks = [
    // Campus Eats Tasks
    {
      id: "task_ce_1",
      projectId: "proj_campuseats",
      title: "Design dining hall menu schema and allergy filter tags",
      description: "Define relational model for food items, calorie counts, vegetarian/vegan tags, and dining hall pickup lockers.",
      status: "completed",
      priority: "high",
      assigneeId: "user_maya",
      creatorId: "user_alex",
      dueDate: formatPast(2),
      order: 0,
      tags: ["Design", "Database"],
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 864e5).toISOString()
    },
    {
      id: "task_ce_2",
      projectId: "proj_campuseats",
      title: "Implement Student ID card payment & campus cash webhook",
      description: "Connect university payment gateway API and handle mock balance checks with simulated receipts.",
      status: "in_progress",
      priority: "urgent",
      assigneeId: "user_liam",
      creatorId: "user_alex",
      dueDate: formatFuture(2),
      order: 0,
      tags: ["Backend", "Payment", "API"],
      createdAt: new Date(Date.now() - 12 * 864e5).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 864e5).toISOString()
    },
    {
      id: "task_ce_3",
      projectId: "proj_campuseats",
      title: "Build interactive cart & pickup time slot selector",
      description: "Create responsive mobile-first order review screen with 15-minute staggered batch pickup windows.",
      status: "in_progress",
      priority: "medium",
      assigneeId: "user_maya",
      creatorId: "user_alex",
      dueDate: formatFuture(4),
      order: 1,
      tags: ["Frontend", "UI/UX"],
      createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 864e5).toISOString()
    },
    {
      id: "task_ce_4",
      projectId: "proj_campuseats",
      title: "Run end-to-end stress testing with 50 simulated orders",
      description: "Verify kitchen order board concurrency when peak lunch crowd hits between 12:00 PM and 1:30 PM.",
      status: "review",
      priority: "high",
      assigneeId: "user_sophia",
      creatorId: "user_liam",
      dueDate: formatFuture(3),
      order: 0,
      tags: ["QA", "Testing"],
      createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 864e5).toISOString()
    },
    {
      id: "task_ce_5",
      projectId: "proj_campuseats",
      title: "Add push notification sounds for driver dispatch",
      description: 'Provide audio chime and status badge pulse when dining hall staff marks an order "Ready at Locker".',
      status: "todo",
      priority: "low",
      assigneeId: "user_alex",
      creatorId: "user_maya",
      dueDate: formatFuture(7),
      order: 0,
      tags: ["Audio", "Notifications"],
      createdAt: new Date(Date.now() - 6 * 864e5).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 864e5).toISOString()
    },
    {
      id: "task_ce_6",
      projectId: "proj_campuseats",
      title: "Final college presentation slides & architectural diagrams",
      description: "Prepare 10-slide deck with component flowcharts, tech stack breakdown, and live demo guide.",
      status: "todo",
      priority: "high",
      assigneeId: "user_alex",
      creatorId: "user_alex",
      dueDate: formatFuture(6),
      order: 1,
      tags: ["Demo", "Presentation"],
      createdAt: new Date(Date.now() - 4 * 864e5).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 864e5).toISOString()
    },
    // EcoTrack Tasks
    {
      id: "task_eco_1",
      projectId: "proj_ecotrack",
      title: "Configure ESP32 power consumption telemetry MQTT broker",
      description: "Stream wattage spikes from floor level circuit sub-meters into server ingestion pipeline.",
      status: "in_progress",
      priority: "high",
      assigneeId: "user_liam",
      creatorId: "user_maya",
      dueDate: formatFuture(3),
      order: 0,
      tags: ["IoT", "MQTT"],
      createdAt: new Date(Date.now() - 9 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "task_eco_2",
      projectId: "proj_ecotrack",
      title: "Draft green leaderboard badges for highest saving dorms",
      description: "Vector badges for top eco-friendly suites with gamification reward points.",
      status: "todo",
      priority: "medium",
      assigneeId: "user_maya",
      creatorId: "user_maya",
      dueDate: formatFuture(8),
      order: 0,
      tags: ["Design", "Gamification"],
      createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "task_eco_3",
      projectId: "proj_ecotrack",
      title: "Calibrate baseline kWh consumption for North Quad Hall",
      description: "Aggregate historical weekend vs weekday data to highlight heating/cooling inefficiencies.",
      status: "completed",
      priority: "medium",
      assigneeId: "user_alex",
      creatorId: "user_maya",
      dueDate: formatPast(4),
      order: 0,
      tags: ["Analytics"],
      createdAt: new Date(Date.now() - 11 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    // StudySphere Tasks
    {
      id: "task_ss_1",
      projectId: "proj_studysphere",
      title: "Build Markdown notes editor with syntax highlighting",
      description: "Support code snippets, math equations, and checklist bullets for CS301 Algorithms class.",
      status: "review",
      priority: "high",
      assigneeId: "user_sophia",
      creatorId: "user_liam",
      dueDate: formatFuture(1),
      order: 0,
      tags: ["Editor", "Frontend"],
      createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "task_ss_2",
      projectId: "proj_studysphere",
      title: "Spaced repetition flashcard algorithm (SM-2 implementation)",
      description: "Calculate review intervals based on user difficulty ratings 1 to 5.",
      status: "todo",
      priority: "medium",
      assigneeId: "user_liam",
      creatorId: "user_liam",
      dueDate: formatFuture(5),
      order: 0,
      tags: ["Algorithm"],
      createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  const comments = [
    {
      id: "comm_1",
      taskId: "task_ce_2",
      projectId: "proj_campuseats",
      userId: "user_alex",
      userName: "Alex Rivers",
      userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      content: "Tested the webhook endpoint with mock tokens, latency is under 45ms. Ready for the live demo run!",
      createdAt: new Date(Date.now() - 24 * 36e5).toISOString()
    },
    {
      id: "comm_2",
      taskId: "task_ce_2",
      projectId: "proj_campuseats",
      userId: "user_liam",
      userName: "Liam Vance",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      content: "Awesome. I added graceful error states if someone has an insufficient campus balance.",
      createdAt: new Date(Date.now() - 18 * 36e5).toISOString()
    },
    {
      id: "comm_3",
      taskId: "task_ce_4",
      projectId: "proj_campuseats",
      userId: "user_sophia",
      userName: "Sophia Patel",
      userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      content: "Completed 30 virtual order cycles. All sockets and order badges synced accurately without dropouts.",
      createdAt: new Date(Date.now() - 5 * 36e5).toISOString()
    }
  ];
  const notifications = [
    {
      id: "notif_1",
      userId: "user_alex",
      title: "New Comment on Payment Gateway",
      message: 'Liam Vance commented on "Implement Student ID card payment & campus cash webhook"',
      type: "comment_added",
      read: false,
      link: "/project/proj_campuseats?task=task_ce_2",
      createdAt: new Date(Date.now() - 18 * 36e5).toISOString()
    },
    {
      id: "notif_2",
      userId: "user_alex",
      title: "QA Review Ready",
      message: 'Sophia Patel moved "Run end-to-end stress testing" to Review',
      type: "status_changed",
      read: false,
      link: "/project/proj_campuseats?task=task_ce_4",
      createdAt: new Date(Date.now() - 5 * 36e5).toISOString()
    },
    {
      id: "notif_3",
      userId: "user_alex",
      title: "Upcoming Deadline Warning",
      message: "Payment Gateway task deadline is in 2 days.",
      type: "deadline_approaching",
      read: true,
      link: "/project/proj_campuseats?task=task_ce_2",
      createdAt: new Date(Date.now() - 40 * 36e5).toISOString()
    },
    {
      id: "notif_4",
      userId: "user_maya",
      title: "Task Assigned",
      message: 'Alex Rivers assigned you "Design dining hall menu schema and allergy filter tags"',
      type: "task_assigned",
      read: true,
      link: "/project/proj_campuseats?task=task_ce_1",
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString()
    }
  ];
  const activities = [
    {
      id: "act_1",
      projectId: "proj_campuseats",
      userId: "user_alex",
      userName: "Alex Rivers",
      action: "created project",
      targetTitle: "Campus Eats - Food Delivery",
      createdAt: new Date(Date.now() - 20 * 864e5).toISOString()
    },
    {
      id: "act_2",
      projectId: "proj_campuseats",
      userId: "user_alex",
      userName: "Alex Rivers",
      action: "assigned task",
      targetTitle: "Implement Student ID card payment",
      createdAt: new Date(Date.now() - 12 * 864e5).toISOString()
    },
    {
      id: "act_3",
      projectId: "proj_campuseats",
      userId: "user_maya",
      userName: "Maya Chen",
      action: "completed task",
      targetTitle: "Design dining hall menu schema",
      createdAt: new Date(Date.now() - 3 * 864e5).toISOString()
    },
    {
      id: "act_4",
      projectId: "proj_campuseats",
      userId: "user_sophia",
      userName: "Sophia Patel",
      action: "submitted review for",
      targetTitle: "Run end-to-end stress testing",
      createdAt: new Date(Date.now() - 1 * 864e5).toISOString()
    }
  ];
  return {
    users,
    projects,
    tasks,
    comments,
    notifications,
    activities
  };
}
var Database = class {
  constructor() {
    this.ensureDataDir();
    this.data = this.loadFromDisk();
  }
  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
  loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.projects && parsed.tasks) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse database file, re-initializing with seed data...", e);
    }
    const initial = getInitialSeedData();
    this.saveToDisk(initial);
    return initial;
  }
  saveToDisk(dataToSave) {
    this.ensureDataDir();
    const data = dataToSave || this.data;
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  }
  // --- Reset for Demo ---
  resetToSeed() {
    this.data = getInitialSeedData();
    this.saveToDisk();
    if (getMongoStatus().connected) {
      Promise.all([
        UserModel.deleteMany({}),
        ProjectModel.deleteMany({}),
        TaskModel.deleteMany({}),
        CommentModel.deleteMany({}),
        NotificationModel.deleteMany({}),
        ActivityModel.deleteMany({})
      ]).then(() => {
        return Promise.all([
          UserModel.insertMany(this.data.users),
          ProjectModel.insertMany(this.data.projects),
          TaskModel.insertMany(this.data.tasks),
          CommentModel.insertMany(this.data.comments),
          NotificationModel.insertMany(this.data.notifications),
          ActivityModel.insertMany(this.data.activities)
        ]);
      }).then(() => console.log("\u2713 Reset seed data in MongoDB.")).catch((err) => console.error("Failed to reset MongoDB data:", err));
    }
    return this.data;
  }
  // --- MongoDB Synchronization on Startup ---
  async initMongoSync() {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log("\u{1F331} Seeding MongoDB database with initial college showcase dataset...");
        await Promise.all([
          UserModel.insertMany(this.data.users),
          ProjectModel.insertMany(this.data.projects),
          TaskModel.insertMany(this.data.tasks),
          CommentModel.insertMany(this.data.comments),
          NotificationModel.insertMany(this.data.notifications),
          ActivityModel.insertMany(this.data.activities)
        ]);
        console.log("\u2713 MongoDB successfully populated with initial data.");
      } else {
        console.log("\u{1F4E5} Loading dataset from MongoDB...");
        const [users, projects, tasks, comments, notifications, activities] = await Promise.all([
          UserModel.find().lean(),
          ProjectModel.find().lean(),
          TaskModel.find().lean(),
          CommentModel.find().lean(),
          NotificationModel.find().lean(),
          ActivityModel.find().lean()
        ]);
        let finalProjects = projects;
        let finalTasks = tasks;
        let finalComments = comments;
        let finalNotifications = notifications;
        let finalActivities = activities;
        if (projects.length === 0 && this.data.projects.length > 0) {
          console.log("\u{1F331} Seeding initial showcase projects and tasks into MongoDB...");
          await Promise.all([
            ProjectModel.insertMany(this.data.projects),
            TaskModel.insertMany(this.data.tasks),
            CommentModel.insertMany(this.data.comments),
            NotificationModel.insertMany(this.data.notifications),
            ActivityModel.insertMany(this.data.activities)
          ]);
          finalProjects = await ProjectModel.find().lean();
          finalTasks = await TaskModel.find().lean();
          finalComments = await CommentModel.find().lean();
          finalNotifications = await NotificationModel.find().lean();
          finalActivities = await ActivityModel.find().lean();
          console.log("\u2713 Seeded projects and tasks into MongoDB.");
        }
        this.data = {
          users: users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: u.passwordHash,
            salt: u.salt,
            avatarUrl: u.avatarUrl,
            department: u.department,
            title: u.title,
            createdAt: u.createdAt
          })),
          projects: finalProjects.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            ownerId: p.ownerId,
            color: p.color,
            tag: p.tag,
            members: p.members || [],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
          })),
          tasks: finalTasks.map((t) => ({
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
            updatedAt: t.updatedAt
          })),
          comments: finalComments.map((c) => ({
            id: c.id,
            taskId: c.taskId,
            projectId: c.projectId,
            userId: c.userId,
            userName: c.userName,
            userAvatar: c.userAvatar,
            content: c.content,
            createdAt: c.createdAt
          })),
          notifications: finalNotifications.map((n) => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            link: n.link,
            createdAt: n.createdAt
          })),
          activities: finalActivities.map((a) => ({
            id: a.id,
            projectId: a.projectId,
            userId: a.userId,
            userName: a.userName,
            action: a.action,
            targetTitle: a.targetTitle,
            createdAt: a.createdAt
          }))
        };
        this.saveToDisk();
        console.log(`\u2713 Synchronized with MongoDB: ${users.length} users, ${projects.length} projects, ${tasks.length} tasks.`);
      }
    } catch (err) {
      console.error("Error during MongoDB sync:", err);
    }
  }
  getDatabaseInfo() {
    const status = getMongoStatus();
    return {
      type: status.connected ? "mongodb" : "file",
      isMongoConnected: status.connected,
      uriConfigured: status.uriConfigured,
      dbName: status.dbName,
      host: status.host,
      error: status.error,
      localFilePath: "backend/data/db.json"
    };
  }
  // --- Users ---
  getUsers() {
    return this.data.users;
  }
  getSafeUsers() {
    return this.data.users.map(({ passwordHash, salt, ...safe }) => safe);
  }
  getUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  getUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  createUser(user) {
    this.data.users.push(user);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      UserModel.create(user).catch((err) => console.error("MongoDB createUser error:", err));
    }
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }
  // --- Projects ---
  getProjects() {
    return this.data.projects;
  }
  getProjectsForUser(userId) {
    return this.data.projects.filter(
      (p) => p.ownerId === userId || p.members.some((m) => m.userId === userId)
    );
  }
  getProjectById(id) {
    return this.data.projects.find((p) => p.id === id);
  }
  createProject(project) {
    this.data.projects.unshift(project);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      ProjectModel.create(project).catch((err) => console.error("MongoDB createProject error:", err));
    }
    return project;
  }
  updateProject(id, updates) {
    const idx = this.data.projects.findIndex((p) => p.id === id);
    if (idx === -1) return void 0;
    this.data.projects[idx] = {
      ...this.data.projects[idx],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveToDisk();
    if (getMongoStatus().connected) {
      ProjectModel.findOneAndUpdate({ id }, updates).catch((err) => console.error("MongoDB updateProject error:", err));
    }
    return this.data.projects[idx];
  }
  deleteProject(id) {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.data.tasks = this.data.tasks.filter((t) => t.projectId !== id);
    this.data.comments = this.data.comments.filter((c) => c.projectId !== id);
    this.data.activities = this.data.activities.filter((a) => a.projectId !== id);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      Promise.all([
        ProjectModel.deleteOne({ id }),
        TaskModel.deleteMany({ projectId: id }),
        CommentModel.deleteMany({ projectId: id }),
        ActivityModel.deleteMany({ projectId: id })
      ]).catch((err) => console.error("MongoDB deleteProject error:", err));
    }
    return this.data.projects.length < initialLen;
  }
  addProjectMember(projectId, member) {
    const project = this.getProjectById(projectId);
    if (!project) return void 0;
    const existing = project.members.find((m) => m.userId === member.userId);
    if (existing) {
      existing.role = member.role;
    } else {
      project.members.push({
        userId: member.userId,
        role: member.role,
        joinedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.saveToDisk();
    if (getMongoStatus().connected) {
      ProjectModel.findOneAndUpdate({ id: projectId }, { members: project.members }).catch((err) => console.error("MongoDB addProjectMember error:", err));
    }
    return project;
  }
  removeProjectMember(projectId, userId) {
    const project = this.getProjectById(projectId);
    if (!project) return void 0;
    project.members = project.members.filter((m) => m.userId !== userId);
    project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.saveToDisk();
    if (getMongoStatus().connected) {
      ProjectModel.findOneAndUpdate({ id: projectId }, { members: project.members }).catch((err) => console.error("MongoDB removeProjectMember error:", err));
    }
    return project;
  }
  // --- Tasks ---
  getTasks() {
    return this.data.tasks;
  }
  getTasksByProject(projectId) {
    return this.data.tasks.filter((t) => t.projectId === projectId).sort((a, b) => a.order - b.order);
  }
  getTasksForUser(userId) {
    return this.data.tasks.filter((t) => t.assigneeId === userId);
  }
  getTaskById(id) {
    return this.data.tasks.find((t) => t.id === id);
  }
  createTask(task) {
    const siblings = this.data.tasks.filter(
      (t) => t.projectId === task.projectId && t.status === task.status
    );
    task.order = siblings.length;
    this.data.tasks.push(task);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      TaskModel.create(task).catch((err) => console.error("MongoDB createTask error:", err));
    }
    return task;
  }
  updateTask(id, updates) {
    const idx = this.data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return void 0;
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveToDisk();
    if (getMongoStatus().connected) {
      TaskModel.findOneAndUpdate({ id }, updates).catch((err) => console.error("MongoDB updateTask error:", err));
    }
    return this.data.tasks[idx];
  }
  reorderTask(taskId, targetStatus, newIndex) {
    const task = this.getTaskById(taskId);
    if (!task) return void 0;
    const oldStatus = task.status;
    const projectId = task.projectId;
    let columnTasks = this.data.tasks.filter((t) => t.projectId === projectId && t.status === targetStatus && t.id !== taskId).sort((a, b) => a.order - b.order);
    task.status = targetStatus;
    task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const insertIdx = Math.max(0, Math.min(newIndex, columnTasks.length));
    columnTasks.splice(insertIdx, 0, task);
    columnTasks.forEach((t, i) => {
      t.order = i;
    });
    if (oldStatus !== targetStatus) {
      const oldCol = this.data.tasks.filter((t) => t.projectId === projectId && t.status === oldStatus && t.id !== taskId).sort((a, b) => a.order - b.order);
      oldCol.forEach((t, i) => {
        t.order = i;
      });
    }
    this.saveToDisk();
    if (getMongoStatus().connected) {
      Promise.all(
        columnTasks.map((t) => TaskModel.findOneAndUpdate({ id: t.id }, { status: t.status, order: t.order }))
      ).catch((err) => console.error("MongoDB reorderTask error:", err));
    }
    return task;
  }
  deleteTask(id) {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.data.comments = this.data.comments.filter((c) => c.taskId !== id);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      Promise.all([
        TaskModel.deleteOne({ id }),
        CommentModel.deleteMany({ taskId: id })
      ]).catch((err) => console.error("MongoDB deleteTask error:", err));
    }
    return this.data.tasks.length < initialLen;
  }
  // --- Comments ---
  getComments(taskId) {
    return this.data.comments.filter((c) => c.taskId === taskId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  getCommentById(id) {
    return this.data.comments.find((c) => c.id === id);
  }
  createComment(comment) {
    this.data.comments.push(comment);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      CommentModel.create(comment).catch((err) => console.error("MongoDB createComment error:", err));
    }
    return comment;
  }
  deleteComment(id) {
    const initialLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter((c) => c.id !== id);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      CommentModel.deleteOne({ id }).catch((err) => console.error("MongoDB deleteComment error:", err));
    }
    return this.data.comments.length < initialLen;
  }
  // --- Notifications ---
  getNotifications(userId) {
    return this.data.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  createNotification(notification) {
    this.data.notifications.unshift(notification);
    this.saveToDisk();
    if (getMongoStatus().connected) {
      NotificationModel.create(notification).catch((err) => console.error("MongoDB createNotification error:", err));
    }
    return notification;
  }
  markNotificationAsRead(id) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.saveToDisk();
    if (getMongoStatus().connected) {
      NotificationModel.updateOne({ id }, { read: true }).catch((err) => console.error("MongoDB markNotificationAsRead error:", err));
    }
    return true;
  }
  markAllNotificationsAsRead(userId) {
    let count = 0;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    if (count > 0) this.saveToDisk();
    if (getMongoStatus().connected) {
      NotificationModel.updateMany({ userId }, { read: true }).catch((err) => console.error("MongoDB markAllNotificationsAsRead error:", err));
    }
    return count;
  }
  // --- Activities ---
  getActivities(projectId) {
    if (projectId) {
      return this.data.activities.filter((a) => a.projectId === projectId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.activities.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
  }
  logActivity(activity) {
    this.data.activities.unshift(activity);
    if (this.data.activities.length > 200) {
      this.data.activities = this.data.activities.slice(0, 200);
    }
    this.saveToDisk();
    if (getMongoStatus().connected) {
      ActivityModel.create(activity).catch((err) => console.error("MongoDB logActivity error:", err));
    }
    return activity;
  }
};
var db = new Database();

// backend/auth.ts
import crypto2 from "crypto";
var TOKEN_SECRET = process.env.AUTH_SECRET || "flowsprint-dev-secret-key-college-demo-2026";
function generateToken(userId) {
  const payload = {
    userId,
    exp: Date.now() + 14 * 24 * 60 * 60 * 1e3
    // 14 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto2.createHmac("sha256", TOKEN_SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}
function verifyToken(token) {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    const expectedSig = crypto2.createHmac("sha256", TOKEN_SECRET).update(payloadB64).digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (Date.now() > payload.exp) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = authHeader.substring(7);
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "User no longer exists" });
  }
  const { passwordHash, salt, ...safeUser } = user;
  req.user = safeUser;
  next();
}

// backend/routes/authRoutes.ts
var router = Router();
router.post("/register", (req, res) => {
  try {
    const { name, email, password, department, title } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = `user_${Date.now()}_${crypto3.randomBytes(3).toString("hex")}`;
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=10b981,059669,047857`;
    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      avatarUrl,
      department: department?.trim() || "General",
      title: title?.trim() || "Team Member",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const safeUser = db.createUser(newUser);
    const token = generateToken(safeUser.id);
    return res.status(201).json({
      user: safeUser,
      token,
      message: "Account created successfully"
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error during registration" });
  }
});
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const testHash = hashPassword(password, user.salt);
    if (testHash !== user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = generateToken(user.id);
    const { passwordHash, salt, ...safeUser } = user;
    return res.json({
      user: safeUser,
      token,
      message: "Login successful"
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error during login" });
  }
});
router.get("/me", authenticate, (req, res) => {
  return res.json({ user: req.user });
});
router.post("/logout", (req, res) => {
  return res.json({ message: "Logged out successfully" });
});
router.get("/users", authenticate, (_req, res) => {
  const users = db.getSafeUsers();
  return res.json({ users });
});
router.post("/demo-switch", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const token = generateToken(user.id);
  const { passwordHash, salt, ...safeUser } = user;
  return res.json({
    user: safeUser,
    token,
    message: `Switched active user to ${user.name}`
  });
});
var authRoutes_default = router;

// backend/routes/projectRoutes.ts
import { Router as Router2 } from "express";
import crypto4 from "crypto";
var router2 = Router2();
router2.get("/", authenticate, (req, res) => {
  const currentUserId = req.user.id;
  const projects = db.getProjectsForUser(currentUserId);
  return res.json({ projects });
});
router2.get("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const enrichedMembers = project.members.map((m) => {
    const user = db.getUserById(m.userId);
    return {
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      name: user ? user.name : "Unknown User",
      email: user ? user.email : "",
      avatarUrl: user ? user.avatarUrl : "",
      department: user?.department || "",
      title: user?.title || ""
    };
  });
  return res.json({
    project: {
      ...project,
      enrichedMembers
    }
  });
});
router2.post("/", authenticate, (req, res) => {
  const { name, description, color, tag, initialMemberIds } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name is required" });
  }
  const currentUserId = req.user.id;
  const projectId = `proj_${Date.now()}_${crypto4.randomBytes(3).toString("hex")}`;
  const members = [
    {
      userId: currentUserId,
      role: "lead",
      joinedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  if (Array.isArray(initialMemberIds)) {
    initialMemberIds.forEach((uid) => {
      if (uid !== currentUserId && db.getUserById(uid)) {
        members.push({
          userId: uid,
          role: "member",
          joinedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
  }
  const project = {
    id: projectId,
    name: name.trim(),
    description: description?.trim() || "",
    ownerId: currentUserId,
    color: color || "emerald",
    tag: tag?.trim().toUpperCase() || name.substring(0, 4).toUpperCase(),
    members,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const created = db.createProject(project);
  db.logActivity({
    id: `act_${Date.now()}`,
    projectId,
    userId: currentUserId,
    userName: req.user.name,
    action: "created project",
    targetTitle: project.name,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (Array.isArray(initialMemberIds)) {
    initialMemberIds.forEach((uid) => {
      if (uid !== currentUserId) {
        const notif = {
          id: `notif_${Date.now()}_${crypto4.randomBytes(2).toString("hex")}`,
          userId: uid,
          title: "Project Invitation",
          message: `${req.user.name} added you to project "${project.name}"`,
          type: "project_invite",
          read: false,
          link: `/project/${project.id}`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.createNotification(notif);
      }
    });
  }
  return res.status(201).json({ project: created });
});
router2.put("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const { name, description, color, tag } = req.body;
  const updates = {};
  if (name !== void 0) updates.name = name.trim();
  if (description !== void 0) updates.description = description.trim();
  if (color !== void 0) updates.color = color;
  if (tag !== void 0) updates.tag = tag.trim().toUpperCase();
  const updated = db.updateProject(id, updates);
  db.logActivity({
    id: `act_${Date.now()}`,
    projectId: id,
    userId: req.user.id,
    userName: req.user.name,
    action: "updated project details",
    targetTitle: updated?.name || project.name,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return res.json({ project: updated });
});
router2.delete("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const success = db.deleteProject(id);
  return res.json({ success, message: "Project and associated tasks deleted" });
});
router2.post("/:id/members", authenticate, (req, res) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const { userId, role } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const targetUser = db.getUserById(userId);
  if (!targetUser) {
    return res.status(404).json({ error: "User does not exist" });
  }
  const updated = db.addProjectMember(id, {
    userId,
    role: role || "member"
  });
  db.createNotification({
    id: `notif_${Date.now()}_${crypto4.randomBytes(2).toString("hex")}`,
    userId,
    title: "Added to Project",
    message: `${req.user.name} added you to "${project.name}" as ${role || "member"}`,
    type: "project_invite",
    read: false,
    link: `/project/${project.id}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  db.logActivity({
    id: `act_${Date.now()}`,
    projectId: id,
    userId: req.user.id,
    userName: req.user.name,
    action: `invited ${targetUser.name} to`,
    targetTitle: project.name,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return res.json({ project: updated });
});
router2.delete("/:id/members/:userId", authenticate, (req, res) => {
  const { id, userId } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  if (project.ownerId === userId) {
    return res.status(400).json({ error: "Cannot remove project owner" });
  }
  const updated = db.removeProjectMember(id, userId);
  return res.json({ project: updated });
});
var projectRoutes_default = router2;

// backend/routes/taskRoutes.ts
import { Router as Router3 } from "express";
import crypto5 from "crypto";

// backend/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
var WebSocketManager = class {
  constructor() {
    this.wss = null;
    this.clients = /* @__PURE__ */ new Set();
  }
  init(server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (ws, req) => {
      const client = {
        ws,
        isAlive: true
      };
      this.clients.add(client);
      try {
        const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
        const token = url.searchParams.get("token");
        if (token) {
          const userId = verifyToken(token);
          if (userId) {
            client.userId = userId;
          }
        }
      } catch {
      }
      ws.on("pong", () => {
        client.isAlive = true;
      });
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(client, data);
        } catch (e) {
          console.error("Invalid WS payload:", e);
        }
      });
      ws.on("close", () => {
        const oldProjectId = client.projectId;
        this.clients.delete(client);
        if (oldProjectId) {
          this.broadcastPresence(oldProjectId);
        }
      });
      ws.on("error", (err) => {
        console.error("WS client error:", err);
      });
      ws.send(JSON.stringify({ type: "connected", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
    });
    const interval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 3e4);
    this.wss.on("close", () => {
      clearInterval(interval);
    });
    console.log("\u2713 FlowSprint WebSocket Server initialized on /ws");
  }
  handleClientMessage(client, data) {
    switch (data.type) {
      case "auth": {
        if (data.token) {
          const userId = verifyToken(data.token);
          if (userId) {
            client.userId = userId;
            client.ws.send(JSON.stringify({ type: "auth:success", userId }));
          }
        }
        break;
      }
      case "join:project": {
        const previousProject = client.projectId;
        client.projectId = data.projectId;
        if (previousProject && previousProject !== data.projectId) {
          this.broadcastPresence(previousProject);
        }
        this.broadcastPresence(data.projectId);
        break;
      }
      case "leave:project": {
        const oldProj = client.projectId;
        client.projectId = void 0;
        if (oldProj) {
          this.broadcastPresence(oldProj);
        }
        break;
      }
    }
  }
  broadcastPresence(projectId) {
    const activeUserIds = /* @__PURE__ */ new Set();
    this.clients.forEach((c) => {
      if (c.projectId === projectId && c.userId) {
        activeUserIds.add(c.userId);
      }
    });
    const activeUsers = Array.from(activeUserIds).map((uid) => db.getUserById(uid)).filter(Boolean).map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      title: u.title
    }));
    this.broadcastToProject(projectId, "presence:update", {
      projectId,
      users: activeUsers
    });
  }
  broadcastToProject(projectId, event, payload) {
    const msg = JSON.stringify({ type: event, data: payload, projectId });
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.projectId === projectId) {
        client.ws.send(msg);
      }
    });
  }
  broadcastToUser(userId, event, payload) {
    const msg = JSON.stringify({ type: event, data: payload, userId });
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.userId === userId) {
        client.ws.send(msg);
      }
    });
  }
  broadcastGlobal(event, payload) {
    const msg = JSON.stringify({ type: event, data: payload });
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    });
  }
};
var wsManager = new WebSocketManager();

// backend/routes/taskRoutes.ts
var router3 = Router3();
router3.get("/", authenticate, (req, res) => {
  const { projectId, assignedToMe } = req.query;
  const currentUserId = req.user.id;
  let tasks = [];
  if (projectId) {
    tasks = db.getTasksByProject(projectId);
  } else if (assignedToMe === "true") {
    tasks = db.getTasksForUser(currentUserId);
  } else {
    const userProjects = db.getProjectsForUser(currentUserId).map((p) => p.id);
    tasks = db.getTasks().filter((t) => userProjects.includes(t.projectId));
  }
  const enrichedTasks = tasks.map((t) => {
    const assignee = t.assigneeId ? db.getUserById(t.assigneeId) : null;
    const project = db.getProjectById(t.projectId);
    const commentsCount = db.getComments(t.id).length;
    return {
      ...t,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        avatarUrl: assignee.avatarUrl,
        department: assignee.department
      } : null,
      projectName: project?.name || "Unknown Project",
      projectColor: project?.color || "emerald",
      commentsCount
    };
  });
  return res.json({ tasks: enrichedTasks });
});
router3.get("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const assignee = task.assigneeId ? db.getUserById(task.assigneeId) : null;
  const creator = db.getUserById(task.creatorId);
  const project = db.getProjectById(task.projectId);
  const comments = db.getComments(task.id);
  return res.json({
    task: {
      ...task,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        avatarUrl: assignee.avatarUrl
      } : null,
      creator: creator ? {
        id: creator.id,
        name: creator.name,
        avatarUrl: creator.avatarUrl
      } : null,
      projectName: project?.name || "",
      comments
    }
  });
});
router3.post("/", authenticate, (req, res) => {
  const { projectId, title, description, status, priority, assigneeId, dueDate, tags } = req.body;
  if (!projectId || !title || !title.trim()) {
    return res.status(400).json({ error: "Project ID and task title are required" });
  }
  const project = db.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const taskId = `task_${Date.now()}_${crypto5.randomBytes(3).toString("hex")}`;
  const currentUserId = req.user.id;
  const newTask = {
    id: taskId,
    projectId,
    title: title.trim(),
    description: description?.trim() || "",
    status: status || "todo",
    priority: priority || "medium",
    assigneeId: assigneeId || null,
    creatorId: currentUserId,
    dueDate: dueDate || null,
    order: 0,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const created = db.createTask(newTask);
  if (assigneeId && assigneeId !== currentUserId) {
    const notif = {
      id: `notif_${Date.now()}_${crypto5.randomBytes(2).toString("hex")}`,
      userId: assigneeId,
      title: "New Task Assigned",
      message: `${req.user.name} assigned you "${newTask.title}" in ${project.name}`,
      type: "task_assigned",
      read: false,
      link: `/project/${projectId}?task=${taskId}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.createNotification(notif);
    wsManager.broadcastToUser(assigneeId, "notification:new", notif);
  }
  db.logActivity({
    id: `act_${Date.now()}`,
    projectId,
    userId: currentUserId,
    userName: req.user.name,
    action: "created task",
    targetTitle: newTask.title,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const assignee = created.assigneeId ? db.getUserById(created.assigneeId) : null;
  const enrichedTask = {
    ...created,
    assignee: assignee ? {
      id: assignee.id,
      name: assignee.name,
      email: assignee.email,
      avatarUrl: assignee.avatarUrl
    } : null,
    projectName: project.name,
    commentsCount: 0
  };
  wsManager.broadcastToProject(projectId, "task:created", { task: enrichedTask });
  wsManager.broadcastGlobal("dashboard:refresh", {});
  return res.status(201).json({ task: created });
});
router3.put("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const { title, description, status, priority, assigneeId, dueDate, tags } = req.body;
  const updates = {};
  if (title !== void 0) updates.title = title.trim();
  if (description !== void 0) updates.description = description.trim();
  if (status !== void 0) updates.status = status;
  if (priority !== void 0) updates.priority = priority;
  if (assigneeId !== void 0) updates.assigneeId = assigneeId || null;
  if (dueDate !== void 0) updates.dueDate = dueDate || null;
  if (tags !== void 0) updates.tags = tags;
  const previousAssignee = task.assigneeId;
  const previousStatus = task.status;
  const updated = db.updateTask(id, updates);
  if (!updated) {
    return res.status(500).json({ error: "Failed to update task" });
  }
  const currentUserId = req.user.id;
  const project = db.getProjectById(task.projectId);
  if (updates.assigneeId && updates.assigneeId !== previousAssignee && updates.assigneeId !== currentUserId) {
    const notif = {
      id: `notif_${Date.now()}_${crypto5.randomBytes(2).toString("hex")}`,
      userId: updates.assigneeId,
      title: "Task Assigned",
      message: `${req.user.name} assigned you "${updated.title}" in ${project?.name || "Project"}`,
      type: "task_assigned",
      read: false,
      link: `/project/${task.projectId}?task=${task.id}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.createNotification(notif);
    wsManager.broadcastToUser(updates.assigneeId, "notification:new", notif);
  }
  if (updates.status && updates.status !== previousStatus) {
    const notifyUser = task.creatorId !== currentUserId ? task.creatorId : task.assigneeId !== currentUserId ? task.assigneeId : null;
    if (notifyUser) {
      const notif = {
        id: `notif_${Date.now()}_${crypto5.randomBytes(2).toString("hex")}`,
        userId: notifyUser,
        title: "Task Status Updated",
        message: `${req.user.name} updated "${updated.title}" to ${updates.status.replace("_", " ")}`,
        type: "status_changed",
        read: false,
        link: `/project/${task.projectId}?task=${task.id}`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.createNotification(notif);
      wsManager.broadcastToUser(notifyUser, "notification:new", notif);
    }
    db.logActivity({
      id: `act_${Date.now()}`,
      projectId: task.projectId,
      userId: currentUserId,
      userName: req.user.name,
      action: `moved to ${updates.status.replace("_", " ")}`,
      targetTitle: updated.title,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  const assignee = updated.assigneeId ? db.getUserById(updated.assigneeId) : null;
  const enrichedTask = {
    ...updated,
    assignee: assignee ? {
      id: assignee.id,
      name: assignee.name,
      email: assignee.email,
      avatarUrl: assignee.avatarUrl
    } : null,
    projectName: project?.name || "",
    commentsCount: db.getComments(updated.id).length
  };
  wsManager.broadcastToProject(task.projectId, "task:updated", { task: enrichedTask });
  wsManager.broadcastGlobal("dashboard:refresh", {});
  return res.json({ task: updated });
});
router3.post("/:id/move", authenticate, (req, res) => {
  const { id } = req.params;
  const { targetStatus, newIndex } = req.body;
  if (!targetStatus || typeof newIndex !== "number") {
    return res.status(400).json({ error: "targetStatus and numeric newIndex are required" });
  }
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const oldStatus = task.status;
  const reordered = db.reorderTask(id, targetStatus, newIndex);
  if (oldStatus !== targetStatus) {
    db.logActivity({
      id: `act_${Date.now()}`,
      projectId: task.projectId,
      userId: req.user.id,
      userName: req.user.name,
      action: `moved to ${targetStatus.replace("_", " ")}`,
      targetTitle: task.title,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  wsManager.broadcastToProject(task.projectId, "task:moved", {
    taskId: id,
    targetStatus,
    newIndex,
    task: reordered,
    senderId: req.user.id
  });
  wsManager.broadcastGlobal("dashboard:refresh", {});
  return res.json({ task: reordered });
});
router3.delete("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const projectId = task.projectId;
  const success = db.deleteTask(id);
  db.logActivity({
    id: `act_${Date.now()}`,
    projectId,
    userId: req.user.id,
    userName: req.user.name,
    action: "deleted task",
    targetTitle: task.title,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  wsManager.broadcastToProject(projectId, "task:deleted", { taskId: id });
  wsManager.broadcastGlobal("dashboard:refresh", {});
  return res.json({ success, message: "Task deleted successfully" });
});
var taskRoutes_default = router3;

// backend/routes/commentRoutes.ts
import { Router as Router4 } from "express";
import crypto6 from "crypto";
var router4 = Router4();
router4.get("/", authenticate, (req, res) => {
  const { taskId } = req.query;
  if (!taskId) {
    return res.status(400).json({ error: "taskId is required" });
  }
  const comments = db.getComments(taskId);
  return res.json({ comments });
});
router4.post("/", authenticate, (req, res) => {
  const { taskId, content } = req.body;
  if (!taskId || !content || !content.trim()) {
    return res.status(400).json({ error: "taskId and comment content are required" });
  }
  const task = db.getTaskById(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const currentUser = req.user;
  const commentId = `comm_${Date.now()}_${crypto6.randomBytes(3).toString("hex")}`;
  const comment = {
    id: commentId,
    taskId,
    projectId: task.projectId,
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatarUrl,
    content: content.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const created = db.createComment(comment);
  wsManager.broadcastToProject(task.projectId, "comment:added", {
    taskId,
    comment: created
  });
  const recipients = /* @__PURE__ */ new Set();
  if (task.assigneeId && task.assigneeId !== currentUser.id) {
    recipients.add(task.assigneeId);
  }
  if (task.creatorId && task.creatorId !== currentUser.id) {
    recipients.add(task.creatorId);
  }
  recipients.forEach((userId) => {
    const notif = {
      id: `notif_${Date.now()}_${crypto6.randomBytes(2).toString("hex")}`,
      userId,
      title: "New Comment",
      message: `${currentUser.name} commented on "${task.title}": "${content.slice(0, 50)}${content.length > 50 ? "..." : ""}"`,
      type: "comment_added",
      read: false,
      link: `/project/${task.projectId}?task=${task.id}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.createNotification(notif);
    wsManager.broadcastToUser(userId, "notification:new", notif);
  });
  return res.status(201).json({ comment: created });
});
router4.delete("/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const comment = db.getCommentById(id);
  const projectId = comment?.projectId;
  const taskId = comment?.taskId;
  const success = db.deleteComment(id);
  if (projectId && taskId) {
    wsManager.broadcastToProject(projectId, "comment:deleted", { commentId: id, taskId });
  }
  return res.json({ success });
});
var commentRoutes_default = router4;

// backend/routes/notificationRoutes.ts
import { Router as Router5 } from "express";
import crypto7 from "crypto";
var router5 = Router5();
router5.get("/", authenticate, (req, res) => {
  const notifications = db.getNotifications(req.user.id);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return res.json({ notifications, unreadCount });
});
router5.put("/:id/read", authenticate, (req, res) => {
  const { id } = req.params;
  const success = db.markNotificationAsRead(id);
  return res.json({ success });
});
router5.post("/read-all", authenticate, (req, res) => {
  const updatedCount = db.markAllNotificationsAsRead(req.user.id);
  return res.json({ updatedCount });
});
router5.post("/test", authenticate, (req, res) => {
  const notif = {
    id: `notif_${Date.now()}_${crypto7.randomBytes(2).toString("hex")}`,
    userId: req.user.id,
    title: "\u{1F514} Test Real-Time Alert",
    message: `FlowSprint WebSocket notification pushed to your device at ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}!`,
    type: "comment_added",
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const created = db.createNotification(notif);
  wsManager.broadcastToUser(req.user.id, "notification:new", created);
  return res.status(201).json({ notification: created });
});
var notificationRoutes_default = router5;

// backend/routes/dashboardRoutes.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/", authenticate, (req, res) => {
  const currentUserId = req.user.id;
  const userProjects = db.getProjectsForUser(currentUserId);
  const projectIds = userProjects.map((p) => p.id);
  const allTasks = db.getTasks().filter((t) => projectIds.includes(t.projectId));
  const myTasks = allTasks.filter((t) => t.assigneeId === currentUserId);
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const completedTasks = allTasks.filter((t) => t.status === "completed");
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress");
  const reviewTasks = allTasks.filter((t) => t.status === "review");
  const todoTasks = allTasks.filter((t) => t.status === "todo");
  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== "completed"
  );
  const completionRate = allTasks.length > 0 ? Math.round(completedTasks.length / allTasks.length * 100) : 0;
  const upcomingDeadlines = allTasks.filter((t) => t.dueDate && t.status !== "completed").sort((a, b) => a.dueDate > b.dueDate ? 1 : -1).slice(0, 6).map((t) => {
    const project = db.getProjectById(t.projectId);
    const assignee = t.assigneeId ? db.getUserById(t.assigneeId) : null;
    return {
      ...t,
      projectName: project?.name || "Project",
      projectColor: project?.color || "emerald",
      assigneeName: assignee?.name || "Unassigned",
      assigneeAvatar: assignee?.avatarUrl || null
    };
  });
  const projectsSummary = userProjects.map((p) => {
    const pTasks = allTasks.filter((t) => t.projectId === p.id);
    const pCompleted = pTasks.filter((t) => t.status === "completed").length;
    const progress = pTasks.length > 0 ? Math.round(pCompleted / pTasks.length * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color,
      tag: p.tag,
      totalTasks: pTasks.length,
      completedTasks: pCompleted,
      progress,
      membersCount: p.members.length,
      updatedAt: p.updatedAt
    };
  });
  const recentActivities = db.getActivities().filter((a) => projectIds.includes(a.projectId)).slice(0, 12);
  return res.json({
    metrics: {
      totalProjects: userProjects.length,
      totalTasks: allTasks.length,
      myTasksCount: myTasks.length,
      completedTasksCount: completedTasks.length,
      inProgressTasksCount: inProgressTasks.length,
      reviewTasksCount: reviewTasks.length,
      todoTasksCount: todoTasks.length,
      pendingTasksCount: allTasks.length - completedTasks.length,
      overdueTasksCount: overdueTasks.length,
      completionRate
    },
    priorityDistribution: {
      urgent: allTasks.filter((t) => t.priority === "urgent").length,
      high: allTasks.filter((t) => t.priority === "high").length,
      medium: allTasks.filter((t) => t.priority === "medium").length,
      low: allTasks.filter((t) => t.priority === "low").length
    },
    statusDistribution: {
      todo: todoTasks.length,
      in_progress: inProgressTasks.length,
      review: reviewTasks.length,
      completed: completedTasks.length
    },
    upcomingDeadlines,
    projectsSummary,
    recentActivities
  });
});
router6.post("/reset-demo", authenticate, (_req, res) => {
  db.resetToSeed();
  return res.json({ success: true, message: "College demo dataset restored successfully" });
});
router6.get("/db-status", (_req, res) => {
  const info = db.getDatabaseInfo();
  return res.json(info);
});
var dashboardRoutes_default = router6;

// backend/app.ts
function createExpressApp() {
  const app = express();
  app.use(express.json());
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "FlowSprint Project Management API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("/api/auth", authRoutes_default);
  app.use("/api/projects", projectRoutes_default);
  app.use("/api/tasks", taskRoutes_default);
  app.use("/api/comments", commentRoutes_default);
  app.use("/api/notifications", notificationRoutes_default);
  app.use("/api/dashboard", dashboardRoutes_default);
  app.use("/api/system", dashboardRoutes_default);
  app.use("/api", (err, _req, res, _next) => {
    console.error("Unhandled API error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  });
  return app;
}

// backend/server.ts
dotenv.config();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
async function startServer() {
  const app = createExpressApp();
  const httpServer = http.createServer(app);
  const isProduction = process.env.NODE_ENV === "production";
  wsManager.init(httpServer);
  try {
    const mongoConnected = await connectMongoDB();
    if (mongoConnected) {
      await db.initMongoSync();
    }
  } catch (err) {
    console.error("MongoDB initial connection attempt error:", err);
  }
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true"
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(process.cwd(), "dist");
    if (fs2.existsSync(distPath)) {
      app.use(express2.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path2.join(distPath, "index.html"));
      });
    }
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`\u2713 FlowSprint Full-Stack Server & WebSockets active on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
