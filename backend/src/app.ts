import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { mainCategoriesRouter } from "./routes/mainCategories.routes.js";
import { subCategoriesRouter } from "./routes/subCategories.routes.js";
import { systemsRouter } from "./routes/systems.routes.js";
import { visitsRouter } from "./routes/visits.routes.js";
import { contactRouter } from "./routes/contact.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use("/health", healthRouter);
app.use("/api/users", usersRouter);
app.use("/api/main-categories", mainCategoriesRouter);
app.use("/api/sub-categories", subCategoriesRouter);
app.use("/api/systems", systemsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/contact", contactRouter);

app.use(errorHandler);
