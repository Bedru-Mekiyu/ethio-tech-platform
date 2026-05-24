# EthioTech API (v1)

Base: `http://localhost:5000/api/v1`

## Auth
- `POST /auth/register` — student/mentor only
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout` (Bearer)
- `GET /auth/me` (Bearer)

## Learning
- `GET /tracks`, `GET /tracks/:id`
- `GET /lessons`, `GET /lessons/:id`, `POST /lessons/:id/complete` (student)

## Sessions & realtime
- `GET /sessions` (scoped by role)
- `POST /sessions/:id/join`, `GET /sessions/:id/live-access`
- `POST /sessions/:id/feedback` (student, ended sessions)
- `GET /chat/rooms/:roomId/messages` (Bearer)

## Gamification
- `GET /gamification/streak`, `POST /gamification/streak/ping`
- `GET /gamification/daily-challenge`

## Admin
- `GET /admin/analytics`
- `GET /admin/audit-logs`
- `GET /admin/moderation`

## Health
- `GET /health`, `GET /health/ready`, `GET /health/realtime`
