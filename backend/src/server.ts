import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.port, () => {
  logger.info(`Portal API listening on port ${env.port}`);
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down portal API");

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
