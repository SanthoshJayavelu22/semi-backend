/**
 * @desc Centralized error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Specific Error Handling
  let errorResponse = {
    success: false,
    message: err.message || 'Something went wrong! Please try again later.'
  };

  // Mongoose duplicate key error
  if (err.code === 11000) {
    err.statusCode = 400;
    const key = Object.keys(err.keyValue)[0];
    errorResponse.message = `This ${key} is already registered. Please use a different one.`;
    errorResponse.field = key;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    errorResponse.message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    err.statusCode = 404;
    errorResponse.message = `Resource not found with id of ${err.value}`;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    err.statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') errorResponse.message = 'File too large. Max limit is 5MB.';
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    console.error('🔥 Server Error:', err);
  }

  res.status(err.statusCode).json(errorResponse);
};

module.exports = globalErrorHandler;
