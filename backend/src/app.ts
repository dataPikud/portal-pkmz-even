import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.routes.js";
import { systemLinksRouter } from "./routes/systemLinks.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use("/health", healthRouter);
app.use("/api/system-links", systemLinksRouter);

app.use(errorHandler);
