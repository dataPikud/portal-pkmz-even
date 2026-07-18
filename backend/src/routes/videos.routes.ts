import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { requireAuth, requireContentOrAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { VIDEOS_DIR, THUMBNAILS_DIR } from "../lib/upload.js";

export const videosRouter = Router();

// ===== helpers =====

/** Safe path.basename to prevent traversal */
function safeName(fileName: string): string {
  return path.basename(fileName);
}

/** Delete a file from disk, silently ignore if not found */
async function removeFile(dir: string, fileName: string | null | undefined) {
  if (!fileName) return;
  await fs.unlink(path.join(dir, safeName(fileName))).catch(() => undefined);
}

// ===== GET /api/videos – ציבורי, רשימת סרטונים פעילים =====
videosRouter.get("/", async (_req, res, next) => {
  try {
    const videos = await prisma.video.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        thumbnailName: true,
        mimeType: true,
        duration: true,
        sortOrder: true,
        createdAt: true,
      },
    });
    res.json({ data: videos });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/videos/all – admin/contentAdmin, כולל לא פעילים =====
videosRouter.get("/all", requireAuth, requireContentOrAdmin, async (_req, res, next) => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    res.json({ data: videos });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/videos/:id – ציבורי =====
videosRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video || !video.isActive) {
      res.status(404).json({ message: "סרטון לא נמצא" });
      return;
    }
    res.json({ data: video });
  } catch (error) {
    next(error);
  }
});

// ===== POST /api/videos – יצירת רשומה לסרטון שהועלה =====
// הקובץ עצמו הועלה קודם דרך POST /api/uploads/video
videosRouter.post("/", requireAuth, requireContentOrAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      fileName,
      thumbnailName,
      mimeType,
      fileSize,
      duration,
      sortOrder,
    } = req.body as {
      title: string;
      description?: string;
      fileName: string;
      thumbnailName?: string;
      mimeType?: string;
      fileSize?: number;
      duration?: number;
      sortOrder?: number;
    };

    if (!title?.trim()) {
      res.status(400).json({ message: "כותרת הסרטון היא שדה חובה" });
      return;
    }
    if (!fileName?.trim()) {
      res.status(400).json({ message: "שם הקובץ הוא שדה חובה" });
      return;
    }

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || undefined,
        fileName: safeName(fileName),
        thumbnailName: thumbnailName ? safeName(thumbnailName) : undefined,
        mimeType: mimeType || undefined,
        // fileSize comes in as number from JSON; store as BigInt
        fileSize: fileSize != null ? BigInt(fileSize) : undefined,
        duration: duration != null ? duration : undefined,
        sortOrder: sortOrder ?? 0,
      },
    });

    // Serialize BigInt for JSON response
    res.status(201).json({
      data: { ...video, fileSize: video.fileSize != null ? Number(video.fileSize) : null },
    });
  } catch (error) {
    next(error);
  }
});

// ===== PUT /api/videos/:id – עדכון מטאדאטה =====
videosRouter.put("/:id", requireAuth, requireContentOrAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const {
      title,
      description,
      thumbnailName,
      duration,
      sortOrder,
      isActive,
    } = req.body as {
      title?: string;
      description?: string;
      thumbnailName?: string | null;
      duration?: number;
      sortOrder?: number;
      isActive?: boolean;
    };

    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "סרטון לא נמצא" });
      return;
    }

    // If thumbnail is being replaced – delete old file from disk
    if (
      thumbnailName !== undefined &&
      existing.thumbnailName &&
      existing.thumbnailName !== thumbnailName
    ) {
      await removeFile(THUMBNAILS_DIR, existing.thumbnailName);
    }

    const updated = await prisma.video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() || null }),
        ...(thumbnailName !== undefined && {
          thumbnailName: thumbnailName ? safeName(thumbnailName) : null,
        }),
        ...(duration !== undefined && { duration }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      data: { ...updated, fileSize: updated.fileSize != null ? Number(updated.fileSize) : null },
    });
  } catch (error) {
    next(error);
  }
});

// ===== DELETE /api/videos/:id – מחיקת רשומה + קבצים מהדיסק =====
videosRouter.delete("/:id", requireAuth, requireContentOrAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);

    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "סרטון לא נמצא" });
      return;
    }

    // Delete DB record first, then files (order matters for consistency)
    await prisma.video.delete({ where: { id } });
    await removeFile(VIDEOS_DIR, existing.fileName);
    await removeFile(THUMBNAILS_DIR, existing.thumbnailName);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
