# YouCube v2.0 — Your Premier Video Streaming Universe

An advanced full-stack video streaming and content management platform engineered using the MEAN stack ecosystem, powered by real-time caching, cloud media infrastructure, and artificial intelligence.

---

## 🛠️ System Architecture Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 17+ (Reactive Architecture, Global Cascade Dark/Light Theme Engine) |
| **Backend** | Node.js + Express.js (Modular Model-Router-Controller Blueprint) |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **Cache** | Upstash Redis (OTP TTL, Session Caching, High-Performance Feed Retrieval) |
| **Media Storage** | Cloudinary API (Video Transcoding, Secure Stream Uploads, Fallback Handling) |
| **AI Layer** | Google Gemini AI (Auto-tagging, Video Summarization) |
| **Email Engine** | Resend API (OTP delivery, Password Reset) |
| **Auth & Security** | JWT Access + Refresh Tokens, Google OAuth 2.0, OWASP Compliant Error Masking |

> **Production Quality Assurance (QA):** This repository has undergone extensive architectural audits. Key production-grade integrations include resilient MIME-type fallback for cross-OS file uploads (Windows `.mp4` / `application/octet-stream`), reactive state management eliminating UI-staleness (BehaviorSubjects), 100% component responsiveness (down to 320px devices), and robust middleware interceptors ensuring backend integrity against malformed payloads.

---

## 📁 Project Structure

```
youtube-clone/
├── client/                     # Angular 17+ Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── Pages/          # Feature pages (Home, Profile, Upload, Auth)
│   │   │   ├── services/       # Auth, Theme, Video services
│   │   │   └── app.routes.ts   # Application routing
│   │   ├── Components/
│   │   │   ├── navbar/         # Global Navbar + Theme Toggle
│   │   │   └── sidebar/        # Collapsible Navigation Sidebar
│   │   └── styles.css          # Global CSS variable design system
│   └── README.md
│
├── server/                     # Express.js Backend
│   ├── controllers/            # Business logic handlers
│   ├── models/                 # Mongoose schemas (User, Video, Channel)
│   ├── routes/                 # Express route definitions
│   ├── middlewares/            # Auth, Validation, Error handling
│   ├── utils/                  # JWT, Cloudinary, Resend, Gemini helpers
│   ├── config/                 # MongoDB & Redis connection
│   ├── validators/             # Joi/Express-validator schemas
│   └── README.md
│
├── CONTRIBUTING.md
├── LICENSE
└── README.md                   # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas URI
- Upstash Redis REST URL + Token
- Cloudinary Account
- Google Cloud Console OAuth Client ID
- Resend API Key
- Google Gemini API Key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/youtube-clone.git
cd youtube-clone

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Fill in your credentials — see server/.env.example for all required keys
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 3000)
cd server && npm run dev

# Terminal 2 — Frontend (port 4200)
cd client && ng serve --open
```

---

## 🎨 Theme System

YouCube v2.0 ships with a **Global Cascade Dark/Light Theme Engine**:

- All colors are defined as CSS custom properties on `:root` and `.dark-theme` in `client/src/styles.css`
- The `ThemeService` toggles the theme class on `document.body`, syncing with `localStorage` for persistence
- All components (Navbar, Sidebar, Cards, Forms) inherit theme styles through the cascade — **zero component-level duplication**

---

## 🤖 AI Pipeline

Video uploads trigger an asynchronous Gemini AI enrichment pipeline:

1. Video metadata is saved to MongoDB immediately
2. A `setImmediate()` fire-and-forget hook calls `generateVideoInsights()`
3. Gemini generates an `aiSummary` and `aiTags` array
4. The video document is updated in the background — no upload blocking

---

## 🔐 Auth Flow

```
Register → OTP via Resend → Verify → JWT issued
Login → Credentials checked → JWT issued
Google OAuth → ID Token verified → Upsert user → JWT issued
Forgot Password → OTP via Resend → Verify → Reset password
```

---

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.
