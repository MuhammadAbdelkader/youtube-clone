# YouCube — Angular Frontend

Angular 17+ client application for the YouCube video streaming platform. Implements a reactive architecture with a global cascade dark/light theme engine.

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
  - Strict reactive bindings between `AuthService` and components to eliminate UI staleness.
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

### CSS Variables (styles.css)

```css
/* Light Theme (default) */
:root {
  --bg-main:     #f8fafc;
  --bg-surface:  #ffffff;
  --bg-elevated: #f1f5f9;
  --bg-input:    #ffffff;
  --bg-overlay:  #e2e8f0;
  --text-main:   #0f172a;
  --text-muted:  #64748b;
  --border-color: #e2e8f0;
  --brand-primary: #ff6b6b;
}

/* Dark Theme */
body.dark-theme {
  --bg-main:     #0f141c;
  --bg-surface:  #171c26;
  --bg-elevated: #1e2433;
  --bg-input:    #1e2433;
  --bg-overlay:  #252d40;
  --text-main:   #f1f5f9;
  --text-muted:  #94a3b8;
  --border-color: #2d3748;
}
```

All components use these tokens — `background: var(--bg-surface)`, `color: var(--text-main)` — ensuring seamless theme switching without a page reload.

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
│   │   └── video-details/     # Video player + metadata
│   ├── services/
│   │   ├── auth.ts            # Auth service (JWT, Google OAuth, localStorage)
│   │   └── theme.service.ts   # Global theme state management
│   └── app.routes.ts          # Route definitions + guards
│
├── Components/
│   ├── navbar/                # Sticky top bar (theme toggle, user dropdown)
│   └── sidebar/               # Collapsible side nav (toggle preserved)
│
└── styles.css                 # Global design system (CSS custom properties)
```

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
| `uploadVideo()` | Multipart upload with auth header |
| `updateProfile()` | FormData profile patch |

The `UserData` interface:

```typescript
export interface UserData {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  avatar?: string;
  channelId?: string;         // Auto-populated from backend session
  isEmailVerified: boolean;
}
```

---

## 📤 Video Upload — Channel ID Automation

The `CreateVideo` component no longer exposes a "Channel ID" input to the user. Instead:

1. On component init, `this.auth.getCurrentUser()` reads `channelId` from the stored session
2. If `channelId` is available it is silently appended to the `FormData` payload
3. If not present on the client, the backend auto-resolves the channel via `Channel.findOne({ owner: userId })`

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

The frontend connects to the backend at `http://localhost:3000` by default. To change this, update the `apiUrl` in `src/app/services/auth.ts`.
