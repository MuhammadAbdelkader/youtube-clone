const { verifyToken } = require("../utils/jwt");

/**
 * Authentication middleware.
 * Reads the JWT access token from the standard Authorization header:
 *   Authorization: Bearer <token>
 *
 * On success, attaches { userId } to req.user and calls next().
 * On failure, passes a structured error to next(err) for the global error handler.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required. Provide a Bearer token.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is missing.",
      });
    }

    const payload = verifyToken(token, process.env.JWT_ACCESS_SECRET);

    // Attach minimal user context — avoid extra DB round-trip on every request
    req.user = { userId: payload.userId };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Access token has expired. Please refresh.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      status: "error",
      message: "Invalid access token.",
    });
  }
};

module.exports = authenticate;