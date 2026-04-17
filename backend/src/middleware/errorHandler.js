const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "test") {
    // Keep server logs lightweight but visible during development.
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
