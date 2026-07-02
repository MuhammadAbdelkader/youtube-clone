const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  // Only log stack traces internally to console, do not leak them in API response
  console.error(`[Error] ${err.name}: ${err.message}`);

  // ── Multer file-upload errors ───────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    const code = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const msg  = err.code === "LIMIT_FILE_SIZE"
      ? "File is too large. Please check the size limit and try again."
      : `Upload error: ${err.message}`;
    return res.status(code).json({ status: "error", message: msg });
  }

  // Custom file-filter rejection (cb(new Error(...), false))
  if (err.message && (err.message.startsWith("Only") || err.message.includes("file"))) {
    return res.status(400).json({ status: "error", message: err.message });
  }
  
  // Format generic server response to prevent raw parameter leakage
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = "Something went wrong. Please check your inputs and try again.";

  // Handle Mongoose Validation Errors gracefully
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = "Invalid payload provided. Please verify your inputs.";
  }
  
  // Handle MongoDB Duplicate Key Errors
  if (err.code === 11000) {
    statusCode = 409;
    message = "A resource with this data already exists.";
  }

  // Handle explicit Joi Validation Errors which may contain 'isJoi' flag
  if (err.isJoi) {
    statusCode = 400;
    message = "Invalid payload provided. Please verify your inputs.";
  }

  // Allow custom application errors with status codes to pass their specific safe messages
  if ((err.status || err.cause) && (err.status || err.cause) < 500 && err.message) {
    statusCode = err.status || err.cause;
    message = err.message;
  }

  res.status(statusCode).json({
    status: "error",
    success: false,
    message: message
  });
};

module.exports = errorHandler;
