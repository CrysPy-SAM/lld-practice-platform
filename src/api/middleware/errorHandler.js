/**
 * Centralized error-handling middleware.
 * Catches errors thrown in route handlers and returns consistent JSON responses.
 */
function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error]', err.message, {
      url: req.url,
      method: req.method,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { errorHandler, notFoundHandler };
