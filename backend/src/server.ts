import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';

async function main() {
  const app = createApp();

  // Verify database connectivity but do not crash the process if it is down -
  // the API stays up and returns clear errors, and health can be monitored.
  try {
    await prisma.$connect();
    logger.info('Database connection established');
  } catch (err) {
    logger.error({ err }, 'Could not connect to the database. Check DATABASE_URL (Supabase).');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚜 SAIL API listening on http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close();
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
