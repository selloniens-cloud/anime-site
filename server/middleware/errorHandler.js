const { HTTP_STATUS, ERROR_MESSAGES } = require('../../shared/constants');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Ресурс не найден';
    error = {
      message,
      statusCode: HTTP_STATUS.NOT_FOUND
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Дублирующиеся данные';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    } else if (field === 'username') {
      message = ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;
    }
    
    error = {
      message,
      statusCode: HTTP_STATUS.CONFLICT
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: HTTP_STATUS.BAD_REQUEST
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = ERROR_MESSAGES.INVALID_TOKEN;
    error = {
      message,
      statusCode: HTTP_STATUS.UNAUTHORIZED
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = ERROR_MESSAGES.TOKEN_EXPIRED;
    error = {
      message,
      statusCode: HTTP_STATUS.UNAUTHORIZED
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = ERROR_MESSAGES.FILE_TOO_LARGE;
    error = {
      message,
      statusCode: HTTP_STATUS.BAD_REQUEST
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = ERROR_MESSAGES.INVALID_FILE_TYPE;
    error = {
      message,
      statusCode: HTTP_STATUS.BAD_REQUEST
    };
  }

  // Rate limiting error
  if (err.status === 429) {
    const message = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    error = {
      message,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
    };
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    const message = 'CORS error: Origin not allowed';
    error = {
      message,
      statusCode: HTTP_STATUS.FORBIDDEN
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.SERVER_ERROR;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};

module.exports = errorHandler;