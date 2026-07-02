import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const systemsRouter = Router();

/** GET /api/systems/search?q=... – ציבורי */
systemsRouter.get("/search", async (req, res, next) => {
  try {
    const q = (req.query["q"] as string | undefined)?.trim() ?? "";

    if (!q) {
      res.json({ data: [] });
      return;
    }

    const results = await prisma.system.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      orderBy: { sortOrder: "asc" },
      include: { subCategory: { include: { mainCategory: true } } },
      take: 20,
    });

    res.json({ data: results });
  } catch (error) {
    next(error);
  }
});

/** GET /api/systems – ציבורי */
systemsRouter.get("/", async (_req, res, next) => {
  try {
    const systems = await prisma.system.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { subCategory: { include: { mainCategory: true } } },
    });
    res.json({ data: systems });
  } catch (error) {
    next(error);
  }
});

/** GET /api/systems/:id – ציבורי */
systemsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const system = await prisma.system.findUnique({
      where: { id },
      include: { subCategory: { include: { mainCategory: true } } },
    });

    if (!system) {
      res.status(404).json({ message: "מערכת לא נמצאה" });
      return;
    }

    res.json({ data: system });
  } catch (error) {
    next(error);
  }
});

/** POST – admin בלבד */
systemsRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, url, imageUrl, sortOrder, subCategoryId } =
      req.body as {
        name: string;
        description?: string;
        url: string;
        imageUrl?: string;
        sortOrder?: number;
        subCategoryId?: number;
      };

    if (!name?.trim() || !url?.trim()) {
      res.status(400).json({ message: "שם וכתובת URL הם שדות חובה" });
      return;
    }

    const system = await prisma.system.create({
      data: { name, description, url, imageUrl, sortOrder: sortOrder ?? 0, subCategoryId },
    });
    res.status(201).json({ data: system });
  } catch (error) {
    next(error);
  }
});

/** PUT – admin בלבד */
systemsRouter.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const { name, description, url, imageUrl, sortOrder, subCategoryId, isActive } =
      req.body as {
        name?: string;
        description?: string;
        url?: string;
        imageUrl?: string;
        sortOrder?: number;
        subCategoryId?: number;
        isActive?: boolean;
      };

    const system = await prisma.system.update({
      where: { id },
      data: { name, description, url, imageUrl, sortOrder, subCategoryId, isActive },
    });
    res.json({ data: system });
  } catch (error) {
    next(error);
  }
});

/** DELETE – admin בלבד */
systemsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    await prisma.system.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
