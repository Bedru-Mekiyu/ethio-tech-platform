<p align="center">
  <img src="frontend/src/assets/hero.png" alt="EthioTech Platform" width="100%" />
</p>

<h1 align="center">EthioTech Platform</h1>

<p align="center">
  <strong>Empowering the next generation of Ethiopian technology leaders through immersive, gamified education and world-class mentorship.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API</a> •
  <a href="#socket-events">Socket Events</a> •
  <a href="#rbac">RBAC</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19+-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8+-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-047edb?logo=mongodb" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io" alt="Socket.io" />
</p>

---

## Why EthioTech Exists

**Ethiopia stands at a pivotal moment in its technological evolution.** With over 70% of its population under 30, the country possesses an extraordinary demographic dividend — yet this potential remains largely untapped.

**The reality facing Ethiopian youth today:**

- **Education Gap**: Universities teach theory, but graduates lack practical, job-ready skills
- **Mentorship Void**: No access to experienced engineers who can guide career paths
- **Geographic Isolation**: Talent outside Addis Ababa lacks connection to the tech ecosystem
- **Brain Drain**: The brightest minds leave for opportunities abroad
- **Gender Disparity**: Women face additional barriers entering tech fields
- **Economic Barriers**: Quality tech education is inaccessible to most families

**This isn't just an education problem — it's a national development crisis.**

EthioTech Platform exists to democratize access, bridge the mentorship gap, build local capacity, and prove that with the right support, Ethiopian talent can compete on the global stage.

---

## Platform Overview

| Aspect | Details |
|--------|---------|
| **Mission** | Empower Ethiopian technology leaders through immersive, gamified education and world-class mentorship |
| **Vision** | Become Africa's leading technology education platform |
| **Target Users** | Students (Grade 8+), Mentors, Educators, Schools, Employers |
| **Philosophy** | Learn by building, community-driven, mentorship-first, gamification, accessibility, local context |

---

## Features

### Student Experience

| Feature | Status | Description |
|---------|--------|-------------|
| Learning Tracks | Complete | Structured curriculum: Web Dev, Mobile, Data Science, DevOps, UI/UX |
| XP & Levels | Complete | 25-200 XP per lesson, 50 levels (Novice → Expert) |
| Achievements | Complete | Badges, streaks, daily challenges, leaderboards |
| Dashboards | Complete | Personalized dashboard with progress, challenges, upcoming sessions |
| Live Sessions | Complete | Join scheduled sessions with video, chat, Q&A, polls |
| Assignments | Complete | Homework, quizzes, projects, peer reviews with due dates and rubrics |
| Calendar | Complete | Monthly view, event dots, ICS export, session sync |
| Session Explorer | Complete | Search, filter (all/upcoming/live/completed), session cards |
| Progress Analytics | Complete | Track progress, attendance rate, engagement scores |
| Direct Messages | Complete | Real-time DMs with conversations, read receipts |
| Notifications | Complete | Real-time push notifications with badge count |
| Certificates | Complete | Track completion certificates |
| Squads | Complete | Peer groups of 4-8 students with shared goals |
| Code Workspace | Complete | Built-in coding environment |
| Student Notes | Complete | Personal notes per session |

### Mentor Experience

| Feature | Status | Description |
|---------|--------|-------------|
| Mentor Dashboard | Complete | Session queue, student submissions, performance metrics |
| Session Management | Complete | Create, schedule, start, end sessions |
| Control Center | Complete | 13-panel real-time control: chat, polls, Q&A, hand raises, engagement, notes, resources, recordings, participants, waiting room |
| Student Management | Complete | View students, track progress, give feedback |
| Analytics | Complete | Cohort analytics, student progress, CSV export |
| Availability | Complete | Set available time slots for booking |
| Project Reviews | Complete | Review submissions with rubric scoring |
| Scoring | Complete | Mentor score (0-1000) based on performance |
| Application System | Complete | Apply, credential verification, admin approval workflow |

### Administrator Experience

| Feature | Status | Description |
|---------|--------|-------------|
| Analytics Dashboard | Complete | User growth, engagement, platform health |
| User Management | Complete | View, suspend, ban, restore users |
| Content Management | Complete | Create tracks, modules, lessons |
| Moderation | Complete | Content moderation, report handling, chat moderation |
| Mentor Approval | Complete | Review applications, verify credentials, approve/reject |
| Gamification Config | Complete | Manage badges, levels, daily challenges |
| Audit Logging | Complete | Admin activity logs, session audit logs |
| RBAC | Complete | 7 roles, 30+ granular permissions |

### Realtime Systems

| Feature | Status | Description |
|---------|--------|-------------|
| Live Chat | Complete | Socket.io-powered, track rooms, squads, DMs |
| Video/Audio | Complete | Agora RTC SDK integration, screen sharing |
| Collaborative Whiteboard | Complete | Konva-based: pen, line, rect, circle, text, eraser, undo, history |
| Breakout Rooms | Complete | Create rooms, bulk assign students, timers |
| Hand Raises | Complete | Queue management, called-on flow |
| Live Polls | Complete | Single/multiple/true-false, real-time voting |
| Q&A System | Complete | Submit, upvote, pin, answer, archive |
| Presence Tracking | Complete | Heartbeat-based attendance verification |
| Notifications | Complete | Real-time notification delivery via Socket.io |
| Engagement Scoring | Complete | Composite score from questions, polls, chat, attendance |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                               │
│  React 19 • TypeScript 5.8 • Vite 8 • Tailwind CSS 4            │
│  Zustand • TanStack Query • Socket.io • Framer Motion            │
│  Agora RTC SDK • React Three Fiber • Konva                       │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS / WebSocket
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       API Gateway                                 │
│  Express 4 • JWT Auth • Rate Limiting • Zod Validation           │
│  Helmet • CORS • Compression • Request Logging                    │
└──────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Socket.io      │ │   REST API       │ │   MongoDB        │
│   Server         │ │   Controllers    │ │   Atlas          │
│   (1182 lines)   │ │   (46 files)     │ │   (49 models)    │
│   25+ events     │ │   (45 routes)    │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    External Services                              │
│  Agora (Video) • Cloudinary (Images) • Render (Deployment)       │
└──────────────────────────────────────────────────────────────────┘
```

### Frontend Structure

```
frontend/src/
├── App.tsx                    # Root router (348 lines, 60+ routes)
├── pages/
│   ├── marketing/             # 12 public pages (Home, About, FAQ, etc.)
│   ├── auth/                  # Login, Register, Forgot/Reset Password
│   ├── app/                   # 22 student pages (Dashboard, Tracks, Lessons, etc.)
│   ├── mentor/                # 7 mentor pages + 13 control center panels
│   ├── admin/                 # 6 admin pages
│   └── parent/                # Parent dashboard
├── features/
│   ├── classroom/             # ClassroomPage, VideoGrid, Whiteboard, Breakout
│   └── messages/              # MessagesPage (DMs)
├── components/
│   ├── ui/                    # 26 design system primitives
│   ├── composites/            # ErrorBoundary, EmptyState, Toast, etc.
│   ├── classroom/             # VideoTile, VideoControls, ScreenShareView
│   └── brand/                 # Logo
├── services/                  # 22 API service files (flat)
├── hooks/                     # 9 custom hooks
├── store/                     # authStore, notificationStore, avatarRegistry
├── layouts/                   # MarketingLayout, AuthLayout, DashboardLayout, ClassroomLayout
├── routes/                    # ProtectedRoute, GuestRoute, MentorToolsRoute
├── lib/                       # realtime.ts, monitoring.ts, utils.ts, image.ts
├── config/                    # runtime.ts, avatarLibrary.ts, mediaConfig.ts
└── styles/                    # tokens.css (design system)
```

### Backend Structure

```
backend/src/
├── app.ts                     # Express app factory (middleware stack)
├── server.ts                  # HTTP + Socket.io server entry
├── config/
│   ├── env.js                 # Env validation (JWT, Mongo, CORS, Agora)
│   ├── db.js                  # Mongoose connection + MemoryServer fallback
│   ├── permissions.js         # RBAC: 7 roles, 30+ permissions
│   └── agora.js               # Agora video config
├── models/                    # 49 Mongoose models
├── controllers/               # 46 route handlers
├── services/                  # 34 business logic modules
├── routes/                    # 45 route files + index aggregator
├── middlewares/                # 8 middleware (auth, session, error, validation, etc.)
├── socket/
│   ├── index.ts               # Socket.io engine (1182 lines, 25+ events)
│   ├── contracts.ts           # TypeScript interfaces for all events
│   └── roomAuth.js            # Room-level authorization
├── validators/                # Zod schemas
├── utils/                     # ApiError, apiResponse, asyncHandler, etc.
├── scripts/                   # Seed, factories, datasets, generators
└── tests/                     # 20 test files
```

### Database (49 Collections)

| Domain | Collections |
|--------|------------|
| **Core** | User, Track, Module, Lesson, Project, Submission, Assignment |
| **Sessions** | Session, SessionParticipant, SessionFeedback, SessionRecording, SessionResource, SessionPoll, SessionQuestion, SessionNote, SessionAuditLog |
| **Mentorship** | MentorApplication, MentorAvailability, MentorStudentFeedback |
| **Gamification** | Badge, LevelConfig, XPLog, UserStreak, DailyChallenge, DailyChallengeCompletion, Certificate |
| **Community** | PeerGroup, Hub, HubAttendance, ChatMessage, DMMessage, Conversation |
| **Classroom** | WhiteboardSnapshot, BreakoutRoom, BreakoutAssignment, HandRaise, EngagementScore |
| **Operations** | Notification, ReminderJob, Invitation, WaitlistEntry, ModerationLog, AuditLog, AdminActivityLog |
| **Progress** | StudentProgress, LessonProgress, CalendarEvent |

### Authentication Flow

```
Login → Access Token (1d) + Refresh Token (14d, httpOnly cookie)
  │
  ├─ API Request → Bearer token → JWT verify → req.user
  │
  ├─ Refresh → Verify refresh hash → Token rotation → New pair
  │              └─ Reuse detection → Wipe all tokens → Force re-login
  │
  └─ Socket → handshake.auth.token → JWT verify → socket.data.user
```

---

## Getting Started

### Prerequisites

- **Node.js** 22+ ([download](https://nodejs.org))
- **npm** 10+ (comes with Node.js)
- **MongoDB** — [local](https://www.mongodb.com/docs/manual/installation/) or [Atlas free tier](https://www.mongodb.com/cloud/atlas)
- **Git** ([download](https://git-scm.com))

### Installation

```bash
git clone https://github.com/Bedru-Mekiyu/ethio-tech-platform.git
cd ethio-tech-platform
npm install
```

### Environment Setup

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Edit `.env`:

```env
MONGO_URI=mongodb://localhost:27017/ethiotech
PORT=5000
NODE_ENV=development
JWT_SECRET=dev-secret-at-least-16-chars
JWT_REFRESH_SECRET=dev-refresh-secret-16-chars
LIVE_CLASSROOM_SECRET=dev-classroom-secret-16-chars
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Start MongoDB

```bash
docker compose up -d mongo
```

### Seed Database (Optional)

```bash
npm run seed -w backend
```

Creates: 1 admin, 12 mentors, 45 students, 8 hubs, tracks with modules/lessons, badges, levels, daily challenges, sessions, peer groups, certificates.

**Default credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ethiotech.com | Passw0rd! |
| Mentor | mentor@ethiotech.com | Passw0rd! |
| Student | student@ethiotech.com | Passw0rd! |

### Run Development Servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/v1 |
| Health Check | http://localhost:5000/health |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | Yes* | — | MongoDB connection string |
| `PORT` | No | `5000` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `JWT_SECRET` | Yes | — | JWT signing secret (min 16 chars) |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token secret (min 16 chars) |
| `LIVE_CLASSROOM_SECRET` | Yes | — | Live classroom auth secret (min 16 chars) |
| `JWT_EXPIRES_IN` | No | `1d` | Access token expiry |
| `JWT_REFRESH_DAYS` | No | `14` | Refresh token expiry (days) |
| `CORS_ORIGIN` | Yes** | — | Allowed origins (comma-separated) |
| `LOG_LEVEL` | No | `info` | Winston log level |
| `FEATURE_ATTENDANCE_VERIFICATION` | No | `false` | Enable heartbeat-based attendance |
| `AGORA_APP_ID` | No | — | Agora video app ID |
| `AGORA_APP_CERTIFICATE` | No | — | Agora video certificate |
| `CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | — | Cloudinary API secret |
| `VITE_API_URL` | Yes | — | Backend API URL for frontend |

\* Not required in test mode (uses MongoDB Memory Server)
\** Required in production

---

## Development Commands

### Root (Monorepo)

```bash
npm run dev              # Start backend + frontend concurrently
npm run dev:backend     # Backend only
npm run dev:frontend    # Frontend only
npm run build           # Build both for production
npm run typecheck       # TypeScript type checking (both)
npm run lint            # ESLint (both)
npm run test            # Run all tests
npm run seed            # Seed MongoDB
```

### Backend

```bash
cd backend
npm run dev             # Watch mode with tsx
npm run build           # Compile TypeScript
npm run start           # Run compiled output
npm run seed            # Seed database
npm run test            # Run Vitest
npm run typecheck       # Type checking
```

### Frontend

```bash
cd frontend
npm run dev             # Vite dev server
npm run build           # Production build
npm run preview         # Preview production build
npm run lint            # ESLint
npm run typecheck       # Type checking
```

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new account |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password/:token` | Reset password |

### Learning

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tracks` | List learning tracks |
| GET | `/tracks/:trackId` | Get track details |
| GET | `/tracks/:trackId/modules` | Get modules in track |
| GET | `/modules/:moduleId/lessons` | Get lessons in module |
| GET | `/lessons/:lessonId` | Get lesson content |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sessions` | List sessions |
| POST | `/sessions` | Create session (mentor) |
| GET | `/sessions/:sessionId` | Get session details |
| POST | `/sessions/:sessionId/join` | Join session |
| POST | `/sessions/:sessionId/start` | Start session (host) |
| POST | `/sessions/:sessionId/end` | End session (host) |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assignments` | List assignments |
| GET | `/assignments/:id` | Get assignment details |
| POST | `/assignments/:id/submit` | Submit assignment |

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar/events` | Get calendar events |
| POST | `/calendar/events` | Create calendar event |
| GET | `/calendar/ics` | Export as ICS |

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/xp/me/summary` | Get XP summary |
| GET | `/xp/me/history` | Get XP history |
| GET | `/badges` | List all badges |
| GET | `/streak` | Get daily streak |
| POST | `/streak/ping` | Record daily activity |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics` | Platform analytics |
| GET | `/admin/users` | List users (paginated) |
| POST | `/admin/users` | Create user |
| PATCH | `/admin/users/:id` | Update user |
| PATCH | `/admin/users/:id/role` | Change user role |
| POST | `/admin/users/:id/verify` | Verify user |
| POST | `/admin/users/:id/suspend` | Suspend user |
| POST | `/admin/users/:id/ban` | Ban user |
| DELETE | `/admin/users/:id` | Soft delete user |
| POST | `/admin/users/:id/restore` | Restore deleted user |
| POST | `/admin/bulk` | Bulk actions |

### Mentor

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mentor/analytics` | Mentor analytics |
| GET | `/mentor/students` | List mentor's students |
| GET | `/mentor/sessions` | List mentor's sessions |
| POST | `/mentor/availability` | Set availability |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness check |
| GET | `/notifications/me` | Get notifications |
| POST | `/dm/conversations` | Create DM conversation |
| GET | `/dm/conversations` | List conversations |
| POST | `/dm/:conversationId/messages` | Send DM |

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `roomId: string` | Join a real-time room |
| `leave-room` | `roomId: string` | Leave a room |
| `chat:message` | `{ roomId, messageId, text, at, type?, recipientId? }` | Send chat message |
| `room:heartbeat` | `{ roomId, sentAt, connectionQuality? }` | Send presence heartbeat |
| `hand:raise` | `{ roomId }` | Raise hand |
| `hand:lower` | `{ roomId }` | Lower hand |
| `question:submit` | `{ roomId, questionId, text }` | Submit question |
| `question:upvote` | `{ roomId, questionId }` | Upvote question |
| `poll:vote` | `{ roomId, pollId, optionIndex }` | Vote on poll |
| `participant:control` | `{ roomId, targetUserId, action, reason? }` | Control participant |
| `admission:action` | `{ roomId, targetUserId, action }` | Admit/deny user |
| `admission:admit-all` | `{ roomId }` | Admit all waiting |
| `whiteboard:draw` | `{ roomId, opId, type, points?, color?, width? }` | Draw on whiteboard |
| `dm:send` | `{ conversationId, text }` | Send DM |
| `dm:typing-start` | `{ conversationId }` | Start typing indicator |
| `dm:typing-stop` | `{ conversationId }` | Stop typing indicator |
| `dm:read` | `{ conversationId }` | Mark messages as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `presence:join` | `{ roomId, userId?, socketId, at }` | User joined |
| `presence:leave` | `{ roomId, userId?, socketId, at }` | User left |
| `room:presence` | `{ roomId, count, updatedAt }` | Presence count update |
| `room:state` | `{ roomId, roomType, onlineCount, ... }` | Full room state |
| `room:overview` | `{ roomId, participantCount, ... }` | Session overview |
| `chat:message` | `{ roomId, messageId, text, userId, author, ... }` | New chat message |
| `hand:raised` | `{ roomId, userId, userName, status, ... }` | Hand raised |
| `hand:called-on` | `{ roomId, userId, userName, ... }` | Called on student |
| `question:new` | `{ roomId, questionId, userId, text, ... }` | New question |
| `poll:created` | `{ roomId, pollId, question, options[], ... }` | Poll created |
| `poll:results` | `{ roomId, pollId, options[], totalVotes, ... }` | Poll results |
| `engagement:updated` | `{ roomId, userId, score, details, ... }` | Engagement updated |
| `dm:new` | `{ conversationId, senderId, text, ... }` | New DM received |
| `dm:typing` | `{ conversationId, userId, userName, at }` | Typing indicator |
| `dm:read-receipt` | `{ conversationId, userId, readAt, messageIds }` | Read receipt |
| `notification:new` | `{ userId, type, title, body, link?, at }` | New notification |
| `notification:count` | `{ userId, count }` | Unread count |

---

## RBAC

### Role Hierarchy

```
super_admin (100) → admin (80) → moderator (60) → reviewer (50) → support (40) → mentor (30) → student (10)
```

### Permissions Matrix

| Permission | super_admin | admin | moderator | reviewer | support | mentor | student |
|------------|:-----------:|:-----:|:---------:|:--------:|:-------:|:------:|:-------:|
| `user.create` | ✅ | ✅ | — | — | — | — | — |
| `user.edit` | ✅ | ✅ | ✅ | — | ✅ | — | — |
| `user.delete` | ✅ | ✅ | — | — | — | — | — |
| `user.soft_delete` | ✅ | ✅ | — | — | — | — | — |
| `user.restore` | ✅ | ✅ | — | — | — | — | — |
| `user.suspend` | ✅ | ✅ | ✅ | — | — | — | — |
| `user.ban` | ✅ | ✅ | — | — | — | — | — |
| `user.reactivate` | ✅ | ✅ | ✅ | — | — | — | — |
| `user.verify` | ✅ | ✅ | — | — | — | — | — |
| `user.reset_password` | ✅ | ✅ | — | — | ✅ | — | — |
| `user.force_logout` | ✅ | ✅ | — | — | — | — | — |
| `user.change_role` | ✅ | ✅ | — | — | — | — | — |
| `user.export` | ✅ | ✅ | — | — | — | — | — |
| `user.view_sensitive` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `mentor.approve` | ✅ | ✅ | — | — | — | — | — |
| `mentor.reject` | ✅ | ✅ | — | — | — | — | — |
| `mentor.view_applications` | ✅ | ✅ | ✅ | ✅ | — | — | — |
| `session.manage` | ✅ | ✅ | — | — | — | ✅ | — |
| `session.moderate` | ✅ | — | ✅ | — | — | — | — |
| `analytics.view` | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| `analytics.export` | ✅ | ✅ | — | — | — | — | — |
| `audit.view` | ✅ | ✅ | ✅ | — | — | — | — |
| `audit.export` | ✅ | ✅ | — | — | — | — | — |
| `content.manage` | ✅ | ✅ | ✅ | ✅ | — | — | — |
| `gamification.manage` | ✅ | ✅ | — | — | — | — | — |
| `bulk.actions` | ✅ | ✅ | — | — | — | — | — |
| `announcement.send` | ✅ | ✅ | — | — | — | — | — |
| `settings.manage` | ✅ | ✅ | — | — | — | — | — |

### Role Summary

| Role | Level | Permissions |
|------|-------|-------------|
| `super_admin` | 100 | 28/28 — Full platform control |
| `admin` | 80 | 27/28 — Full admin minus session moderation |
| `moderator` | 60 | 9/28 — Content and session moderation |
| `reviewer` | 50 | 4/28 — Read-only content review |
| `support` | 40 | 3/28 — User support (edit, view, reset password) |
| `mentor` | 30 | 2/28 — Session management, analytics view |
| `student` | 10 | 0/28 — No admin permissions |

---

## Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT (access 1d + refresh 14d), token rotation with reuse detection |
| **Authorization** | RBAC with 7 roles, 30+ permissions, `protect` + `authorize` + `requirePermission` middleware |
| **Rate Limiting** | Global (200/15min), Auth (10/15min), DM (30/min), Analytics (20/5min) |
| **Input Validation** | Zod schemas on all endpoints, MongoDB operator rejection |
| **Headers** | Helmet.js (XSS, CSP, HSTS, etc.) |
| **Password** | bcrypt with salt rounds |
| **Session Auth** | `requireSessionRole` for host/cohost actions |
| **Audit Logging** | Admin activity logs, session audit logs |
| **Socket Security** | JWT auth on connect, per-user connection limit (5), room-level auth |

---

## User Lifecycle

Users transition through these states:

```
pending → active → inactive → suspended → banned
    ↓         ↓         ↓           ↓
    ↓         ↓         ↓           ↓
    ↓         ↓         ↓           ↓
    ↓         ↓         ↓           ↓
rejected   deleted   restored   reactivated
```

| State | Description |
|-------|-------------|
| `pending` | Awaiting email verification or admin approval |
| `active` | Fully active user |
| `inactive` | No activity for 30+ days |
| `suspended` | Temporarily suspended by admin |
| `banned` | Permanently banned |
| `rejected` | Mentor application rejected |
| `deleted` | Soft-deleted (restorable within 30 days) |

---

## Mentor Approval Workflow

1. **Application Submission** — Mentor submits credentials, expertise, bio
2. **Duplicate Check** — System checks for existing applications or 30-day cooldown
3. **Admin Review** — Admin views application, verifies credentials
4. **Decision** — Approve (role upgraded to `mentor`) or Reject (with reason)
5. **Notification** — User notified of decision via in-app notification
6. **Rejection Cooldown** — 30-day wait before reapplying

---

## Attendance Verification

When `FEATURE_ATTENDANCE_VERIFICATION=true`:

1. **Join** — Student joins session, attendance record created
2. **Heartbeat** — Student sends heartbeat every 30 seconds
3. **Buffer** — Heartbeats buffered in memory, flushed every 10 seconds
4. **Leave** — Student leaves, total presence calculated
5. **Verification** — Attendance verified if presence >= 50% of session duration OR >= 30 minutes
6. **XP Grant** — Verified attendees receive XP bonus

---

## Audit Logging

Two audit log systems:

### AdminActivityLog
- Tracks admin actions: user.create, user.suspend, user.ban, etc.
- Fields: actor, action, resource, resourceId, before/after state, ip, userAgent

### SessionAuditLog
- Tracks session lifecycle: created, started, ended, user_joined, user_left
- Fields: session, actor, action, details, ip

---

## Monitoring

### Health Endpoints

```
GET /health           → 200 — Basic health with mission tagline
GET /health/ready     → 200/503 — Database connectivity check
GET /health/realtime  → 200 — Socket.io stats (dev only)
```

### Logging

- Winston structured JSON logging
- Log level controlled by `LOG_LEVEL` env var
- Slow request logging (>=500ms) in app.ts

---

## Testing

```bash
npm run test                        # All tests
npm run test -w backend             # Backend only
npm run test -w frontend            # Frontend only
```

### Backend Tests (20 files)

| Category | Tests |
|----------|-------|
| Health | `health.test.ts`, `ready.test.ts` |
| Security | `security.test.ts`, `auth.security.test.ts`, `refresh.security.test.ts` |
| API | `api.integration.test.ts` |
| Socket | `socket-workflows.test.ts` |
| Sessions | `session-control.test.ts` |
| Mentors | `mentor-workflows.test.ts`, `mentor-operating-system.test.ts` |
| Engagement | `engagement.test.ts` |
| Onboarding | `onboarding.architecture.test.js` |
| Avatar | `avatar.system.test.js` |
| Meeting | `attendance.test.ts`, `env-security.test.ts`, `live-token.test.ts`, `session-state.test.ts` |
| Admin | `admin.user-management.test.js` |

---

## Deployment

### Render

**Backend (Web Service):**
1. Create Web Service on [Render](https://render.com)
2. Connect GitHub repository
3. Build: `npm run build -w backend`
4. Start: `npm start -w backend`
5. Set environment variables

**Frontend (Static Site):**
1. Create Static Site on Render
2. Connect GitHub repository
3. Build: `npm run build -w frontend`
4. Publish: `frontend/dist`
5. Set `VITE_API_URL` to your backend URL

### MongoDB Atlas

1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user with strong password
3. Whitelist your Render IP
4. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/ethiotech`
5. Set as `MONGO_URI`

### Generate Strong Secrets

```bash
openssl rand -base64 32
```

---

## Contributing

We welcome contributions from developers, designers, mentors, and anyone passionate about our mission.

### Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/ethio-tech-platform.git
cd ethio-tech-platform
npm install
cp .env.example .env
cp frontend/.env.example frontend/.env
docker compose up -d mongo
npm run seed
npm run dev
```

### Branch Naming

- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code refactoring
- `test/` — Test additions

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add OAuth login with Google
fix(chat): resolve socket connection timeout
docs(readme): update deployment instructions
refactor(api): extract user service from controller
test(learning): add unit tests for XP calculation
```

### Pull Request Process

1. Create branch from `main`
2. Make changes with tests
3. Run `npm run lint` and `npm run typecheck`
4. Submit PR with clear description
5. Link related issues
6. Add screenshots for UI changes

---

## Roadmap

### Phase 1: Foundation (Complete)

- User authentication and authorization
- Student, mentor, admin roles with RBAC
- Learning platform with tracks, modules, lessons
- Project submission and review system
- Gamification (XP, levels, badges, streaks, daily challenges)
- Real-time chat with Socket.io
- Discussion forums and peer groups
- Mentorship system with application workflow
- Admin dashboard with user management
- Agora video/audio classroom
- Collaborative whiteboard (Konva)
- Breakout rooms
- Direct messaging
- Assignments, calendar, session explorer
- 49 MongoDB models, 46 controllers, 34 services

### Phase 2: Scale (Q3 2026)

- Redis for caching and rate limiting
- Socket.io Redis adapter for horizontal scaling
- Email notification system
- Calendar integration (Google Calendar, Outlook)
- Timezone handling
- Session recording with Agora
- Mobile responsive optimizations

### Phase 3: Intelligence (Q4 2026)

- AI-powered learning recommendations
- Adaptive difficulty adjustment
- Smart content suggestions
- Advanced analytics with cohort comparison
- Mentor matching algorithm

### Phase 4: Ecosystem (2027)

- Mobile apps (React Native)
- Offline learning support
- Corporate partnership portal
- Internship and job matching
- Multi-language support (Amharic, Oromo, Tigrinya)
- Blockchain-based certificates

---

## FAQ

**Q: Is EthioTech free?**
A: Yes. Completely free for students and mentors. Non-commercial, impact-driven platform.

**Q: Do I need prior coding experience?**
A: No. Beginner tracks start from scratch. Tracks range from beginner to intermediate.

**Q: How long to complete a track?**
A: Beginner tracks: 2-3 months (10-15 hrs/week). Advanced tracks: 4-6 months.

**Q: Can I become a mentor?**
A: Apply through the platform. Requires 2+ years professional experience, technical assessment, and interview.

**Q: What tech stack is used?**
A: React 19, TypeScript, Vite, Tailwind CSS, Node.js, Express, MongoDB, Socket.io, Agora RTC.

**Q: Can I use this for my own project?**
A: Yes. MIT License — free for commercial and personal use.

---

## License

MIT License — Copyright (c) 2024-2026 EthioTech Platform

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

---

## Acknowledgments

Built with care in **Addis Ababa** for **Ethiopia** and the world.

Inspired by [freeCodeCamp](https://www.freecodecamp.org/), [Khan Academy](https://www.khanacademy.org/), and the African tech ecosystem.

**The future of African tech starts here. Build it with us.**

---

<p align="center">
  <a href="https://github.com/Bedru-Mekiyu/ethio-tech-platform">Star on GitHub</a> •
  <a href="mailto:hello@ethio-tech.com">Contact</a> •
  <a href="#getting-started">Get Started</a>
</p>
