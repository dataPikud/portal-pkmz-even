import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./lib/logger.js";
import { UPLOADS_ROOT } from "./lib/upload.js";
import { healthRouter } from "./routes/health.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { mainCategoriesRouter } from "./routes/mainCategories.routes.js";
import { subCategoriesRouter } from "./routes/subCategories.routes.js";
import { systemsRouter } from "./routes/systems.routes.js";
import { visitsRouter } from "./routes/visits.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { uploadsRouter } from "./routes/uploads.routes.js";
import { videosRouter } from "./routes/videos.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// Security headers – relaxed for media serving
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    contentSecurityPolicy: false, // CSP handled by frontend build
  })
);

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

// ===== Static file serving for uploaded media =====
// Videos and thumbnails are served at /uploads/<type>/<filename>
app.use(
  "/uploads",
  express.static(UPLOADS_ROOT, {
    maxAge: "7d",           // browser cache 7 days
    immutable: false,
    dotfiles: "deny",       // block .gitkeep etc.
    index: false,           // no directory listing
  })
);

// ===== API routes =====
app.use("/health", healthRouter);
app.use("/api/users", usersRouter);
app.use("/api/main-categories", mainCategoriesRouter);
app.use("/api/sub-categories", subCategoriesRouter);
app.use("/api/systems", systemsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/videos", videosRouter);
app.use("/api/notifications", notificationsRouter);

app.use(errorHandler);

