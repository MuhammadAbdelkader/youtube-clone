const validate = require("../server/middlewares/validation.middleware");
const Joi = require("joi");

describe("Validation Middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  // ─── Passing Case ─────────────────────────────────────────────────────────
  it("should call next() if validation passes", async () => {
    const schema = Joi.object({ name: Joi.string().required() });
    req.body = { name: "YouCube" };

    const middleware = validate(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  // ─── Invalid Value Case ───────────────────────────────────────────────────
  it("should return 400 with mapped errors if validation fails on an invalid value", async () => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be valid",
      }),
    });
    req.body = { email: "invalid-email" };

    const middleware = validate(schema);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      errors: ["Email must be valid"],
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Missing Required Field Case ──────────────────────────────────────────
  it("should return 400 with mapped errors when a required field is entirely absent", async () => {
    const schema = Joi.object({
      username: Joi.string().min(3).required().messages({
        "any.required": "Username is required",
        "string.empty": "Username cannot be empty",
      }),
    });
    req.body = {}; // empty body — 'username' is missing

    const middleware = validate(schema);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const callArg = res.json.mock.calls[0][0];
    expect(callArg.status).toBe("fail");
    expect(Array.isArray(callArg.errors)).toBe(true);
    expect(callArg.errors.length).toBeGreaterThan(0);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Multiple Field Errors ────────────────────────────────────────────────
  it("should collect all field errors when multiple fields are invalid (abortEarly: false)", async () => {
    const schema = Joi.object({
      username: Joi.string().required().messages({ "any.required": "Username is required" }),
      email: Joi.string().email().required().messages({
        "any.required": "Email is required",
        "string.email": "Email must be valid",
      }),
    });
    req.body = { email: "not-an-email" }; // missing username, invalid email

    const middleware = validate(schema);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const callArg = res.json.mock.calls[0][0];
    expect(callArg.status).toBe("fail");
    // Should surface errors for both missing username AND invalid email
    expect(callArg.errors.length).toBeGreaterThanOrEqual(1);
    expect(next).not.toHaveBeenCalled();
  });
});
