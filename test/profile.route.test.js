const express = require("express");
const request = require("supertest");

// ─── Mock Resend to prevent "Missing API key" errors during routing ──────────
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn() }
  }))
}));

// ─── Mock authenticate middleware ─────────────────────────────────────────────
jest.mock("../server/middlewares/authenticate", () => {
  return jest.fn((req, res, next) => {
    req.user = { userId: "mocked_user_id_123" };
    next();
  });
});

// ─── Mock User.findById (used by getMe) so no real DB needed ─────────────────
jest.mock("../server/models/user.model", () => ({
  findById: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: "mocked_user_id_123",
      username: "testuser",
      email: "test@example.com",
      avatar_url: "https://example.com/avatar.png",
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    }),
  }),
  findOne: jest.fn().mockResolvedValue(null),
  findOneAndUpdate: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
}));

// ─── Mock Redis client (used by OTP operations) ───────────────────────────────
jest.mock("../server/config/redis", () => ({
  getRedisClient: () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue("PONG"),
  }),
}));

const authRouter = require("../server/routes/auth.routes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

describe("Profile Route Tests", () => {

  // ─── GET /api/auth/me ─────────────────────────────────────────────────────
  it("should return 200 with user data from GET /api/auth/me when authenticated", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer mocked-token");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.username).toBe("testuser");
    expect(res.body.data.email).toBe("test@example.com");
    expect(res.body.data.isEmailVerified).toBe(true);
  });

  // ─── Route Mount Verification ─────────────────────────────────────────────
  it("should return 404 for an unknown route under /api/auth", async () => {
    const res = await request(app)
      .get("/api/auth/nonexistent-route");

    // Express returns 404 for unmatched routes (not 500 — router is working)
    expect(res.statusCode).toBe(404);
  });

  // ─── Logout Route ─────────────────────────────────────────────────────────
  it("should return 200 from POST /api/auth/logout", async () => {
    const res = await request(app)
      .post("/api/auth/logout");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
  });
});
