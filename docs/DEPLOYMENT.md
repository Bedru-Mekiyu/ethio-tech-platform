# Production Deployment & DevOps Guide

This guide details deploying the EthioTech Platform across containerized and cloud platforms.

```
                     ┌────────────────────────────────────────┐
                     │ Cloudflare Edge (SSL / CDN / WAF)      │
                     └───────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
    ┌────────────▼────────────┐                     ┌────────────▼────────────┐
    │ Frontend Edge (Vercel)  │                     │ API Engine (Render/AWS) │
    │ Static React 19 Bundle  │                     │ Node.js 22 LTS Cluster  │
    └─────────────────────────┘                     └────────────┬────────────┘
                                                                 │
                                          ┌──────────────────────┴──────────────────────┐
                                          │                                             │
                             ┌────────────▼────────────┐                   ┌────────────▼────────────┐
                             │ MongoDB Atlas (Primary) │                   │ LiveKit Cloud / SFU     │
                             │ High-Availability M10+  │                   │ Distributed Media Grid  │
                             └─────────────────────────┘                   └─────────────────────────┘
```

---

## 1. Frontend Deployment (Vercel / Netlify / Cloudflare Pages)

1. Connect your GitHub repository.
2. Configure build settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set environment variables:
   ```ini
   VITE_API_URL=https://api.ethiotech.org/api/v1
   VITE_SOCKET_URL=https://api.ethiotech.org
   VITE_LIVEKIT_URL=wss://livekit.ethiotech.org
   ```

---

## 2. Backend Deployment (Render / Railway / AWS ECS)

1. Set runtime environment to **Node.js 22+**.
2. Configure startup commands:
   - **Build Command**: `npm run build -w backend`
   - **Start Command**: `npm run start -w backend`
3. Required production environment variables:
   ```ini
   PORT=5000
   NODE_ENV=production
   APP_URL=https://app.ethiotech.org
   CORS_ORIGIN=https://app.ethiotech.org
   MONGO_URI=mongodb+srv://<user>:<pwd>@cluster0.mongodb.net/ethio-tech-prod
   JWT_SECRET=<64-char-random-secure-string>
   JWT_REFRESH_SECRET=<64-char-random-secure-string>
   LIVEKIT_URL=wss://livekit.ethiotech.org
   LIVEKIT_API_KEY=<livekit-production-key>
   LIVEKIT_API_SECRET=<livekit-production-secret>
   ```

---

## 3. LiveKit SFU Deployment

For self-hosted LiveKit instances:
```yaml
# livekit.yaml
port: 7880
rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: true
redis:
  address: redis.internal:6379
keys:
  api_key: api_secret
```
