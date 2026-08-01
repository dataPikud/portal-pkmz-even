import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const mainCategoriesRouter = Router();

/** GET /api/main-categories – ציבורי */
mainCategoriesRouter.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.mainCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        folders: {
          where: { isActive: true, parentId: null },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { systems: true, videos: true, children: true } },
          },
        },
      },
    });
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

/** GET /api/main-categories/:id – ציבורי, עם תיקיות שורש ואייטמים */
mainCategoriesRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        folders: {
          where: { isActive: true, parentId: null },
          orderBy: { sortOrder: "asc" },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
            systems: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
            videos: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
            _count: { select: { systems: true, videos: true, children: true } },
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({ message: "קטגוריה לא נמצאה" });
      return;
    }

    res.json({ data: category });
  } catch (error) {
    next(error);
  }
});

/** POST – admin בלבד */
mainCategoriesRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { name, description, icon, color, sortOrder } = req.body as {
        name: string;
        description?: string;
        icon?: string;
        color?: string;
        sortOrder?: number;
      };

      if (!name?.trim()) {
        res.status(400).json({ message: "שם קטגוריה הוא שדה חובה" });
        return;
      }

      const category = await prisma.mainCategory.create({
        data: { name, description, icon, color, sortOrder: sortOrder ?? 0 },
      });
      res.status(201).json({ data: category });
    } catch (error) {
      next(error);
    }
  }
);

/** PUT – admin בלבד */
mainCategoriesRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      const { name, description, icon, color, sortOrder, isActive } =
        req.body as {
          name?: string;
          description?: string;
          icon?: string;
          color?: string;
          sortOrder?: number;
          isActive?: boolean;
        };

      const category = await prisma.mainCategory.update({
        where: { id },
        data: { name, description, icon, color, sortOrder, isActive },
      });
      res.json({ data: category });
    } catch (error) {
      next(error);
    }
  }
);

/** DELETE – admin בלבד */
mainCategoriesRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      await prisma.mainCategory.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
