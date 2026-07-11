# YouCube — Angular Frontend

Angular 17+ client application for the YouCube video streaming platform. Implements a reactive architecture with a global cascade dark/light theme engine, highly modular UI components, and advanced user state tracking.

---

## ⚙️ Tech Stack & QA Standards

- **Framework:** Angular 17+ (Standalone Components, `@if` / `@for` control flow)
- **HTTP:** Angular `HttpClient` with Interceptors (Token Injection & Error Abstraction)
- **Forms:** Angular Reactive Forms (`FormBuilder`, `FormGroup`, `Validators`)
- **Routing:** Angular Router with lazy loading
- **Styling:** Vanilla CSS with CSS Custom Properties (design token system, 100% responsive down to 320px)
- **Quality Assurance:** 
  - Graceful UI fallbacks (e.g., automated default avatars on 404s).
  - Sanitized form payloads handling Windows OS Edge-cases for file uploads (`application/octet-stream`).
  - Strict reactive bindings between services (`AuthService`, `HistoryService`) and components to eliminate UI staleness.
- **Icons:** Font Awesome 6, Google Material Icons
- **Fonts:** Google Fonts (Inter)

---

## 🎨 Global Theme Engine

The theme system is centralized in `ThemeService` and cascades through the entire application without component-level duplication.

### Architecture

```
ThemeService
  ├── activeTheme$: BehaviorSubject<'light' | 'dark'>
  ├── toggleTheme()
  └── applyTheme() → sets .dark-theme on document.body
                    → persists to localStorage
```

All components use CSS variables mapped to the current theme — e.g., `background: var(--bg-surface)` — ensuring seamless theme switching without a page reload.

---

## 🗂️ Application Structure

```
src/
├── app/
│   ├── Pages/
│   │   ├── home/              # Landing page
│   │   ├── main/              # Video feed
│   │   ├── login/             # Login with Google OAuth + email
│   │   ├── register/          # 2-step registration (email → OTP verify)
│   │   ├── forgot-password/   # Password reset flow
│   │   ├── profile/           # User profile editor (avatar upload)
│   │   ├── create-video/      # Video upload with Gemini AI status
│   │   ├── video-details/     # Video player + metadata
│   │   ├── channel/           # User channel view
│   │   ├── explore/           # Trending and categorized videos
│   │   ├── history/           # User watch history feed
│   │   └── subscriptions/     # Feed of videos from subscribed channels
│   ├── services/
│   │   ├── auth.ts            # Auth service (JWT, Google OAuth, localStorage)
│   │   ├── history.service.ts # Watch history tracking and mutations
│   │   └── theme.service.ts   # Global theme state management
│   └── app.routes.ts          # Route definitions + guards
│
├── components/
│   ├── avatar/                # Scalable, strictly-typed circular profile image UI
│   └── video-menu/            # Reusable three-dots option menu (sharing, history removal)
│
├── Components/
│   ├── navbar/                # Sticky top bar (theme toggle, user dropdown)
│   └── sidebar/               # Collapsible side nav (toggle preserved)
│
└── styles.css                 # Global design system (CSS custom properties)
```

---

## 🛠️ Advanced Component Logic

### Modular Avatar & Menu Systems
The frontend emphasizes reusable UI fragments:
- **`app-avatar`**: Auto-resizes based on strict container boundaries. Fixes CSS layout cascading issues by strictly inheriting 100% dimensions, allowing parent controllers to define spatial layout.
- **`app-video-menu`**: Injects native Clipboard API logic for sharing links. Bound dynamically to video cards across `main`, `explore`, `history`, and `subscriptions` views.

### Watch History Tracking
When navigating to the `/watch` route, `video-details.ts` automatically executes an RxJS flow to record the playback:
1. Verifies the user is authenticated via `AuthService`.
2. Silent-calls `historyService.addToWatchHistory()` without blocking the primary video streaming feed.
3. Automatically maps data to the `/history` feed route, updating the user's dashboard seamlessly.

---

## 🔐 Auth Service

`Auth` (`src/app/services/auth.ts`) manages the complete authentication lifecycle:

| Method | Description |
|--------|-------------|
| `register()` | Step 1 — send OTP |
| `verifyEmail()` | Step 2 — verify OTP, store JWT |
| `login()` | Credentials login, store JWT |
| `googleAuth()` | Google credential exchange |
| `refreshToken()` | Silently refresh access token |
| `logout()` | Clear tokens + redirect |
| `getCurrentUser()` | Sync read from `localStorage` |
| `isLoggedIn()` | Boolean check for route guards |

---

## 🧪 Run & Build

```bash
# Development server with live reload
ng serve --open

# Production build
ng build --configuration production

# Unit tests
ng test
```

---

## 🚀 Environment

The frontend connects to the backend at `http://localhost:3000` by default. To change this, update the `apiUrl` in `src/app/services/auth.ts` or the `environment.ts` configuration.
