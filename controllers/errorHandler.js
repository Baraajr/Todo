const { ValidationError, DatabaseError } = require('sequelize');
const AppError = require('../utils/appError');

const environment = process.env.NODE_ENV;

// Function to handle Sequelize validation errors
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map((el) => el.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Function to handle Sequelize database errors
const handleSequelizeDatabaseError = (err) => {
  const message = `Database error: ${err.message}`;
  return new AppError(message, 500);
};

// Function to handle JWT errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// Function to handle JWT expiration errors
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Function to send errors in development environment
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    message: err.message,
    status: err.status,
    error: err,
    stack: err.stack,
  });
};

// Function to send errors in production environment
const sendErrorProd = (err, res) => {
  // Send operational errors to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message,
      status: err.status,
    });
  } else {
    // Log non-operational errors
    if (environment !== 'production') {
      console.error('ERROR 💥', err);
    }

    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = Object.assign(err);

  if (environment === 'development' || environment === 'test') {
    sendErrorDev(err, res);
  } else if (environment === 'production') {
    if (error instanceof ValidationError)
      error = handleSequelizeValidationError(error);
    if (error instanceof DatabaseError)
      error = handleSequelizeDatabaseError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
