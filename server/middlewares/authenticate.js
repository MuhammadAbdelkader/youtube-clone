const User = require("../models/user.model");
const { verifyToken } = require("../utils/jwt");
const ResponseHelper = require("../utils/responseHelper");

const authenticate = async (req, res, next) => {
    try {
        let token = req.headers.authorization || req.headers.token;
        
        // Handle Bearer token format
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }
        
        if (!token) {
            return ResponseHelper.unauthorized(res, "Authentication token required");
        }

        const payload = verifyToken(token, process.env.JWT_ACCESS_SECRET);
        
        if (!payload) {
            return ResponseHelper.unauthorized(res, "Invalid or expired token");
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            return ResponseHelper.notFound(res, "User not found");
        }

        req.user = payload;
        next();
    } catch (error) {
        return ResponseHelper.unauthorized(res, "Authentication failed");
    }
};

module.exports = authenticate;