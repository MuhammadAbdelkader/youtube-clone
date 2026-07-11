# Frontend Architecture

This document details the Angular 17+ frontend architecture for the YouCube application.

## State Management

We utilize RxJS streams (`BehaviorSubject`) to maintain reactive application state across components, specifically for the current authenticated user context and dynamic historical tracking.

### Authentication Flow & `currentUser$`
The `Auth` service (`client/src/app/services/auth.ts`) manages the user's canonical identity. 

```typescript
private currentUser = new BehaviorSubject<UserData | null>(this._loadUser());
currentUser$ = this.currentUser.asObservable();
```

Components like the `NavbarComponent` and `ProfileComponent` subscribe directly to this stream to ensure UI components reflect the active user session synchronously.

**Real-Time Profile Updates:**
When a user updates their profile (e.g., changes their avatar), the `updateCurrentUser()` method immediately patches the new data into the `BehaviorSubject`. We append a timestamp to Cloudinary URLs to bust the browser cache, forcing an immediate image refresh everywhere in the UI without a page reload.

## Core Services

- `Auth`: Handles JWT persistence in memory, silent token refreshes via HTTP-only cookies, and RxJS state.
- `HistoryService`: Tracks video consumption, synchronizes watched content with the `/history` backend endpoint, and maintains the `history$` observable stream for real-time dashboard updates.
- `VideoService`: Handles interactions with the `/api/videos` backend, including search, pagination, and API responses.
- `ThemeService`: Manages the `<html data-bs-theme>` attribute for light/dark mode toggling and persists preferences in `localStorage`.

## Modular Components

The architecture isolates reusable UI blocks into strictly-typed standalone components:
- **`app-avatar`**: Calculates intrinsic dimensions and handles responsive bounding containers flawlessly using 100% inheritance.
- **`app-video-menu`**: Encapsulates interactive video operations such as social sharing (Clipboard API) and playlist/history mutations via strict Event propagations.

## Routing & Guards

The application leverages standard Angular Router implementations:
- Unprotected routes: `/explore`, `/main`, `/video-details/:id`, `/channel/:id`
- Protected routes: `/upload`, `/history`, `/subscriptions`, `/profile`
Protected routes are secured using an `AuthGuard` which verifies `authService.isLoggedIn()`.

## Custom Pipes

### `DurationPipe`
Converts raw decimal video durations into standard `MM:SS` (or `HH:MM:SS` if applicable) formats.

### `CloudinaryPipe`
Maps raw video or image Cloudinary URLs through specific transformation parameters (like `c_fill`, `w_250`, etc.) to heavily reduce bandwidth overhead.

## Styling & Theme Application

The styling layer uses custom CSS variables layered atop standard Bootstrap utility classes.
Dark Mode is strictly managed via `.text-muted` and other override layers in `styles.css`.
Fallback UI avatars use deterministic, contrast-safe background colors to ensure high contrast in both themes.
