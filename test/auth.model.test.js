const User = require("../server/models/user.model");

describe("User Model Tests", () => {

  // ─── googleId Sparse Index ─────────────────────────────────────────────────
  it("should have googleId configured with sparse: true to prevent E11000 duplicate crashes", () => {
    const googleIdPath = User.schema.path("googleId");
    expect(googleIdPath).toBeDefined();
    expect(googleIdPath.options.sparse).toBe(true);
  });

  it("should have googleId configured with unique: true", () => {
    const googleIdPath = User.schema.path("googleId");
    expect(googleIdPath.options.unique).toBe(true);
  });

  // ─── password_hash select: false ──────────────────────────────────────────
  it("should have password_hash set to select: false so it is never returned by default", () => {
    const passwordPath = User.schema.path("password_hash");
    expect(passwordPath).toBeDefined();
    expect(passwordPath.options.select).toBe(false);
  });

  // ─── avatar_url default ───────────────────────────────────────────────────
  it("should have a non-empty default avatar_url for users without a custom avatar", () => {
    const avatarPath = User.schema.path("avatar_url");
    expect(avatarPath).toBeDefined();
    expect(typeof avatarPath.options.default).toBe("string");
    expect(avatarPath.options.default.length).toBeGreaterThan(0);
  });

  // ─── email lowercase + required ───────────────────────────────────────────
  it("should enforce lowercase: true on the email field", () => {
    const emailPath = User.schema.path("email");
    expect(emailPath).toBeDefined();
    expect(emailPath.options.lowercase).toBe(true);
    expect(emailPath.options.required).toBe(true);
  });

  // ─── username constraints ─────────────────────────────────────────────────
  it("should enforce minlength: 3 and maxlength: 30 on username", () => {
    const usernamePath = User.schema.path("username");
    expect(usernamePath).toBeDefined();
    expect(usernamePath.options.minlength).toBe(3);
    expect(usernamePath.options.maxlength).toBe(30);
  });

  // ─── isEmailVerified default ──────────────────────────────────────────────
  it("should default isEmailVerified to false for new users", () => {
    const verifiedPath = User.schema.path("isEmailVerified");
    expect(verifiedPath).toBeDefined();
    expect(verifiedPath.options.default).toBe(false);
  });

  // ─── timestamps ───────────────────────────────────────────────────────────
  it("should have timestamps enabled (createdAt / updatedAt)", () => {
    expect(User.schema.options.timestamps).toBe(true);
  });
});
