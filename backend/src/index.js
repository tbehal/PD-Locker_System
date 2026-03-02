const config = require('./config');
const app = require('./app');
const logger = require('./logger');

// For Vercel serverless
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'Scheduler backend listening');
  });
}
