import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base uploads directory relative to project root (backend/)
export const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads");
export const VIDEOS_DIR = path.join(UPLOADS_ROOT, "videos");
export const THUMBNAILS_DIR = path.join(UPLOADS_ROOT, "thumbnails");

/** Generates a unique filename: <timestamp>-<random8>.<ext> */
function uniqueFilename(originalname: string): string {
  const ext = path.extname(originalname).toLowerCase();
  const rand = crypto.randomBytes(4).toString("hex");
  return `${Date.now()}-${rand}${ext}`;
}

// ===== Video upload =====
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, VIDEOS_DIR),
  filename: (_req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",   // .avi
  "video/x-matroska",  // .mkv
]);

export const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2 GB
  },
  fileFilter: (_req, file, cb) => {
    if (VIDEO_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`סוג קובץ לא נתמך: ${file.mimetype}. ניתן להעלות רק וידאו.`));
    }
  },
});

// ===== Thumbnail upload =====
const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, THUMBNAILS_DIR),
  filename: (_req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`סוג קובץ לא נתמך: ${file.mimetype}. ניתן להעלות רק תמונות.`));
    }
  },
});
