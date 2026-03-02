const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ duration: e.duration, query: e.query }, 'Prisma query');
  });
}

prisma.$on('warn', (e) => {
  logger.warn(e.message, 'Prisma warning');
});

prisma.$on('error', (e) => {
  logger.error(e.message, 'Prisma error');
});

module.exports = prisma;
