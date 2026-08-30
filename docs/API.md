# EthioTech REST API Reference Catalog

All endpoints are hosted under the `/api/v1` route prefix and protected by rate limiting and Zod input validation.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user account |
| `POST` | `/login` | Public | Authenticate with email/password; returns JWT |
| `POST` | `/refresh` | Public | Issue new access token via HTTP-only cookie |
| `POST` | `/logout` | Authenticated | Invalidate refresh token and session |
| `POST` | `/forgot-password` | Public | Send password reset token email |
| `POST` | `/reset-password` | Public | Set new password with valid reset token |

---

## 2. Regional Hub Mesh (`/api/v1/hubs`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | List all regional tech hubs & details |
| `POST` | `/book` | Authenticated | Reserve workstation or in-person mentor desk |
| `GET` | `/bookings/me` | Authenticated | List current user's active and past passes |
| `POST` | `/checkin` | Authenticated | Check in upon physical arrival (+50 XP) |
| `GET` | `/:id/availability` | Public | Check available seats for a specific date |

---

## 3. Live WebRTC Sessions (`/api/v1/sessions`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | List scheduled, active, and past sessions |
| `POST` | `/` | Mentor / Admin | Schedule a new live mentorship session |
| `GET` | `/:id` | Authenticated | Get session details, attendee list, status |
| `POST` | `/:id/livekit/token` | Authenticated | Generate LiveKit SFU access token |
| `POST` | `/:id/start` | Host / Mentor | Start live meeting room |
| `POST` | `/:id/end` | Host / Mentor | Conclude live session |
| `POST` | `/:id/hand-raise` | Student | Request to speak / add to queue |
| `POST` | `/:id/poll` | Host / Mentor | Create real-time multi-choice poll |

---

## 4. Curriculum & CMS (`/api/v1/tracks`, `/modules`, `/lessons`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/tracks` | Public | List available learning tracks |
| `POST` | `/tracks` | Admin | Create a new technical career track |
| `GET` | `/tracks/:id` | Public | Get track details, modules, and lessons |
| `POST` | `/modules` | Admin | Create learning module in track |
| `POST` | `/lessons` | Admin | Author lesson with Markdown and lab sandbox |
| `POST` | `/lessons/:id/complete` | Student | Mark lesson complete and claim XP |

---

## 5. Gamification & Leaderboards (`/api/v1/xp`, `/badges`, `/leaderboard`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/xp/history` | Authenticated | Get itemized XP transaction log |
| `GET` | `/badges` | Public | Get categorized badge library |
| `GET` | `/leaderboard` | Public | Global, regional hub, and track standings |
| `GET` | `/gamification/daily-challenge` | Public | Active 24-hour algorithmic kata |
