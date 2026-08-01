import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const analyticsRouter = Router();

/** GET /api/analytics/overview – Smart Usage Statistics & Graph Data (Admin only) */
analyticsRouter.get("/overview", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const totalVisits = await prisma.userVisit.count();
    const totalSystems = await prisma.system.count({ where: { isActive: true } });
    const totalFolders = await prisma.categoryFolder.count({ where: { isActive: true } });
    const totalVideos = await prisma.video.count({ where: { isActive: true } });

    // Top 5 most clicked systems
    const visitsBySystem = await prisma.userVisit.groupBy({
      by: ["systemId"],
      _count: { systemId: true },
      orderBy: { _count: { systemId: "desc" } },
      take: 5,
    });

    const topSystemIds = visitsBySystem
      .map(v => v.systemId)
      .filter((id): id is number => id !== null);

    const topSystemsList = await prisma.system.findMany({
      where: { id: { in: topSystemIds } },
      include: { folder: true },
    });

    const topSystems = visitsBySystem
      .filter(v => v.systemId !== null)
      .map(v => {
        const sys = topSystemsList.find(s => s.id === v.systemId);
        return {
          systemId: v.systemId!,
          name: sys?.name ?? `מערכת #${v.systemId}`,
          folderName: sys?.folder?.name ?? 'שורש',
          clickCount: v._count.systemId,
          percentage: totalVisits > 0 ? Math.round((v._count.systemId / totalVisits) * 100) : 0,
        };
      });

    // Top 5 most active users
    const visitsByUser = await prisma.userVisit.groupBy({
      by: ["userId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });

    const topUserIds = visitsByUser.map(v => v.userId);
    const topUsersList = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, employeeId: true, displayName: true, email: true },
    });

    const topUsers = visitsByUser.map(v => {
      const u = topUsersList.find(usr => usr.id === v.userId);
      return {
        userId: v.userId,
        employeeId: u?.employeeId ?? '---',
        displayName: u?.displayName ?? 'משתמש לא ידוע',
        email: u?.email ?? '',
        clickCount: v._count.userId,
      };
    });

    // 14-day Daily Visit Timeline Graph Data
    const now = new Date();
    const timeline: Array<{ date: string; count: number }> = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayCount = await prisma.userVisit.count({
        where: {
          visitedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      timeline.push({ date: dayLabel, count: dayCount });
    }

    res.json({
      data: {
        totals: {
          visits: totalVisits,
          systems: totalSystems,
          folders: totalFolders,
          videos: totalVideos,
        },
        topSystems,
        topUsers,
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/analytics/system/:id – Detailed click breakdown for a specific system */
analyticsRouter.get("/system/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const systemId = Number(req.params["id"]);
    const system = await prisma.system.findUnique({
      where: { id: systemId },
      include: { folder: { include: { mainCategory: true } } },
    });

    if (!system) {
      res.status(404).json({ message: "מערכת לא נמצאה" });
      return;
    }

    const totalClicks = await prisma.userVisit.count({ where: { systemId } });

    const userClicks = await prisma.userVisit.groupBy({
      by: ["userId"],
      where: { systemId },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
    });

    const userIds = userClicks.map(u => u.userId);
    const usersList = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, employeeId: true, displayName: true, email: true },
    });

    const userBreakdown = userClicks.map(uc => {
      const u = usersList.find(usr => usr.id === uc.userId);
      return {
        userId: uc.userId,
        employeeId: u?.employeeId ?? '---',
        displayName: u?.displayName ?? 'משתמש לא ידוע',
        count: uc._count.userId,
      };
    });

    res.json({
      data: {
        system,
        totalClicks,
        userBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/analytics/reset-visits – Clear mock visits and start fresh for real data (Admin only) */
analyticsRouter.post("/reset-visits", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    await prisma.userVisit.deleteMany();
    res.json({ ok: true, message: "כל נתוני הביקורים נוקו בהצלחה. כעת המערכת תצבור אך ורק קליקים בזמן אמת!" });
  } catch (error) {
    next(error);
  }
});
