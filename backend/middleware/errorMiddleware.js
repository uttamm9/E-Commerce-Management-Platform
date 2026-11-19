/**
 * Middleware for handling 404 Not Found routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized error handling middleware.
 * Catches all errors passed via next(error) or thrown in Express handlers.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError' && (err.kind === 'ObjectId' || err.path === '_id')) {
    statusCode = 400;
    message = `Invalid resource identifier format: ${err.value}`;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = value
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists.`
      : `A record with this ${field} already exists.`;
  }

  // Handle Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large. Maximum size is 5MB per image.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Too many images uploaded. Maximum allowed is 5 images.';
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // Handle file filter rejection
  if (err.message && err.message.includes('Invalid file format')) {
    statusCode = 400;
  }

  // Handle JWT invalid signature / malformed token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  // Handle JWT token expiration
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
