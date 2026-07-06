# YouCube v2.0 — Security Reference

## 1. HTTP Security Headers (Helmet)

Applied globally via `helmet()` in `app.js`. Default protections enabled:

| Header | Value | Protection |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking (iframes) |
| `X-XSS-Protection` | `0` | Disables legacy XSS filter (CSP is superior) |
| `Strict-Transport-Security` | `max-age=15552000` | Forces HTTPS in production |
| `Cross-Origin-Resource-Policy` | `cross-origin` | Allows Cloudinary CDN assets to load |

---

## 2. CORS Policy

```js
cors({
  origin: process.env.FRONTEND_URL || "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true   // required for HttpOnly cookie exchange
})
```

- **Production**: Set `FRONTEND_URL` to your exact domain (e.g., `https://youcube.app`). Never use `*` with `credentials: true`.
- **Credentials mode**: Required so the Angular client can send and receive the `refreshToken` HttpOnly cookie.

---

## 3. Rate Limiting

Three independent tiers using `express-rate-limit` with in-memory store (MemoryStore):

| Tier | Route Pattern | Limit | Window | Rationale |
|------|--------------|-------|--------|-----------|
| Global | `*` (all routes) | 200 req | 15 min / IP | Baseline DDoS protection |
| Auth | `/api/auth/*` | 20 req | 15 min / IP | Brute-force OTP/password protection |
| Upload | `/api/videos/upload` | 15 req | 1 hour / IP | Bandwidth abuse prevention |

**Headers returned:**
- `RateLimit-Limit` (standard)
- `RateLimit-Remaining` (standard)
- `RateLimit-Reset` (standard)
- No legacy `X-RateLimit-*` headers (`legacyHeaders: false`)

> **Scaling note:** For multi-instance deployments (load-balanced), replace `MemoryStore` with a Redis store (`rate-limit-redis`) so limits are shared across all instances.

---

## 4. JWT Token Security

### Access Token
- Algorithm: `HS256` (HMAC-SHA256)
- Secret: `JWT_ACCESS_SECRET` (min 64 chars recommended)
- Expiry: **15 minutes**
- Storage: Client memory / localStorage (accessible to JavaScript)
- Transport: `Authorization: Bearer <token>` header

### Refresh Token
- Algorithm: `HS256`
- Secret: `JWT_REFRESH_SECRET` (separate from access secret)
- Expiry: **7 days**
- Storage: **HttpOnly cookie** — JavaScript cannot read this value
- Cookie flags: `HttpOnly`, `SameSite=Strict`, `Secure` (production only)
- Transport: Sent automatically by browser with every request to same origin

### Threat Model
| Threat | Mitigation |
|--------|-----------|
| XSS steals access token | 15-minute TTL limits exposure window |
| XSS steals refresh token | HttpOnly cookie — impossible for JS to read |
| CSRF refresh abuse | `SameSite=Strict` — browser won't send cookie cross-site |
| Token replay after logout | `clearCookie` on logout; stateless (no server-side blacklist — acceptable for v2.0) |

> **v3.0 consideration:** For token revocation (e.g., force logout all sessions), maintain a Redis blocklist of refresh token JTIs.

---

## 5. OTP Security

### Generation
```js
crypto.randomInt(100000, 999999)  // Cryptographically secure — NOT Math.random()
```

### Storage
- Redis key: `verify:<email>` (registration) / `reset:<email>` (password reset)
- TTL: **300 seconds (5 minutes)**
- Storage backend: Upstash Redis (TLS-encrypted, cloud-hosted)

### Consumption
- OTP is **deleted immediately after first successful validation** → no replay attacks
- Constant-time string comparison: `storedOtp !== otp` (primitive string equality — safe here because the OTP is not security-sensitive in the same way as a password hash; brute-force is blocked by the auth rate limiter)

### Enumeration Protection
- `POST /api/auth/forgot-password` always returns HTTP 200 regardless of whether the email exists
- Error message does not distinguish between "email not found" and "email found"

---

## 6. Password Security

| Operation | bcrypt Rounds | Rationale |
|-----------|--------------|-----------|
| Registration | 12 rounds | ~250ms — high security for account creation |
| Profile password update | 10 rounds | ~80ms — slightly faster for interactive UX |

- `password_hash` field: `select: false` in Mongoose schema — never included in query results by default
- Must be explicitly requested with `.select("+password_hash")`
- Google OAuth users have `password_hash: null` — attempting password login returns 400

---

## 7. MongoDB Security

### Sparse Index (googleId)
```js
googleId: { type: String, unique: true, sparse: true }
```
Without `sparse: true`, two documents with `googleId: undefined` would collide on the unique index → E11000 crash. Sparse indexes only enforce uniqueness on documents where the field **exists and is not null**.

### Input Sanitization
- All inbound request bodies pass through Joi validation middleware before reaching controllers
- Validation failures return `{ status: "fail", errors: ["..."] }` — raw Mongoose or Node errors never reach the client
- String fields that feed into `User.findOne()` are explicitly coerced: `String(email)` — prevents prototype pollution via `{ $gt: "" }` style injections

### Mongoose Strict Mode
Default Mongoose behavior (`strict: true`) — fields not in the schema are silently stripped from all writes.

---

## 8. File Upload Security

| Check | Implementation |
|-------|---------------|
| MIME type validation | `req.file.mimetype.startsWith("video/")` for videos, `image/` for thumbnails |
| File size limit | Multer `limits.fileSize` per route (see route files) |
| No disk I/O | `memoryStorage()` — files never touch disk, streamed directly to Cloudinary |
| Multer error handling | `error.middleware.js` catches `MulterError` — returns 413 for oversized files |

---

## 9. Error Information Leakage Prevention

`error.middleware.js` is the global error handler (last middleware in `app.js`). It:
- Logs full stack traces to server console (`console.error`)
- Returns **generic, safe messages** to the client for 500-level errors
- Never exposes raw stack traces, Mongoose internals, or file paths in responses
- Maps known error types (ValidationError, 11000 duplicate key, Joi errors) to appropriate HTTP codes

---

## 10. Environment Variable Guard (Startup)

`server.js` runs `validateEnvironment()` before connecting to MongoDB. If any of the 10 required variables are missing:
1. The missing variable **name** is logged (not its value)
2. `process.exit(1)` is called immediately
3. The server **never starts** in a degraded / insecure state

This prevents accidental deployment with missing credentials that would cause runtime failures deep in request handling.
