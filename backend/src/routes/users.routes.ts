import { Router } from "express";
import { optionalAuth, requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const usersRouter = Router();

/**
 * GET /api/users/me
 * מחזיר את פרטי המשתמש המחובר, או null אם אין זיהוי
 */
usersRouter.get("/me", optionalAuth, (_req, res) => {
  const user = res.locals.user ?? null;
  res.json({ data: user });
});

/**
 * GET /api/users – רשימת משתמשים (admin בלבד)
 */
usersRouter.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        employeeId: true,
        displayName: true,
        email: true,
        isAdmin: true,
        isContentAdmin: true,
        createdAt: true,
      },
    });
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/:id/roles – עדכון הרשאות משתמש (admin בלבד)
 * body: { isAdmin?: boolean, isContentAdmin?: boolean }
 */
usersRouter.patch(
  "/:id/roles",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params["id"]);
      const { isAdmin, isContentAdmin } = req.body as {
        isAdmin?: boolean;
        isContentAdmin?: boolean;
      };

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(isAdmin !== undefined && { isAdmin }),
          ...(isContentAdmin !== undefined && { isContentAdmin }),
        },
        select: {
          id: true,
          employeeId: true,
          displayName: true,
          email: true,
          isAdmin: true,
          isContentAdmin: true,
        },
      });

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  }
);
