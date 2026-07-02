# YouCube v2.0 - System Architecture

## MEAN Stack Paradigm
YouCube operates on a modern MEAN stack architecture:
- **MongoDB**: Utilizes sparse indexes (e.g. `googleId`) to gracefully handle nullable unique fields across OAuth and standard users.
- **Express**: Centralized routing system.
- **Angular (v18+)**: Signal-based reactivity, standalone components, and Tailwind fluid grid overlays.
- **Node.js**: The core runtime handling API logic and authentication pipelines.

## Security & Validation Interceptors
- **Joi Middleware**: All inbound API payloads are intercepted by a strict Joi validation layer (`server/middlewares/validation.middleware.js`).
  - Validation failures are cleanly mapped into a string array (`errors: []`) rather than leaking raw Node.js or Mongoose exceptions to the client.
- **Resend Sandbox Bypassing**: When deployed in development (or using a Resend free tier), the utility gracefully catches `403` restriction errors, logs the generated OTP directly to the terminal, and resolves with a 200 OK so UI workflows remain unbroken.

## UI Theme Locking
- **Tailwind DOM Bindings**: The light/dark mode engine is bound directly to `document.documentElement.classList.toggle('dark')`. This creates an absolute structural configuration shift, ensuring all nested components inherit the proper variables without contrast degradation.
- **Red & White Pivot**: The core visual identity utilizes `#dc2626` (Red-600) and White SVG markers to build a premium, dynamic streaming aesthetic.
