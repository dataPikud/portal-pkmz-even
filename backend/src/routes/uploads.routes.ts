import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { requireAuth, requireContentOrAdmin } from "../middleware/auth.js";
import { videoUpload, thumbnailUpload, VIDEOS_DIR, THUMBNAILS_DIR } from "../lib/upload.js";

export const uploadsRouter = Router();

/**
 * POST /api/uploads/video
 * מעלה קובץ וידאו לשרת.
 * מחזיר: { fileName, mimeType, fileSize }
 * הרשאה: isAdmin OR isContentAdmin
 */
uploadsRouter.post(
  "/video",
  requireAuth,
  requireContentOrAdmin,
  (req, res, next) => {
    videoUpload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ message: err instanceof Error ? err.message : "שגיאה בהעלאת הקובץ" });
        return;
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ message: "לא נשלח קובץ" });
      return;
    }
    res.status(201).json({
      data: {
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });
  }
);

/**
 * POST /api/uploads/thumbnail
 * מעלה תמונת thumbnail.
 * מחזיר: { fileName }
 * הרשאה: isAdmin OR isContentAdmin
 */
uploadsRouter.post(
  "/thumbnail",
  requireAuth,
  requireContentOrAdmin,
  (req, res, next) => {
    thumbnailUpload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ message: err instanceof Error ? err.message : "שגיאה בהעלאת התמונה" });
        return;
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ message: "לא נשלחה תמונה" });
      return;
    }
    res.status(201).json({
      data: {
        fileName: req.file.filename,
      },
    });
  }
);

/**
 * DELETE /api/uploads/video/:fileName
 * מוחק קובץ וידאו מהדיסק.
 * הרשאה: isAdmin OR isContentAdmin
 */
uploadsRouter.delete(
  "/video/:fileName",
  requireAuth,
  requireContentOrAdmin,
  async (req, res, next) => {
    try {
      const { fileName } = req.params;
      // Security: strip any path traversal
      const safeName = path.basename(String(fileName));
      const filePath = path.join(VIDEOS_DIR, safeName);
      await fs.unlink(filePath).catch(() => { /* file may not exist – ignore */ });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/uploads/thumbnail/:fileName
 * מוחק קובץ thumbnail מהדיסק.
 * הרשאה: isAdmin OR isContentAdmin
 */
uploadsRouter.delete(
  "/thumbnail/:fileName",
  requireAuth,
  requireContentOrAdmin,
  async (req, res, next) => {
    try {
      const { fileName } = req.params;
      const safeName = path.basename(String(fileName));
      const filePath = path.join(THUMBNAILS_DIR, safeName);
      await fs.unlink(filePath).catch(() => { /* ignore */ });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
