class ResponseHelper {
  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message, statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array ? errors.array() : errors,
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403);
  }

  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409);
  }

  static paginated(res, data, pagination, message = 'Data retrieved successfully') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseHelper;
