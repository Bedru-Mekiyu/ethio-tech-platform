# EthioTech Platform

**Immersive, gamified tech education for Ethiopia — MERN monorepo.**

Empowering youth from Grade 8 upward with hands-on software engineering, mentorship, and virtual classrooms.

## Monorepo structure

```
ethio-tech-platform/
├── backend/          # Express + TypeScript API (legacy JS modules coexisting)
├── frontend/         # Vite + React + TypeScript SPA
├── docker-compose.yml
├── .env.example
└── package.json      # npm workspaces root
```

| Package   | Stack                                      | Port |
|-----------|--------------------------------------------|------|
| `backend` | Node.js, Express, Mongoose, Socket.io      | 5000 |
| `frontend`| Vite, React 19, Tailwind CSS 4, React Query| 5173 |

**Design:** dark theme with cyan `#00d2ff` primary and purple `#7b61ff` secondary.

## Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)
- npm 10+

## Quick start

### 1. Clone and install

```bash
git clone <repo-url>
cd ethio-tech-platform
npm install
```

### 2. Environment variables

Copy the root example and create workspace env files:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

**Root / backend `.env`:**

```env
MONGO_URI=mongodb://localhost:27017/ethiotech
PORT=5000
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-refresh-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_DAYS=14
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

**Frontend `frontend/.env`:**

```env
VITE_API_URL=http://localhost:5000
```

### 3. Start MongoDB (optional Docker)

```bash
docker compose up -d mongo
```

### 4. Seed the database (optional)

```bash
npm run seed
```

### 5. Run development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/v1
- Health check: http://localhost:5000/health

## Scripts (root)

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Start backend + frontend together    |
| `npm run dev:backend`  | Backend only (`tsx watch`)       |
| `npm run dev:frontend` | Frontend only (`vite`)           |
| `npm run build`    | Build backend (`tsc`) + frontend   |
| `npm run typecheck` | Typecheck backend + frontend       |
| `npm run test`     | Backend Vitest suite               |
| `npm run lint`     | ESLint on frontend + backend       |
| `npm run seed`     | Seed MongoDB with sample data      |

## Frontend routes

| Path | Description |
|------|-------------|
| `/` | Marketing home |
| `/login`, `/register` | Auth |
| `/app/dashboard` | Student dashboard |
| `/app/tracks` | Learning tracks |
| `/app/achievements` | Badges & XP |
| `/app/projects/submit` | Project submission |
| `/app/squads/:id` | Socket.io squad chat |
| `/app/tracks/:trackId` | Track modules & lessons |
| `/app/lessons/:lessonId` | Lesson content & completion |
| `/app/xp` | XP history |
| `/app/notifications` | Notification inbox |
| `/app/sessions` | Session history |
| `/app/classroom/:sessionId` | Live classroom (Socket.io + 3D) |
| `/parent` | Parent dashboard |
| `/parent/settings` | Parent account settings |
| `/mentor` | Mentor dashboard |
| `/mentor/sessions` | Session management |
| `/admin` | Admin analytics |
| `/admin/moderation` | Submission moderation queue |
| `/blog`, `/partners`, `/donate` | Public extended pages |

## API overview

Base URL: `http://localhost:5000/api/v1`

See [docs/API.md](docs/API.md) for endpoint reference. Platform review: [docs/PLATFORM_REVIEW.md](docs/PLATFORM_REVIEW.md). Monitoring: [docs/MONITORING.md](docs/MONITORING.md).

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to `main`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

## Technology stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Router, Socket.io client, Recharts, React Three Fiber
- **Backend:** Node.js, Express, TypeScript entry (`server.ts`), Mongoose, JWT auth, Socket.io
- **Database:** MongoDB
- **Real-time:** Socket.io (squad chat, classroom sync)

## Contributing

Open an issue or PR. The mission is non-commercial — impact over profit.

## License

MIT — see repository license file.

---

Made with vision in Addis Ababa for Ethiopia and the world.
