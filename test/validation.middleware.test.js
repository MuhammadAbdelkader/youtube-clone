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

  it("should call next() if validation passes", async () => {
    const schema = Joi.object({ name: Joi.string().required() });
    req.body = { name: "YouCube" };

    const middleware = validate(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 with mapped errors if validation fails", async () => {
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
});
