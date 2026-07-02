# YouCube v2.0 - API Specification

## 1. Auth Pipeline
### POST /api/auth/register
- **Payload:** `{ username: "...", email: "...", password: "..." }`
- **Success (202):** `{ status: "success", message: "Account created...", email: "..." }`
- **Validation:** Joi enforces username rules, valid email, and complex passwords.

### POST /api/auth/verify-email
- **Payload:** `{ email: "...", otp: "123456" }`
- **Success (200):** `{ status: "success", accessToken: "...", user: { ... } }`

### POST /api/auth/login
- **Payload:** `{ email: "...", password: "..." }`
- **Success (200):** `{ status: "success", accessToken: "...", user: { ... } }`

### POST /api/auth/forgot-password
- **Payload:** `{ email: "..." }`
- **Success (200):** `{ status: "success", message: "If an account with that email exists..." }`
*(Protects against enumeration attacks while securely sending the OTP)*

### POST /api/auth/reset-password
- **Payload:** `{ email: "...", otp: "123456", password: "..." }`
- **Success (200):** `{ status: "success", message: "Password reset successfully." }`

## 2. Profile Pipeline
### PATCH /api/auth/update-profile
- **Headers:** `Authorization: Bearer <accessToken>`
- **Payload:** `{ username: "newUsername" }` (Supports Multer FormData for avatars).
- **Success (200):** `{ status: "success", data: { username: "newUsername", ... } }`
