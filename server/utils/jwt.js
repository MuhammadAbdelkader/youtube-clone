const jwt = require("jsonwebtoken");

/**
 * Generate a short-lived access token (15 minutes).
 * Returned in the response payload — stored in memory/localStorage by the client.
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

/**
 * Generate a long-lived refresh token (7 days).
 * Stored in a secure HttpOnly SameSite=Strict cookie.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Verify a token against a given secret.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

/**
 * Decode a token payload WITHOUT verification.
 * Useful for reading claims from an expired token (e.g. for refresh).
 */
const decodePayload = (token) => {
  return jwt.decode(token);
};

/**
 * Set a secure HttpOnly refresh token cookie on the response.
 */
const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodePayload,
  setRefreshCookie,
};
