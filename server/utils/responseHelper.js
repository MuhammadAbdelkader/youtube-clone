/**
 * ResponseHelper — Standardised JSON response factory.
 * All API responses follow the shape:
 *   { status: "success"|"error", message: string, data?: any, pagination?: any }
 */

const ResponseHelper = {
  /**
   * 200/201 Success
   */
  success(res, message = "Success", data = null, statusCode = 200) {
    const payload = { status: "success", message };
    if (data !== null) payload.data = data;
    return res.status(statusCode).json(payload);
  },

  /**
   * Paginated list response
   */
  paginated(res, data, pagination, message = "Data retrieved") {
    return res.status(200).json({
      status: "success",
      message,
      data,
      pagination,
    });
  },

  /**
   * 404 Not Found
   */
  notFound(res, message = "Resource not found") {
    return res.status(404).json({ status: "error", message });
  },

  /**
   * 4xx/5xx Error
   */
  error(res, message = "An error occurred", statusCode = 400) {
    return res.status(statusCode).json({ status: "error", message });
  },
};

module.exports = ResponseHelper;
