# Monitoring & Production

## Health endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `GET /health/ready` | Readiness (MongoDB connected) |
| `GET /health/realtime` | Socket.io stats |

## Logging

Winston logs slow (>500ms) and failed HTTP requests. Set `LOG_LEVEL=info` in production.

## Error tracking (optional)

Set `SENTRY_DSN` in frontend/backend when integrating Sentry.

## Deploy checklist

1. Set strong `JWT_SECRET`, `JWT_REFRESH_SECRET`, `LIVE_CLASSROOM_SECRET`
2. Set `NODE_ENV=production`
3. Verify `/health/ready` returns 200 before routing traffic
4. Run `npm run seed` on fresh databases only
