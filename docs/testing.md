# Testing Documentation

This document describes the testing architecture and suites for the YouCube application.

## Backend Testing (Node.js/Express)

The backend utilizes `jest` and `supertest` for comprehensive integration and unit testing.

### Test Architecture
- **In-Memory Database**: Tests use `mongodb-memory-server` to mock the MongoDB cluster entirely. This ensures no overlapping writes or state corruption in the primary databases.
- **Mocked Services**: External services like `Redis` (via `ioredis-mock`) and `Cloudinary` are mocked to prevent hitting rate limits during CI/CD pipelines.

### Executing Tests
To run the backend test suite, navigate to the `server/` directory:
```bash
npm run test
```

### Coverage
The suite covers critical API endpoints:
- **Authentication**: Validation of JWT issuance, HTTP-only cookie setting, and OTP verification paths.
- **Profile & History**: Ensuring proper CRUD updates for the user profile and strict mutation flows for the user watch history APIs.
- **System Health**: Sanity checks on the Node.js startup pipeline and stream handlers.

## Frontend Testing (Angular)

The Angular frontend relies on Jasmine and Karma for unit testing components, services, and pipes.

### Test Architecture
- **Services**: Services like `Auth`, `VideoService`, and `HistoryService` have `.spec.ts` files testing API request formatting and RxJS subscription flows.
- **Pipes**: The `DurationPipe` tests validate string formatting rules for timestamps.
- **Component DOM**: Core UI behaviors, such as the `NgIf` directives on the `NavbarComponent` reacting to the `currentUser$` stream, and modular behaviors in `VideoMenuComponent`, are validated using Angular's `ComponentFixture`.

### Executing Tests
To run the frontend test suite, navigate to the `client/` directory:
```bash
ng test
```
