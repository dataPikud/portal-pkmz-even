import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const systemsRouter = Router();

/** GET /api/systems/search?q=... – Search systems by query or tag */
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
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      },
      orderBy: { sortOrder: "asc" },
      include: { folder: { include: { mainCategory: true } } },
      take: 20,
    });

    res.json({ data: results });
  } catch (error) {
    next(error);
  }
});

/** GET /api/systems – Public list of systems */
systemsRouter.get("/", async (_req, res, next) => {
  try {
    const systems = await prisma.system.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { folder: { include: { mainCategory: true } } },
    });
    res.json({ data: systems });
  } catch (error) {
    next(error);
  }
});

/** GET /api/systems/:id – Single system */
systemsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const system = await prisma.system.findUnique({
      where: { id },
      include: { folder: { include: { mainCategory: true } } },
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

/** POST /api/systems – Admin only */
systemsRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, url, imageUrl, sortOrder, folderId, tags } =
      req.body as {
        name: string;
        description?: string;
        url: string;
        imageUrl?: string;
        sortOrder?: number;
        folderId?: number | null;
        tags?: string[];
      };

    if (!name?.trim() || !url?.trim()) {
      res.status(400).json({ message: "שם וכתובת URL הם שדות חובה" });
      return;
    }

    const cleanedTags = Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [];

    const system = await prisma.system.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        url: url.trim(),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        sortOrder: sortOrder ?? 0,
        folderId: folderId ? Number(folderId) : null,
        tags: cleanedTags,
      },
      include: { folder: { include: { mainCategory: true } } },
    });
    res.status(201).json({ data: system });
  } catch (error) {
    next(error);
  }
});

/** PUT /api/systems/:id – Admin only */
systemsRouter.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const { name, description, url, imageUrl, sortOrder, folderId, tags, isActive } =
      req.body as {
        name?: string;
        description?: string;
        url?: string;
        imageUrl?: string;
        sortOrder?: number;
        folderId?: number | null;
        tags?: string[];
        isActive?: boolean;
      };

    const cleanedTags = Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : undefined;

    const system = await prisma.system.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(url !== undefined && { url: url.trim() }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? imageUrl.trim() : null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(folderId !== undefined && { folderId: folderId ? Number(folderId) : null }),
        ...(cleanedTags !== undefined && { tags: cleanedTags }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { folder: { include: { mainCategory: true } } },
    });
    res.json({ data: system });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/systems/:id – Admin only */
systemsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    await prisma.system.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
