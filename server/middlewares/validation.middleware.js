const { validationResult } = require("express-validator");
const ResponseHelper = require("../utils/responseHelper");

const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        for (let validation of validations) {
            await validation.run(req);
        }

        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return ResponseHelper.validationError(res, errors);
        }

        next();
    };
};

module.exports = validate;
