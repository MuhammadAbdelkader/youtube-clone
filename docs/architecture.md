# YouCube v2.0 — System Architecture

## Overview

YouCube is a full-stack video streaming platform built on the **MEAN stack** (MongoDB, Express, Angular, Node.js) with enterprise-grade caching, AI-powered metadata, and a dual-token authentication pipeline.

---

## Stack Inventory

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Frontend | Angular | v20 | Standalone components, Signal reactivity |
| Styling | Bootstrap + FontAwesome | 5.x / 7.x | UI framework + icons |
| Backend | Node.js + Express | 20 LTS / v5 | API server |
| Database | MongoDB (Atlas) | 7+ | Primary data store |
| Cache | Upstash Redis | REST API | Session OTPs + feed cache |
| Auth | JWT + Google OAuth2 | — | Dual-token authentication |
| Email | Resend | v6 | Transactional OTP emails |
| Storage | Cloudinary | v2 | Video + image CDN |
| AI | Google Gemini | 2.5 Flash | Video metadata insights |
| Containerization | Docker + Compose | 24+ | Portable deployment |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Angular v20)                     │
│  ┌───────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │  Pages    │  │  Components  │  │  Services / Interceptors │   │
│  │ (11 pages)│  │ (navbar,     │  │  (AuthService,          │   │
│  │           │  │  sidebar,    │  │   VideoService,          │   │
│  │           │  │  toast)      │  │   JWT Interceptor)       │   │
│  └───────────┘  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP (Bearer token)
                               │ port 4200 → proxy → 3000
┌──────────────────────────────▼──────────────────────────────────┐
│                     SERVER (Express v5 / Node 20)                │
│                                                                   │
│  app.js ──► Helmet ──► CORS ──► Rate Limits ──► Routes          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Route Groups                         │   │
│  │  /api/auth  /api/videos  /api/channels  /api/likes        │   │
│  │  /api/comments  /api/subscriptions  /api/watch-history    │   │
│  │  /api/recommendations  /health                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │  Controllers │  │   Middleware   │  │     Utils         │    │
│  │  (8 files)   │  │  authenticate  │  │  jwt.js           │    │
│  │              │  │  validation    │  │  cloudinary.utils │    │
│  │              │  │  error handler │  │  resend.utils     │    │
│  │              │  │  channel-guard │  │  gemini.utils     │    │
│  └──────┬───────┘  └────────────────┘  └──────────────────┘    │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Mongoose Models (7 schemas)                  │    │
│  │  User  Video  Channel  Comment  Like  Subscription       │    │
│  │  WatchHistory                                             │    │
│  └──────────────────────┬──────────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
   ┌──────────┐   ┌──────────────┐  ┌───────────────┐
   │ MongoDB  │   │ Upstash Redis│  │  Cloudinary   │
   │  Atlas   │   │  (OTP + Feed │  │  (CDN Video + │
   │          │   │   Cache)     │  │   Image store)│
   └──────────┘   └──────────────┘  └───────────────┘
```

---

## Security Architecture

### 1. Helmet (HTTP Security Headers)
Applied globally via `helmet()` with `crossOriginResourcePolicy: "cross-origin"` to permit Cloudinary-hosted media assets to load in the browser.

### 2. CORS Policy
Strict origin whitelist. Only `process.env.FRONTEND_URL` (default: `http://localhost:4200`) is allowed. Credentials mode enabled for the HttpOnly cookie exchange.

### 3. Rate Limiting (3-Tier System)

| Tier | Route | Limit |
|------|-------|-------|
| Global | All routes | 200 req / 15 min / IP |
| Auth | `/api/auth/*` | 20 req / 15 min / IP |
| Upload | `/api/videos/upload` | 15 req / hour / IP |

### 4. JWT Dual-Token Authentication Flow

```
Login ──► generateAccessToken(userId)  → { expiresIn: "15m" }  → response body
      └─► generateRefreshToken(userId) → { expiresIn: "7d" }   → HttpOnly cookie
                                                                    (SameSite=Strict)

Expired access token:
  POST /api/auth/refresh
  → reads refreshToken cookie
  → verifies against JWT_REFRESH_SECRET
  → issues new 15-minute accessToken

Logout:
  → clearCookie("refreshToken")
```

The access token is stored in client memory / localStorage. The refresh token **never touches JavaScript** — it lives exclusively in an HttpOnly cookie, making it immune to XSS exfiltration.

### 5. OTP Security (Resend + Redis)

- OTPs are 6-digit cryptographically random integers (`crypto.randomInt(100000, 999999)`)
- Stored in Upstash Redis with a **5-minute TTL** (`ex: 300`)
- Verification OTPs use key `verify:<email>`, reset OTPs use key `reset:<email>`
- OTP is **deleted immediately after first successful use** (no replay attacks)
- Forgot-password always returns HTTP 200 to prevent email enumeration attacks

### 6. Password Security
- bcrypt with **12 rounds** (register), **10 rounds** (profile update — intentionally lighter for interactive UX)
- `password_hash` field has `select: false` — never returned in any query by default
- Google OAuth users have `password_hash: null` — password login explicitly blocked

### 7. MongoDB Sparse Indexes
`googleId` uses `{ unique: true, sparse: true }` — prevents E11000 duplicate key crashes when multiple standard-auth users have `googleId: undefined`. Without `sparse: true`, two null-valued documents would collide on the unique index.

---

## Caching Architecture (Upstash Redis)

### Client Initialization (Singleton)
`config/redis.js` implements a lazy singleton pattern. The `getRedisClient()` function parses the `REDIS_URL` (`rediss://:password@host:port`) format and converts it to the `{ url: "https://host", token: "password" }` format required by `@upstash/redis` REST SDK.

### Feed Cache (Video Controller)
```
GET /api/videos (with params) → cache key: "videos:feed:{page}:{limit}:{category}:{lang}"
                                         └─► stored in Redis + key recorded in SET "videos:feed:active-keys"

POST/PATCH/DELETE video → invalidateFeedCache()
                        → SMEMBERS "videos:feed:active-keys" → DEL all keys → DEL set
```

This solves the "stale feed" problem without SCAN/KEYS pattern matching (which Upstash REST SDK doesn't support efficiently). Best-effort: Redis errors during invalidation log a warning but never fail the upload/edit/delete.

### Subscription Cache
- Key: `subs:<userId>` — stores `{ data: [...], total: N }` for first-page of subscriptions
- TTL: 5 minutes
- Invalidated on subscribe/unsubscribe

### OTP Cache
- Keys: `verify:<email>` and `reset:<email>`
- TTL: 5 minutes (300 seconds)
- Deleted on successful use

---

## Cloudinary Storage Pattern

All uploads use **streaming** (no temp file I/O):

```
multer (memoryStorage) → Buffer in RAM
  └──► Readable.from(buffer).pipe(cloudinary.uploader.upload_stream(...))
         └──► Cloudinary CDN → secure_url returned
```

- Videos: `resource_type: "video"`, `chunk_size: 6MB` (resumable chunks)
- Images: `resource_type: "auto"`, `quality: "auto"`, `fetch_format: "auto"`
- Deletion: `cloudinary.uploader.destroy(public_id, { resource_type })` — handles folder-prefixed public IDs

---

## AI Layer (Google Gemini)

`gemini.utils.js` exposes `generateVideoInsights({ title, description, category, tags })` which:
1. Constructs a structured prompt requesting JSON output only (no markdown fences)
2. Strips any accidental markdown code fences from the response
3. Returns `{ aiSummary: string, aiTags: string[] }` — both written to the Video document

Model is configurable via `GEMINI_MODEL` env var (default: `gemini-2.5-flash`). This allows quick model swaps when Google retires Flash versions.

---

## Email Layer (Resend)

`resend.utils.js` uses the Resend SDK to send branded HTML emails:
- **Verification emails**: OTP in a styled OTP box, 5-minute expiry noted
- **Password reset emails**: Similar branded template
- **Sandbox fallback**: If Resend returns a 403 (sandbox restriction on `onboarding@resend.dev`), the utility logs the OTP directly to the terminal and resolves successfully — keeping dev workflows unblocked without exposing the OTP in API responses.

---

## Frontend Architecture (Angular v20)

### Component Model
All components are **standalone** (no NgModules). Routing uses `app.routes.ts` with lazy-loaded page routes.

### Pages (11 total)
`home`, `explore`, `video-details`, `channel`, `subscriptions`, `profile`, `create-video`, `login`, `register`, `forgot-password`, `main`

### Shared Components (3)
`navbar`, `sidebar`, `toast`

### Services & Interceptors
- Services in `src/app/services/` — API integration layer
- HTTP interceptors in `src/app/interceptors/` — auto-attaches `Authorization: Bearer <token>` and handles 401 token refresh
- Pipes in `src/app/pipes/` — view formatting utilities
