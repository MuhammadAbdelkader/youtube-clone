# YouCube v2.0 — Deployment Guide

## Local Development

No Docker required for local development. Use the dev scripts directly:

```bash
# Terminal 1 — Backend (from /server)
cd server
npm run dev        # nodemon server.js — auto-restart on change

# Terminal 2 — Frontend (from /client)
cd client
ng serve --open    # Angular dev server with HMR, opens browser

# Or from project root (both simultaneously)
npm start          # Uses concurrently to start both
```

Prerequisites: Node.js 20 LTS, MongoDB Atlas URI in `server/.env`, Upstash Redis URL in `server/.env`.

---

## Environment Setup

Copy the example and fill in your values:

```bash
cp server/.env.example server/.env
# Edit server/.env — never commit this file
```

Required variables (server will exit immediately if any are missing):

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Upstash Redis URL (`rediss://:password@host:port`) |
| `JWT_ACCESS_SECRET` | Random 64+ char string for access tokens |
| `JWT_REFRESH_SECRET` | Random 64+ char string for refresh tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `RESEND_API_KEY` | Resend API key (`re_...`) |
| `FROM_EMAIL` | Verified sender email address |
| `CLOUDINARY_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Docker Deployment (Recommended for Production)

### Build & Run the Server Container

```bash
# From project root
docker build -t youcube-server ./server

# Run with environment variables from .env file
docker run -d \
  --name youcube-api \
  --env-file server/.env \
  -p 3000:3000 \
  youcube-server
```

### Docker Compose (Full Stack)

```bash
# Start server (uses .env for MongoDB Atlas — no local Mongo needed)
docker compose up -d

# View logs
docker compose logs -f server

# Stop
docker compose down
```

The `docker-compose.yml` at the project root defines:
- **`server`** service: builds from `./server`, reads all env vars from your shell environment or a `.env` file
- **`mongo`** service (optional): local MongoDB 7 for fully offline development — commented out by default since Atlas is used

---

## Production Deployment Checklist

### Before Deploying
- [ ] All 10 required env vars set in production environment
- [ ] `NODE_ENV=production` set (enables secure cookie flag on refresh token)
- [ ] `FRONTEND_URL` set to actual production domain (CORS enforcement)
- [ ] `FROM_EMAIL` set to a verified Resend domain (not `onboarding@resend.dev`)
- [ ] Cloudinary folder names reviewed (default: `youcube/videos`, `youcube/images`)
- [ ] MongoDB Atlas IP whitelist updated to include deployment server IP

### Server Hardening
- [ ] Run as non-root user (Dockerfile already handles this via `node` user)
- [ ] HTTPS termination at reverse proxy (Nginx/Caddy) — Express itself serves HTTP only
- [ ] Set `GEMINI_MODEL` to latest non-deprecated Flash version
- [ ] Review rate limit thresholds for expected traffic volume

### Angular Production Build
```bash
cd client
ng build --configuration production
# Output: client/dist/client/browser/
```

Serve the `dist/` directory via Nginx or any static file host (Vercel, Netlify, Firebase Hosting, etc.).

---

## Nginx Reverse Proxy (Example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL config (Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Angular SPA
    root /var/www/youcube/dist/client/browser;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check (monitoring)
    location /health {
        proxy_pass http://localhost:3000;
    }
}
```

---

## Health Monitoring

The `/health` endpoint is monitoring-ready (no auth required):

```bash
curl http://localhost:3000/health
# { "status": "ok", "uptime": 1234.5, "timestamp": "...", "redis": "connected" }
```

Use with UptimeRobot, Datadog, or any HTTP monitoring service. Set alert if `status !== "ok"` or HTTP response code is not 200.
