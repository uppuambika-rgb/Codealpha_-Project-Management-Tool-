# FlowSprint 🚀
### Full-Stack Real-Time Project Management Platform (Trello / Asana Alternative)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**FlowSprint** is a full-stack, collaborative project management tool inspired by Trello and Asana. Designed with an agile Kanban board, real-time WebSocket synchronization, role-based access control, threaded task discussions, live notification badges, and dual database support (MongoDB Atlas + persistent local JSON).

---

## 🌟 Key Features

- **🔐 Robust Authentication & Role Management:**
  - Secure password hashing with **PBKDF2** (salt + 1000 iterations) and **HMAC SHA-256** session tokens.
  - Dedicated **Sign In** (for existing members) and **Create Account** (for new users) authentication portal.
  - One-click **Demo Personas** (*Team Lead*, *Frontend Lead*, *Backend Architect*, *QA Specialist*) for fast evaluation during project presentations and grading.
  - Fast **Persona Switcher** in the navbar to test multi-user roles without logging out.

- **📁 Group Projects & Team Workspaces:**
  - Create projects with custom tags (e.g. `CAMPUS-01`), color themes, and descriptions.
  - Invite team members with role tiers: **Lead**, **Member**, and **Viewer**.
  - Visual member avatar stack in the project header.

- **📋 Interactive Agile Kanban Boards:**
  - 4-column agile flow: **To Do**, **In Progress**, **In Review**, and **Completed**.
  - Smooth **HTML5 Drag-and-Drop** with optimistic UI updates and instant server synchronization.
  - Mobile-friendly **Quick Move** menu for touch screens.
  - Real-time search by task title, description, or tags, plus multi-criteria filters by priority or assignee.

- **👥 Task Assignment & Deadlines:**
  - Assign tasks to any project member with instant notification to the assignee.
  - Urgency indicators: **Urgent**, **High**, **Medium**, and **Low**.
  - Calendar deadline picker with automated **Overdue** and **Due Today** visual warnings.

- **💬 Threaded Task Comments:**
  - In-card discussions with author avatars, names, relative timestamps, and deletion controls.
  - Auto-notifies task creators and assignees when a teammate posts an update.

- **⚡ Real-Time WebSockets & Live Presence:**
  - Built-in WebSocket server attached to the HTTP server on `/ws`.
  - Live broadcast of card moves, new tasks, task updates, deletions, and new comments across active browser sessions.
  - **"Active Online"** presence indicator displaying collaborators viewing the board in real time.
  - Real-time pop-up toast alerts when a notification or assignment arrives.

- **🍃 Dual Database Architecture (MongoDB + Local Persistent Fallback):**
  - **MongoDB Atlas Support:** Simply set `MONGODB_URI` in `.env` to connect to your MongoDB database. Auto-seeds initial collections if empty.
  - **Zero-Setup Local Persistence:** If `MONGODB_URI` is not provided, FlowSprint automatically falls back to atomic persistent JSON storage (`backend/data/db.json`), requiring zero external database configuration.

- **📊 Sprint Dashboard & Analytics:**
  - Real-time KPI summary: Total Projects, Open Tasks, Completion Rate %, Assigned to Me, and Overdue Tasks.
  - 7-day upcoming deadline schedule.
  - Live chronological audit activity stream tracking all team member contributions.

---

## 📂 Project Architecture

All source code is strictly segregated into `frontend/` and `backend/` folders:

```
├── backend/
│   ├── app.ts                  # Express application factory with /api router bindings
│   ├── auth.ts                 # PBKDF2 hashing, cryptographic salts & HMAC tokens
│   ├── db.ts                   # Database engine & bidirectional sync (MongoDB & file)
│   ├── mongodb.ts              # Mongoose schemas & MongoDB connection handler
│   ├── server.ts               # HTTP Server, WebSockets initialization, Vite middleware
│   ├── types.ts                # Backend data models & schemas
│   ├── data/
│   │   └── db.json             # Local persistent JSON database file
│   └── routes/
│       ├── authRoutes.ts       # Registration, login, logout, current user, demo personas
│       ├── projectRoutes.ts    # Project CRUD, team invitations, member management
│       ├── taskRoutes.ts       # Task CRUD, drag-and-drop movement, priority & assignments
│       ├── commentRoutes.ts    # Task discussion threads & comment deletion
│       ├── notificationRoutes.ts# Notification center, read/unread states, test ping
│       └── dashboardRoutes.ts  # Sprint analytics, DB status, and demo reset
│
├── frontend/
│   └── src/
│       ├── App.tsx             # Main client orchestrator, views, and modal coordinators
│       ├── main.tsx            # React 19 root entry point
│       ├── index.css           # Tailwind CSS styles & custom scrollbars
│       ├── types.ts            # Frontend TypeScript models & interfaces
│       ├── services/
│       │   └── api.ts          # HTTP client for all backend REST endpoints
│       ├── context/
│       │   ├── AuthContext.tsx # User session state, registration, login, logout
│       │   └── WebSocketContext.tsx # Real-time WebSocket connection, presence & subscriptions
│       └── components/
│           ├── auth/
│           │   └── LoginPage.tsx # Sign In / Create Account portal with feature showcase
│           ├── layout/
│           │   ├── Navbar.tsx   # Breadcrumbs, Live Sync pill, Notifications bell, Persona pill
│           │   └── Sidebar.tsx  # Navigation links, project list, DB status badge
│           ├── dashboard/
│           │   └── DashboardView.tsx # Analytics cards, deadlines, and live activity stream
│           ├── kanban/
│           │   ├── KanbanBoard.tsx     # 4-column drag-and-drop agile board
│           │   ├── TaskCard.tsx        # Card with priority, tags, comments count & quick move
│           │   ├── TaskDetailModal.tsx # Full modal for task editing & comments thread
│           │   └── NewTaskModal.tsx    # Modal to add tasks
│           ├── projects/
│           │   ├── NewProjectModal.tsx     # Project creation modal with themes & tags
│           │   └── ProjectMembersModal.tsx # Team member invitation & role assignment
│           ├── mytasks/
│           │   └── MyTasksView.tsx    # Personal task manager for current logged-in user
│           └── onboarding/
│               └── CollegeDemoTutorialModal.tsx # Visual interactive college presentation guide
│
├── .env.example                # Example environment variables
├── package.json                # Dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

---

## 🛠️ Tech Stack

### Frontend:
- **Framework:** React 19 (Hooks, Context API)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (White & Emerald Green palette)
- **Icons:** Lucide React
- **Build Tool:** Vite

### Backend:
- **Runtime:** Node.js
- **Server Framework:** Express.js
- **Real-Time Protocol:** WebSockets (`ws`)
- **Database Engine:** Mongoose (MongoDB) + Atomic JSON Engine
- **Authentication:** Native Node.js `crypto` (PBKDF2 SHA-512 + HMAC SHA-256)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- *(Optional)* [MongoDB Atlas](https://www.mongodb.com/atlas) account or local MongoDB instance

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/flowsprint.git
cd flowsprint
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to create your `.env` file:
```bash
cp .env.example .env
```

Open `.env` in your text editor:
```env
# Optional: Paste your MongoDB Atlas or local MongoDB connection URI
# If left empty, FlowSprint runs seamlessly using the persistent local database (backend/data/db.json)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/flowsprint?retryWrites=true&w=majority"

# Optional: Custom port (defaults to 3000)
PORT=3000
```

### 5. Run the Application in Development Mode
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 👥 Pre-Configured Demo Accounts (For Viva / Presentations)

For immediate demonstration without typing credentials, FlowSprint includes 4 pre-seeded college team personas (all share the password: `password123`):

| Persona Name | Email | Role / Department | Responsibility |
| :--- | :--- | :--- | :--- |
| **Alex Rivers** | `alex@campus.edu` | Team Lead & Full-Stack (CS) | Project management, task distribution |
| **Maya Chen** | `maya@campus.edu` | UI/UX & Frontend Lead (HCI) | Frontend components, layouts, design |
| **Liam Vance** | `liam@campus.edu` | Backend & Cloud Architect (SE) | APIs, database schemas, WebSocket hub |
| **Sophia Patel** | `sophia@campus.edu` | QA & Product Specialist (IS) | Reviewing tasks, bug testing, releases |

> **Tip:** You can also click the **Persona** button in the top navbar anytime to instantly switch accounts and demonstrate real-time notifications and assignments between teammates.

---

## 📡 REST API Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Sign in with email and password |
| `GET` | `/api/auth/me` | Fetch currently authenticated user |
| `POST` | `/api/auth/logout` | Clear user session |
| `GET` | `/api/auth/users` | List registered team members |
| `POST` | `/api/auth/demo-switch` | Fast-switch to a demo persona |

### Projects (`/api/projects`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | List all accessible projects |
| `GET` | `/api/projects/:id` | Get project details and enriched members |
| `POST` | `/api/projects` | Create a new project workspace |
| `PUT` | `/api/projects/:id` | Update project metadata |
| `DELETE`| `/api/projects/:id` | Delete project and cascade tasks |
| `POST` | `/api/projects/:id/members` | Invite a collaborator with role |
| `DELETE`| `/api/projects/:id/members/:userId` | Remove a member from the project |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | List tasks (query by `projectId` or `assignedToMe`) |
| `GET` | `/api/tasks/:id` | Get full task details with comments |
| `POST` | `/api/tasks` | Create a task in a project column |
| `PUT` | `/api/tasks/:id` | Update task fields (priority, assignee, deadline, status) |
| `POST` | `/api/tasks/:id/move` | Drag-and-drop reorder across columns |
| `DELETE`| `/api/tasks/:id` | Delete task card |

### Comments (`/api/comments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/comments?taskId=:id` | Fetch discussion thread for a task |
| `POST` | `/api/comments` | Post a comment on a task |
| `DELETE`| `/api/comments/:id` | Delete a comment |

### Notifications & System (`/api/notifications`, `/api/system`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get user notifications and unread count |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `POST` | `/api/notifications/read-all` | Mark all notifications as read |
| `POST` | `/api/notifications/test` | Trigger simulated notification alert |
| `GET` | `/api/system/db-status` | Inspect live database connection (MongoDB vs Local JSON) |
| `POST` | `/api/system/reset-demo` | Restore clean demonstration dataset |

---

## ⚡ WebSocket Events (`/ws`)

FlowSprint attaches a real WebSocket server to the Node HTTP instance on port 3000:

| Event Type | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join:project` | Client → Server | `{ projectId }` | Join a collaborative project room |
| `leave:project` | Client → Server | `{}` | Leave project room |
| `presence:update`| Server → Client | `{ users: [...] }` | Broadcast active collaborators currently in the room |
| `task:created` | Server → Client | `{ task }` | New task added to Kanban board |
| `task:moved` | Server → Client | `{ taskId, targetStatus, newIndex }` | Task card dragged across columns |
| `task:updated` | Server → Client | `{ task }` | Task title, priority, assignee, or deadline updated |
| `task:deleted` | Server → Client | `{ taskId }` | Task card deleted |
| `comment:added` | Server → Client | `{ taskId, comment }` | New comment posted in task discussion |
| `notification:new`| Server → Client | `{ ...notification }` | Real-time push notification toast |

---

## 🚀 Deploying to Render

You can easily deploy FlowSprint as a **Web Service** on Render:

1. **Create a New Web Service:**
   - Connect your GitHub repository on [Render Dashboard](https://dashboard.render.com/).
   - Select **Web Service**.

2. **Configure Service Settings:**
   | Field | Value |
   | :--- | :--- |
   | **Runtime** | `Node` |
   | **Root Directory** | *(Leave blank or enter `.`) |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `node server.js` *(or `npm start`)* |

3. **Environment Variables (Optional):**
   - In the **Environment Variables** tab, you can add:
     - `MONGODB_URI`: Your MongoDB Atlas connection string.
     - `NODE_ENV`: `production`

4. Click **Deploy Web Service**! Render will automatically install dependencies, build the frontend with Vite, and launch the Express + WebSockets full-stack server.

---

## 📦 Production Build & Run Locally

To build the optimized production assets:
```bash
npm run build
```

To run the production full-stack server:
```bash
npm start
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
