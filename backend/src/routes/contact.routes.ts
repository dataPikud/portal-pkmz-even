import { Router } from "express";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const contactRouter = Router();

const ALLOWED_TYPES = ["תקלה", "רעיון", "דיווח", "אחר"] as const;

/** POST /api/contact – שליחת פנייה, auth אופציונלי */
contactRouter.post("/", optionalAuth, async (req, res, next) => {
  try {
    const user = res.locals.user as { id: string } | undefined;
    const { title, description, type, employeeId } = req.body as {
      title: string;
      description: string;
      type: string;
      employeeId: string;
    };

    if (!title?.trim() || !description?.trim() || !type || !employeeId?.trim()) {
      res.status(400).json({ message: "כל השדות הם חובה" });
      return;
    }

    if (!ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
      res.status(400).json({
        message: `סוג פנייה לא תקין. ערכים מותרים: ${ALLOWED_TYPES.join(", ")}`,
      });
      return;
    }

    const request = await prisma.contactRequest.create({
      data: {
        title,
        description,
        type,
        employeeId,
        userId: user?.id,
      },
    });

    res.status(201).json({ data: request });
  } catch (error) {
    next(error);
  }
});

/** GET /api/contact – כל הפניות (admin) */
contactRouter.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = req.query["status"] as string | undefined;

    const requests = await prisma.contactRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { displayName: true, email: true } } },
    });

    res.json({ data: requests });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/contact/:id/status – עדכון סטטוס (admin) */
contactRouter.put(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      const { status } = req.body as { status: string };

      const ALLOWED_STATUSES = ["new", "in_progress", "resolved"];
      if (!ALLOWED_STATUSES.includes(status)) {
        res.status(400).json({ message: "סטטוס לא תקין" });
        return;
      }

      const updated = await prisma.contactRequest.update({
        where: { id },
        data: { status },
      });

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  }
);
