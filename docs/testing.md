# YouCube v2.0 — Automated Testing

## Test Engine

The project uses **Jest** (v30) for unit and integration tests, alongside **Supertest** for HTTP route assertions. Tests run against the real Mongoose schemas (no DB connection required) and mocked Redis/Resend clients.

---

## Running the Tests

All tests live in `/test` at the project root and are executed from the **project root** directory:

```bash
# From the project root (d:\MEAN Stack Projects\youtube-clone):
npx jest --verbose

# Or using the root package.json script (if added):
npm test

# Run a single test file:
npx jest test/auth.model.test.js --verbose

# Run with coverage report:
npx jest --coverage
```

> **Note:** Do **not** `cd` into `/server` to run tests. The `jest.config.js` at the root is configured with `moduleDirectories` to resolve server's `node_modules` automatically.

---

## Test Suites (5 files)

| File | Suite | Assertions |
|------|-------|-----------|
| `test/auth.model.test.js` | User Model Schema | 5 — sparse index, unique index, default avatar, email validation, password_hash selectability |
| `test/validation.middleware.test.js` | Joi Validation Middleware | 3 — pass-through, mapped errors, missing required field |
| `test/profile.route.test.js` | Auth Route (GET /me) | 2 — mocked auth passes, route is mounted |
| `test/server.health.test.js` | Health Endpoint | 3 — 200 status, uptime field, Redis mock |

---

## Test Configuration (`jest.config.js`)

```js
module.exports = {
  moduleDirectories: ["node_modules", "<rootDir>/server/node_modules"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.js"],
  testTimeout: 10000,
  verbose: true
};
```

- `moduleDirectories`: Allows test files to `require()` server-side packages (e.g., `joi`, `mongoose`) without path gymnastics.
- `testTimeout`: 10 seconds per test — accommodates any async schema initialization.
- `verbose`: Shows individual test names in CI output.

---

## Mocking Strategy

### Resend (Email)
```js
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn() }
  }))
}));
```
Prevents "Missing API key" errors in test environment.

### Authentication Middleware
```js
jest.mock("../server/middlewares/authenticate", () =>
  jest.fn((req, res, next) => {
    req.user = { userId: "mocked_user_id" };
    next();
  })
);
```
Bypasses JWT verification — allows testing route handlers in isolation.

### Redis (for health tests)
```js
jest.mock("../server/config/redis", () => ({
  getRedisClient: () => ({ ping: jest.fn().mockResolvedValue("PONG") })
}));
```

---

## CI Integration

The test suite is designed to run without any external service connections:
- **No MongoDB connection required** — Mongoose schemas are tested in isolation
- **No Redis connection required** — mocked per test file
- **No Resend API key required** — mocked globally
- **No Cloudinary credentials required** — upload endpoints not directly tested (integration tested manually)

Suitable for GitHub Actions, GitLab CI, or any Node.js CI pipeline with `npm install` + `npx jest`.
