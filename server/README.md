# YouCube — Backend API Reference

Express.js REST API powering the YouCube streaming platform. Built with a clean Model-Router-Controller (MRC) architecture.

---

## ⚙️ Tech Stack & QA Engineering

- **Runtime:** Node.js 18+
- **Framework:** Express.js (Modular Model-Router-Controller Blueprint)
- **Database:** MongoDB Atlas + Mongoose ODM (Strict Schema Validation)
- **Cache:** Upstash Redis (OTP & session TTL management, feed caching)
- **Media:** Cloudinary (Robust `memoryStorage` streaming via Multer to avoid local disk I/O, `resource_type: "auto"` formatting)
- **AI:** Google Gemini API (Asynchronous fire-and-forget background insight generation)
- **Email:** Resend API (OTP delivery, password reset)
- **Auth:** JWT (Access + Refresh Token rotation), Google OAuth 2.0
- **Quality Assurance & Security:** 
  - Dynamic `express-validator` and `Joi` dual-mode validation.
  - Granular `multer` memory limitations aligned perfectly with Express validations (100MB video, 5MB image).
  - Explicit global error sanitization ensuring DB constraints (like `MongoServerError`) are safely masked from the client payload.

---

## 🔧 Environment Variables

Copy `.env.example` and populate the following:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Google Gemini AI
GEMINI_API_KEY=AI...

# Client Origin (CORS)
CLIENT_URL=http://localhost:4200
```

---

## 📡 API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | — | Step 1: Create account, send OTP |
| `POST` | `/verify-email` | — | Step 2: Verify OTP, issue JWT |
| `POST` | `/login` | — | Login with email + password |
| `POST` | `/google` | — | Google OAuth login/register |
| `POST` | `/refresh` | Cookie | Refresh access token |
| `POST` | `/logout` | — | Clear refresh token cookie |
| `GET`  | `/me` | Bearer | Get current authenticated user |
| `PATCH`| `/update-profile` | Bearer | Update user metadata |

### Video Routes (`/api/videos`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/` | — | Get all public videos (paginated) |
| `GET`  | `/search?q=` | — | Full-text video search |
| `GET`  | `/trending` | — | Get trending videos by views |
| `GET`  | `/stream/:id` | — | Increment views + return stream URL |
| `GET`  | `/:id` | — | Get video by ID |
| `POST` | `/upload` | Bearer | Upload video (multipart/form-data) |

### Watch History Routes (`/api/history`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/` | Bearer | Retrieve full watch history for authenticated user |
| `POST` | `/:videoId` | Bearer | Upsert video into watch history with timestamps |
| `DELETE`| `/:videoId` | Bearer | Remove single video from watch history |
| `DELETE`| `/clear` | Bearer | Purge all watch history for authenticated user |

---

## 🔄 Video Upload — Channel Auto-Resolution

The `POST /api/videos/upload` endpoint auto-resolves the uploader's channel:
1. If `channel` is provided in the request body → use it directly
2. If `channel` is missing → query `Channel.findOne({ owner: req.user.userId })` as fallback
3. If no channel exists for the user → return `400` with a clear error message

This eliminates the need for users to manually input their Channel ID on the frontend.

---

## 🛡️ Middleware Stack

```
Request → CORS → Rate Limiter → JSON Parser → Cookie Parser
       → Routes → authenticate (JWT guard) → validate (schema)
       → Controller → Global Error Handler → Response
```

---

## 🗄️ Data Models

| Model | Key Fields |
|-------|-----------|
| `User` | `username`, `email`, `password_hash`, `avatar_url`, `googleId` |
| `Video` | `title`, `description`, `videoUrl`, `channel`, `userId` |
| `Channel` | `title`, `owner`, `avatar`, `videos[]`, `subscribersCount` |
| `WatchHistory` | `user`, `video`, `watchedAt`, `watchDuration` |

---

## 🚀 Run Locally

```bash
npm install
npm run dev    # nodemon with hot reload
npm start      # production mode
```

---

## 🧪 Testing

```bash
npm test       # Jest test suite
```

Test files are located in `__tests__/`. Integration tests use Supertest to fire requests against the Express app.
