# 🌍 EthioTech Platform

> **Empowering the next generation of Ethiopian technology leaders through immersive, gamified education and world-class mentorship.**

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19+-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-047edb?logo=mongodb)](https://www.mongodb.com/cloud/atlas)

## 📖 Quick Navigation

- [The Mission](#-the-mission) • [Why It Exists](#-why-this-exists) • [Features](#-key-features)
- [Getting Started](#-getting-started) • [Architecture](#-architecture) • [Tech Stack](#-technology-stack)
- [Development](#-development) • [Contributing](#-contributing) • [Roadmap](#-roadmap)

---

## 🎯 The Mission

**Ethiopia is experiencing a technology boom.** The continent's youth population is among the fastest-growing globally, yet access to quality tech education and mentorship remains limited.

**EthioTech Platform bridges that gap** — empowering Ethiopian students (Grade 8+) to master software engineering through:

✅ **Structured Learning Tracks** — Web Dev, Mobile Dev, Data Science, DevOps  
✅ **Professional Mentorship** — Connect with engineers from Google, Microsoft, Amazon, African tech leaders  
✅ **Gamification** — XP, badges, leaderboards keep students motivated  
✅ **Real-time Community** — Squad chat, peer reviews, collaborative learning  
✅ **Immersive Classroom** — Live 3D classroom environments with mentors  

**This isn't just another online course. It's a launchpad for careers.**

---

## 🌟 Why This Matters

### The Challenge

Ethiopian youth face critical gaps:

- **Limited quality tech education** — most teach theory, not practical job skills
- **No mentorship ecosystem** — students don't know professionals in tech
- **Brain drain** — talent leaves for opportunities abroad  
- **Equity gaps** — women and minorities face additional barriers
- **No clear pathways** — students don't know what to build

### Our Solution

We're building a platform that:

- Teaches **practical, job-ready skills** through real projects
- Connects students with **world-class mentors** who care about their success
- **Gamifies learning** to maintain motivation and engagement
- Builds **vibrant peer communities** for support and collaboration
- Creates **transparent career paths** to meaningful tech jobs
- Operates **locally, designed for Ethiopia's context**

---

## 🎮 Key Features

### 🎓 Learning Platform

- **Structured Tracks**: Web Dev, Mobile Dev, Data Science, DevOps, and more
- **Progressive Lessons**: Videos, interactive coding challenges, hands-on projects
- **Code Workspace**: Built-in editor for practice and project submission
- **Auto-grading**: Instant feedback on coding challenges
- **Project Reviews**: Submit projects for detailed mentor feedback
- **Certificates**: Earn completion certificates for each track

### 🏆 Gamification Engine

- **XP System**: Earn points for every learning action
- **Levels**: Progress from Novice → Expert (levels 1-50)
- **Badges**: Unlock achievements ("First Steps", "Helper", "Speedrunner")
- **Leaderboards**: Compete globally and locally by city/track
- **Daily Challenges**: 5-min daily coding problems
- **Streaks**: Maintain consecutive days learning for bonus rewards

### 👥 Mentorship Ecosystem

- **Mentor Recruitment**: Credentialed professional mentors
- **Availability Calendar**: Choose your own mentoring hours
- **1-on-1 Sessions**: Book live sessions with mentors
- **Session Dashboard**: Scheduling, notes, feedback tracking
- **Quality Ratings**: Student reviews ensure mentor quality
- **Mentor Scores**: Reputation system (0-1000 scale)

### 💬 Community Platform

- **Squads**: Small groups of 4-8 students with shared goals
- **Real-time Chat**: Socket.io powered group messaging
- **Discussion Hubs**: Topic-based forums (General, Projects, Help, Careers)
- **Peer Reviews**: Community members review each other's code
- **Notifications**: Stay updated on messages, achievements, opportunities
- **Activity Feed**: See what peers are learning and celebrating

### 🎪 Immersive Classroom

- **Live Video**: High-quality sessions with screen sharing
- **3D Presence**: Avatar-based classroom environment
- **Interactive Whiteboard**: Real-time collaborative coding
- **Real-time Chat**: In-classroom Q&A and messaging
- **Session Recording**: Review lessons anytime
- **WebRTC Ready**: Future peer-to-peer collaboration support

### 👤 Profile System

- **Customizable Avatars**: Upload or generate avatars
- **Showcase Profile**: Display XP, badges, certificates, bio
- **Skill Tags**: Show expertise and learning interests
- **Social Links**: GitHub, LinkedIn, portfolio connections
- **Privacy Controls**: Manage your data visibility

### 🛠️ Admin Dashboard

- **Analytics**: Track metrics, user growth, platform health
- **Moderation**: Review and approve user submissions
- **User Management**: Monitor accounts, enforce policies
- **Content Creation**: Build tracks, lessons, badges
- **Mentor Verification**: Review and approve mentors
- **Community Moderation**: Maintain healthy discussions

---

## 🏛️ Architecture Overview

### System Design

`
┌─────────────────────────────────────────────────┐
│        React Frontend (Vite + TypeScript)       │
│     Tailwind CSS • Zustand • TanStack Query    │
│        Socket.io • Framer Motion • 3D         │
└─────────────────────────┬───────────────────────┘
                          │ HTTPS / WebSocket
                          ↓
┌─────────────────────────────────────────────────┐
│       Express API (Node.js + TypeScript)        │
│    JWT • Rate Limiting • Validation • Helmet   │
│    Socket.io Server • Health Checks            │
└─────────────────────────┬───────────────────────┘
                          │ Queries
                          ↓
┌─────────────────────────────────────────────────┐
│         MongoDB Atlas (Production)              │
│    Collections: Users, Tracks, Projects,       │
│    Submissions, Badges, Sessions, Chat         │
└─────────────────────────────────────────────────┘

External Services:
  ├─ Cloudinary (Avatar CDN)
  ├─ Render (Deployment)
  └─ MongoDB Atlas (Database)
`

### Project Layout

`
ethio-tech-platform/
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/        # Route-based pages
│   │   ├── features/     # Feature modules
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API & Socket.io clients
│   │   ├── store/        # Zustand state management
│   │   └── config/       # Constants & config
│   └── dist/            # Production build
│
├── backend/              # Express + Node.js + TypeScript
│   ├── src/
│   │   ├── app.ts       # Express setup
│   │   ├── server.ts    # HTTP + Socket.io
│   │   ├── models/      # Mongoose schemas
│   │   ├── controllers/ # Route handlers
│   │   ├── routes/      # API route definitions
│   │   ├── middlewares/ # Express middlewares
│   │   ├── services/    # Business logic
│   │   ├── socket/      # Socket.io handlers
│   │   └── scripts/     # Seed data
│   └── dist/           # Compiled output
│
├── docs/               # Documentation
│   ├── API.md         # API reference
│   ├── ARCHITECTURE.md # Design decisions
│   └── DEPLOYMENT.md  # Deployment guide
│
├── .github/workflows/ # CI/CD automation
├── docker-compose.yml # Local development setup
└── package.json       # Monorepo root

Monorepo with npm workspaces: frontend + backend
`

---

## 🛠️ Technology Stack

### Why Our Tech Choices

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 | Modern, component-based, huge ecosystem |
| | TypeScript | Type safety, better DX, fewer runtime errors |
| | Vite | Lightning-fast dev, ES modules, optimal builds |
| | Tailwind CSS 4 | Utility-first, rapid prototyping, consistent |
| | Zustand | Lightweight state management, no boilerplate |
| | TanStack Query | Powerful data fetching, caching, sync |
| | Socket.io Client | Real-time messaging, fallback support |
| | Framer Motion | Smooth animations, excellent DX |
| **Backend** | Node.js 22 | JavaScript everywhere, non-blocking I/O |
| | Express | Minimal, flexible, battle-tested |
| | TypeScript | Type safety for APIs, excellent tooling |
| | Mongoose | Schema validation, relationships, middleware |
| | Socket.io | Real-time with fallbacks, rooms support |
| | JWT (jsonwebtoken) | Stateless auth, refresh token patterns |
| | Bcrypt | Industry standard password hashing |
| | Zod | Type-safe validation, clear errors |
| **Database** | MongoDB | Flexible schema, scales horizontally |
| | Mongoose | ODM with validation and middleware |
| **Infrastructure** | Render.com | Easy deployment, auto-SSL, free tier |
| | MongoDB Atlas | Managed MongoDB, auto-backups, scaling |
| | Cloudinary | Image hosting, CDN, optimization |
| | GitHub Actions | Free CI/CD, native GitHub integration |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22+ — [Download](https://nodejs.org)
- **npm** 10+ — Comes with Node.js
- **MongoDB** — [Local](https://www.mongodb.com/docs/manual/installation/) or [Atlas free tier](https://www.mongodb.com/cloud/atlas)
- **Git** — [Download](https://git-scm.com)

### 1️⃣ Clone & Install

\\\ash
git clone https://github.com/Bedru-Mekiyu/ethio-tech-platform.git
cd ethio-tech-platform
npm install
\\\

### 2️⃣ Configure Environment

**Backend (.env):**
\\\ash
cp .env.example .env
\\\

Edit \.env\:
\\\nv
MONGO_URI=mongodb://localhost:27017/ethiotech
PORT=5000
NODE_ENV=development
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
\\\

**Frontend (frontend/.env):**
\\\ash
cp frontend/.env.example frontend/.env
\\\

Edit \rontend/.env\:
\\\nv
VITE_API_URL=http://localhost:5000
\\\

### 3️⃣ Start MongoDB

\\\ash
docker compose up -d mongo
\\\

Or use your local MongoDB instance.

### 4️⃣ Seed Database (Optional)

\\\ash
npm run seed -w backend
\\\

Creates:
- 🤖 Admin: admin@ethiotech.com / Passw0rd!
- 👨‍🏫 Mentor: mentor@ethiotech.com / Passw0rd!
- 👨‍🎓 Student: student@ethiotech.com / Passw0rd!
- 📚 Complete curriculum with projects
- 🏆 Badges, levels, daily challenges

### 5️⃣ Run Development Servers

\\\ash
npm run dev
\\\

Access:
- 🖥️ Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:5000/api/v1
- ✅ Health: http://localhost:5000/health

---

## 💻 Development

### Root Scripts

\\\ash
npm run dev              # Start backend + frontend
npm run dev:backend     # Backend only
npm run dev:frontend    # Frontend only
npm run build           # Build both (production)
npm run typecheck       # TypeScript type checking
npm run lint            # Run ESLint
npm run test            # Run all tests
npm run seed            # Seed MongoDB
\\\

### Frontend Development

\\\ash
cd frontend
npm run dev             # Start Vite dev server
npm run build           # Production build
npm run preview         # Preview prod build
npm run lint            # ESLint check
\\\

### Backend Development

\\\ash
cd backend
npm run dev             # Watch mode with tsx
npm run build           # Compile TypeScript
npm run seed            # Seed database
npm run test            # Run Vitest
\\\

---

## 🧪 Testing

\\\ash
npm run test            # Run all tests
npm run test -w backend  # Backend tests only
npm run test -w frontend # Frontend tests only
\\\

**Test Target:** 80%+ coverage on critical paths
- ✅ Authentication flows
- ✅ Validation logic  
- ✅ API endpoints
- ✅ React components
- ✅ State management

---

## 🚀 Deployment

### Deploy to Render

#### Backend Setup

1. Create **Web Service** on Render.com
2. Connect GitHub repository
3. **Build Command:**
   \\\
   npm run build -w backend
   \\\
4. **Start Command:**
   \\\
   npm start -w backend
   \\\
5. **Environment Variables:**
   \\\nv
   NODE_ENV=production
   MONGO_URI=<mongodb-atlas-connection-string>
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
   CORS_ORIGIN=https://<your-frontend-url>
   CLOUDINARY_NAME=<your-cloudinary-account>
   CLOUDINARY_API_KEY=<api-key>
   CLOUDINARY_API_SECRET=<api-secret>
   \\\

#### Frontend Setup

1. Create **Static Site** on Render.com
2. Connect GitHub repository
3. **Build Command:**
   \\\
   npm run build -w frontend
   \\\
4. **Publish Directory:**
   \\\
   frontend/dist
   \\\
5. **Environment Variables:**
   \\\nv
   VITE_API_URL=https://<your-backend-render-url>
   \\\

#### MongoDB Atlas Setup

1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user with strong password
3. Whitelist your Render IP
4. Copy connection string: \mongodb+srv://user:pass@cluster.mongodb.net/ethiotech\
5. Add to backend \MONGO_URI\

#### Generate Strong Secrets

\\\ash
openssl rand -base64 32
\\\

### Health Checks

\\\
GET /health           # Basic health
GET /api/v1/health    # Full health with DB
\\\

---

## 👥 User Roles

### Student
- Learn tracks, complete lessons, submit projects
- Earn XP, badges, climb leaderboards
- Join squads, collaborate with peers
- Request mentorship sessions
- Showcase profile to mentors

### Mentor
- Review student submissions
- Conduct 1-on-1 mentoring sessions
- Set availability and manage schedule
- Provide feedback and guidance
- Track mentee progress

### Administrator
- Manage users (students, mentors, admins)
- Create and manage curriculum
- Approve mentor applications
- Moderate community content
- View analytics and platform metrics

---

## 🎮 Core Systems

### Learning Platform
Structured curriculum with progressive lessons, auto-graded challenges, and project submissions reviewed by mentors.

### Gamification
XP system, levels (1-50), badges, global/local leaderboards, daily challenges, and streaks to keep students motivated.

### Mentorship
Credentialed mentor recruitment, availability scheduling, 1-on-1 sessions, student ratings, and mentor scoring.

### Real-time Community
Squad chat with Socket.io, discussion hubs, peer code reviews, notifications, and activity feeds.

### Immersive Classroom
Live video sessions, 3D avatar presence, collaborative whiteboard, session recording, and future WebRTC support.

---

## 🤝 Contributing

### How to Help

- **💻 Code**: Frontend, backend, testing improvements
- **🎨 Design**: UI/UX, accessibility, Tailwind improvements
- **📝 Documentation**: Guides, API docs, examples
- **🐛 Bug Fixes**: Find and fix issues
- **💡 Ideas**: Feature suggestions, improvements

### Development Workflow

\\\ash
# 1. Fork repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ethio-tech-platform.git
cd ethio-tech-platform

# 3. Create feature branch
git checkout -b feature/amazing-feature

# 4. Make changes, commit clearly
git commit -m "feat: add amazing feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update guide"

# 5. Push to your fork
git push origin feature/amazing-feature

# 6. Open Pull Request
# - Clear title and description
# - Link related issues
# - Include screenshots for UI changes
# - Ensure CI passes
\\\

### Code Standards

- ✅ Use **TypeScript** for type safety
- ✅ Follow **ESLint** rules
- ✅ Write **tests** for features
- ✅ Clear **commit messages**
- ✅ Update **documentation**

### Commit Message Format

\\\
feat: add user authentication
fix: resolve socket connection bug
docs: update deployment guide
test: add auth unit tests
refactor: improve error handling
\\\

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Current)
- [x] Core learning platform
- [x] Gamification system
- [x] Student & mentor accounts
- [x] Real-time community chat
- [x] Basic immersive classroom

### 🎯 Phase 2: Mentorship Expansion (Q3 2026)
- [ ] Enhanced mentor dashboard
- [ ] Advanced scheduling system
- [ ] Payment integration
- [ ] Group mentoring sessions
- [ ] Mentor certification program

### 🚀 Phase 3: Advanced Classroom (Q4 2026)
- [ ] WebRTC peer-to-peer video
- [ ] Collaborative code editor
- [ ] Screen recording system
- [ ] Whiteboard improvements
- [ ] Session analytics

### 🏢 Phase 4: Corporate Partnerships (Q1 2027)
- [ ] Corporate track sponsorship
- [ ] Company-led events
- [ ] Internship pipeline
- [ ] Custom corporate content
- [ ] Company analytics

### 🌍 Phase 5: Scale & Optimization (Q2 2027)
- [ ] Mobile app (React Native)
- [ ] Offline learning support
- [ ] AI-powered recommendations
- [ ] Advanced search system
- [ ] International expansion

---

## ❓ FAQ

**Q: Is EthioTech free?**  
A: Yes! Completely free for students and mentors. We're non-commercial, impact-driven.

**Q: Who can join?**  
A: Anyone interested in learning tech! We focus on Grade 8+, but all ages welcome.

**Q: Can I become a mentor?**  
A: Yes! Apply on the platform, verify credentials, set your availability.

**Q: Can schools use this?**  
A: Absolutely! Teachers can integrate tracks into their curriculum. Contact us.

**Q: What languages are supported?**  
A: English and Amharic currently. More languages planned.

**Q: How do I contribute code?**  
A: See Contributing section. Fork, branch, code, commit, push, PR!

**Q: Is the code open source?**  
A: Yes! MIT license. Use, modify, distribute freely.

**Q: How are mentors verified?**  
A: LinkedIn verification, background check, community reviews, mentor scoring.

**Q: Can I use this commercially?**  
A: MIT license allows commercial use. We'd love to hear about it!

---

## 📄 License

**MIT License** — You're free to use, modify, and distribute this code.

See [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgments

Built with 💙 in **Addis Ababa** for **Ethiopia** and the world.

**Special thanks to:**
- Ethiopian tech community for inspiration
- Open source projects we depend on
- Beta testers and early mentors
- Contributors worldwide

---

## 📫 Get Involved

- 🐦 **Twitter**: [@EthioTech](https://twitter.com)
- 💼 **LinkedIn**: [EthioTech Platform](https://linkedin.com)
- 📧 **Email**: hello@ethio-tech.com
- 💬 **Discord**: [Community](#) (coming soon)
- 📱 **Instagram**: [@ethiotechplatform](#)

---

**The future of African tech starts here.**

**Build it with us. 🚀**

**Made in Ethiopia. For the world.**