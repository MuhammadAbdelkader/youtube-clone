const { validationResult } = require("express-validator");

const validate = (validations) => {


  return async (req, res, next) => {
    for (let validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(400).json({
      status: "fail",
      errors: errors.array().map((err) => err.msg),
    });
  };
};

module.exports = validate;