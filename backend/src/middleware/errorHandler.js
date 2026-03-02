const AppError = require('../lib/AppError');
const logger = require('../logger');

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    logger.warn({ method: req.method, path: req.path, statusCode: err.statusCode }, err.message);
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // Prisma errors
  if (err.code === 'P2025') {
    logger.warn({ method: req.method, path: req.path, prismaCode: err.code }, 'Record not found');
    return res.status(404).json({ error: 'Record not found.' });
  }
  if (err.code === 'P2002') {
    logger.warn({ method: req.method, path: req.path, prismaCode: err.code }, 'Duplicate record');
    return res.status(409).json({ error: 'Duplicate record.' });
  }
  if (err.code === 'P2003') {
    logger.warn(
      { method: req.method, path: req.path, prismaCode: err.code },
      'Referenced record does not exist',
    );
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  // Unexpected errors — log full stack trace
  logger.error({ method: req.method, path: req.path, err }, 'Unexpected error');

  return res.status(500).json({ error: 'An unexpected error occurred.' });
}

module.exports = errorHandler;
