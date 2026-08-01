import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const visitsRouter = Router();

/**
 * POST /api/visits – מזוהה בלבד
 */
visitsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = res.locals.user;
    const { systemId, videoId } = req.body as { systemId?: number; videoId?: number };

    if (!systemId && !videoId) {
      res.status(400).json({ message: "systemId או videoId הוא שדה חובה" });
      return;
    }

    await prisma.userVisit.create({
      data: {
        userId: user.id,
        systemId: systemId ? Number(systemId) : undefined,
        videoId: videoId ? Number(videoId) : undefined,
      },
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/visits/recent – מחזיר [] אם לא מזוהה, 5 אחרונים אם כן
 */
visitsRouter.get("/recent", optionalAuth, async (_req, res, next) => {
  try {
    const user = res.locals.user as { id: string } | undefined;

    if (!user) {
      res.json({ data: [] });
      return;
    }

    const recentVisits = await prisma.userVisit.findMany({
      where: { userId: user.id },
      orderBy: { visitedAt: "desc" },
      include: {
        system: {
          include: { folder: { include: { mainCategory: true } } },
        },
      },
      distinct: ["systemId"],
      take: 5,
    });

    res.json({ data: recentVisits.map((v) => v.system) });
  } catch (error) {
    next(error);
  }
});
