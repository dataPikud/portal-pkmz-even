import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const notificationsRouter = Router();

/**
 * GET /api/notifications
 * Returns all active system notifications sorted by creation date descending
 */
notificationsRouter.get("/", async (_req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications
 * Creates a new system notification (Admin only)
 */
notificationsRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, message } = req.body as { title: string; message: string };
    if (!title || !message) {
      res.status(400).json({ error: "Title and message are required" });
      return;
    }

    const newNotification = await prisma.notification.create({
      data: {
        title,
        message,
      },
    });

    res.json({ data: newNotification });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notifications/:id
 * Deletes a system notification (Admin only)
 */
notificationsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid notification ID" });
      return;
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});
