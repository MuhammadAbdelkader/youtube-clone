# YouCube v2.0 — Full API Specification

**Base URL:** `http://localhost:3000/api` (development) | `https://your-domain.com/api` (production)  
**Auth:** All protected routes require `Authorization: Bearer <accessToken>` header.  
**Content-Type:** `application/json` unless uploading files (multipart/form-data via Multer).

---

## 1. Authentication (`/api/auth`)

> Rate-limited to **20 requests / 15 minutes** per IP on all auth endpoints.

### `POST /api/auth/register` — Step 1 of 2
Initiates registration. Creates an unverified user and sends a 6-digit OTP via email (Resend).

**Request Body:**
```json
{ "username": "johndoe", "email": "john@example.com", "password": "SecurePass1!" }
```
*Validation: username 3–30 chars (alphanumeric + `_`), valid email, password ≥8 chars with uppercase + digit + special character.*

**Responses:**

| Status | Body |
|--------|------|
| 202 | `{ "status": "success", "message": "Account created. Check your email...", "email": "john@example.com" }` |
| 409 | `{ "status": "error", "message": "Email already in use" \| "Username already taken" }` |
| 400 | `{ "status": "fail", "errors": ["Email must be valid", ...] }` |

---

### `POST /api/auth/verify-email` — Step 2 of 2
Verifies the 6-digit OTP (stored in Redis with 5-minute TTL). Issues tokens on success.

**Request Body:**
```json
{ "email": "john@example.com", "otp": "123456" }
```

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "accessToken": "...", "user": { "id": "...", "username": "...", "email": "...", "avatar_url": "...", "isEmailVerified": true } }` + `Set-Cookie: refreshToken=...; HttpOnly; SameSite=Strict` |
| 400 | `{ "status": "error", "message": "Invalid or expired verification code." }` |
| 404 | `{ "status": "error", "message": "User not found." }` |

---

### `POST /api/auth/resend-verification`
Re-issues a fresh 6-digit OTP for unverified accounts.

**Request Body:**
```json
{ "email": "john@example.com" }
```

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "message": "Verification code resent." }` |
| 400 | `{ "status": "error", "message": "Email is already verified." }` |
| 404 | `{ "status": "error", "message": "User not found." }` |

---

### `POST /api/auth/login`
Authenticates a verified user with email + password.

**Request Body:**
```json
{ "email": "john@example.com", "password": "SecurePass1!" }
```

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "accessToken": "...", "user": { ... } }` + `Set-Cookie: refreshToken` |
| 401 | `{ "status": "error", "message": "Invalid credentials." }` |
| 403 | `{ "status": "error", "message": "Please verify your email before logging in.", "code": "EMAIL_NOT_VERIFIED", "email": "..." }` |
| 400 | `{ "status": "error", "message": "This account uses Google Sign-In. Please continue with Google." }` |

---

### `POST /api/auth/google`
Authenticates or registers via Google ID token (Google One Tap / OAuth2).

**Request Body:**
```json
{ "credential": "<google-id-token>" }
```

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "accessToken": "...", "user": { ... } }` |
| 400 | `{ "status": "error", "message": "Google credential is required." }` |
| 401 | `{ "status": "error", "message": "Invalid or expired Google token." }` |

---

### `POST /api/auth/refresh`
Issues a new 15-minute access token using the HttpOnly refresh token cookie.

**Request:** No body. Sends `Cookie: refreshToken=...` automatically.

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "accessToken": "..." }` |
| 401 | `{ "status": "error", "message": "Session expired. Please log in again.", "code": "REFRESH_EXPIRED" }` |
| 401 | `{ "status": "error", "message": "Refresh token missing.", "code": "NO_REFRESH_TOKEN" }` |

---

### `POST /api/auth/logout`
Clears the HttpOnly refresh cookie.

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "message": "Logged out successfully." }` |

---

### `GET /api/auth/me` 🔒
Returns the currently authenticated user's profile.

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "data": { "id": "...", "username": "...", "email": "...", "avatar_url": "...", "isEmailVerified": true, "createdAt": "..." } }` |
| 401 | `{ "status": "error", "message": "Authentication required." }` |
| 404 | `{ "status": "error", "message": "User not found." }` |

---

### `PATCH /api/auth/update-profile` 🔒
Updates username, email, password, or avatar. Accepts `multipart/form-data` for file upload.

**Request:** `multipart/form-data` OR `application/json`
```json
{ "username": "newname", "email": "new@example.com", "password": "NewPass1!" }
```
File field: `avatar` (image/* only, max 5MB).

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "message": "Profile updated.", "user": { ... } }` |
| 404 | `{ "status": "error", "message": "User not found." }` |

---

### `POST /api/auth/forgot-password`
Sends a 6-digit OTP reset code (5-minute TTL). Returns 200 always to prevent email enumeration.

**Request Body:**
```json
{ "email": "john@example.com" }
```

**Response (always 200):**
```json
{ "status": "success", "message": "If an account with that email exists, a reset code has been sent." }
```

---

### `POST /api/auth/reset-password`
Validates OTP and sets a new password.

**Request Body:**
```json
{ "email": "john@example.com", "otp": "654321", "password": "NewSecurePass1!" }
```

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ "status": "success", "message": "Password reset successfully." }` |
| 400 | `{ "status": "error", "message": "Invalid or expired reset code." }` |
| 404 | `{ "status": "error", "message": "User not found." }` |

---

## 2. Videos (`/api/videos`)

> Upload endpoint rate-limited to **15 requests / hour** per IP.

### `POST /api/videos/upload` 🔒
Upload a video + thumbnail + metadata. Streams directly to Cloudinary.

**Request:** `multipart/form-data`
- `video` (file) — required, video/* only
- `thumbnail` (file) — optional, image/*
- `title` (string) — required
- `description` (string) — optional
- `category` (string) — required
- `tags` (string) — comma-separated
- `language` (string) — default "en"
- `isPublic` (boolean) — default true

**Responses:**

| Status | Body |
|--------|------|
| 201 | `{ "status": "success", "message": "Video uploaded successfully.", "data": { video object with aiSummary & aiTags } }` |
| 400 | `{ "status": "error", "message": "Video file is required" }` |
| 403 | `{ "status": "error", "message": "You need a channel to upload videos." }` |

---

### `GET /api/videos` — Feed
Returns paginated public videos. Results cached in Redis (5 min TTL). Cache invalidated on any upload/edit/delete.

**Query Params:** `page`, `limit`, `category`, `language`

**Response (200):**
```json
{ "status": "success", "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }, "fromCache": false }
```

---

### `GET /api/videos/:id` — Video Detail
Returns a single video and increments its view count.

**Response (200):**
```json
{ "status": "success", "data": { "video": { ... }, "likesCount": 42, "isLiked": false } }
```

---

### `PATCH /api/videos/:id` 🔒
Update title, description, tags, thumbnail, or visibility. Channel owner only.

---

### `DELETE /api/videos/:id` 🔒
Deletes video and thumbnail from Cloudinary. Channel owner only.

---

### `GET /api/videos/trending`
Returns top 10 videos by view count + like ratio. Cached 10 minutes.

---

### `GET /api/videos/search`
Full-text search on title and description.

**Query Params:** `q` (search query), `page`, `limit`

---

## 3. Channels (`/api/channels`)

### `POST /api/channels` 🔒
Creates a channel for the authenticated user (one channel per user enforced).

**Request Body:**
```json
{ "title": "My Channel", "description": "About my channel", "handle": "@mychannel" }
```

---

### `GET /api/channels/:id`
Public channel profile with subscriber count and video list.

---

### `PATCH /api/channels/:id` 🔒
Update channel title, description, or banner. Channel owner only.

---

### `GET /api/channels/my` 🔒
Returns the authenticated user's own channel.

---

## 4. Likes (`/api/likes`)

### `POST /api/likes/videos/:videoId/toggle` 🔒
Toggles like/unlike on a video.

**Response (200):**
```json
{ "status": "success", "data": { "liked": true, "likesCount": 43 } }
```

---

## 5. Comments (`/api/comments`)

### `POST /api/comments/videos/:videoId` 🔒
Post a comment on a video.

### `GET /api/comments/videos/:videoId`
Get paginated comments for a video (newest first).

### `DELETE /api/comments/:id` 🔒
Delete own comment.

---

## 6. Subscriptions (`/api/subscriptions`)

### `POST /api/subscriptions/:channelId/toggle` 🔒
Subscribe or unsubscribe. Updates denormalized `subscribersCount` on Channel. Invalidates Redis cache.

### `GET /api/subscriptions/:channelId/status` 🔒
Returns `{ "subscribed": true|false }`.

### `GET /api/subscriptions/me` 🔒
Returns paginated list of channels the user subscribes to. First-page results cached 5 minutes.

### `GET /api/subscriptions/feed` 🔒
Returns videos from subscribed channels, newest first.

### `GET /api/subscriptions/:channelId/subscribers` 🔒
Returns subscriber list (channel owner only).

---

## 7. Watch History (`/api/watch-history`)

### `POST /api/watch-history` 🔒
Records a video view for the authenticated user.

### `GET /api/watch-history` 🔒
Returns paginated watch history (newest first).

### `DELETE /api/watch-history/:videoId` 🔒
Removes a single video from history.

### `DELETE /api/watch-history` 🔒
Clears all watch history.

---

## 8. Recommendations (`/api/recommendations`)

### `GET /api/recommendations/:videoId`
Returns 8 similar videos based on category and tags (excluding the current video).

---

## 9. Health Check

### `GET /health`
Server and Redis connectivity status. Not rate-limited.

**Response (200):**
```json
{ "status": "ok", "uptime": 1234.56, "timestamp": "2026-07-06T06:00:00.000Z", "redis": "connected" }
```

---

## Error Response Schema

All error responses follow this consistent structure:

```json
{
  "status": "error" | "fail",
  "message": "Human-readable description",
  "code": "MACHINE_READABLE_CODE"  // optional, only on specific errors
}
```

| `status` | Meaning |
|----------|---------|
| `"error"` | Server error or auth failure |
| `"fail"` | Client validation failure (Joi) |

---

## Token Lifecycle

```
Register/Login/Google → accessToken (15m, memory) + refreshToken (7d, HttpOnly cookie)
                              ↓ expires
                        POST /api/auth/refresh → new accessToken
                              ↓ cookie expires
                        POST /api/auth/login (re-authenticate)
```
