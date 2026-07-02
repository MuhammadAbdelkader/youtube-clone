const { validationResult } = require('express-validator');

/**
 * Dual-mode validation middleware.
 *
 * - If schema is a Joi object (has .validateAsync), runs Joi validation.
 * - If schema is an array (express-validator chain), runs each validator
 *   in sequence then collects errors with validationResult().
 */
const validate = (schema) => {
  // ── express-validator array ────────────────────────────────────────────────
  if (Array.isArray(schema)) {
    return async (req, res, next) => {
      // Run every validator in the chain sequentially
      for (const validator of schema) {
        await validator.run(req);
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'fail',
          errors: errors.array().map((e) => e.msg),
        });
      }
      next();
    };
  }

  // ── Joi schema (has .validateAsync) ──────────────────────────────────────
  return async (req, res, next) => {
    try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (err) {
      if (err.isJoi) {
        return res.status(400).json({
          status: 'fail',
          errors: err.details.map((detail) => detail.message),
        });
      }
      next(err);
    }
  };
};

module.exports = validate;