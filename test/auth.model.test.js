const User = require("../server/models/user.model");

describe("User Model Tests (Sparse Indexing)", () => {
  it("should have googleId configured with sparse: true to prevent E11000 duplicate crashes", () => {
    const googleIdPath = User.schema.path("googleId");
    expect(googleIdPath).toBeDefined();
    expect(googleIdPath.options.sparse).toBe(true);
  });

  it("should have googleId configured with unique: true", () => {
    const googleIdPath = User.schema.path("googleId");
    expect(googleIdPath.options.unique).toBe(true);
  });
});
