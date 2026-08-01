import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const foldersRouter = Router();

/**
 * Helper to build breadcrumbs path array from a given folder ID up to root
 */
async function buildFolderBreadcrumbs(folderId: number): Promise<Array<{ id: number; name: string }>> {
  const path: Array<{ id: number; name: string }> = [];
  let currentId: number | null = folderId;

  while (currentId !== null) {
    const folder: { id: number; name: string; parentId: number | null } | null = await prisma.categoryFolder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true },
    });
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return path;
}

/** GET /api/folders – List folders filterable by mainCategoryId and parentId */
foldersRouter.get("/", async (req, res, next) => {
  try {
    const mainCategoryId = req.query["mainCategoryId"] ? Number(req.query["mainCategoryId"]) : undefined;
    const parentIdQuery = req.query["parentId"];
    const parentId = parentIdQuery === "null" || parentIdQuery === "root"
      ? null
      : parentIdQuery !== undefined
      ? Number(parentIdQuery)
      : undefined;

    const folders = await prisma.categoryFolder.findMany({
      where: {
        isActive: true,
        ...(mainCategoryId !== undefined && { mainCategoryId }),
        ...(parentId !== undefined && { parentId }),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { systems: true, videos: true, children: true },
        },
      },
    });

    res.json({ data: folders });
  } catch (error) {
    next(error);
  }
});

/** GET /api/folders/tree – Returns full hierarchical tree of folders for admin/pickers */
foldersRouter.get("/tree", async (req, res, next) => {
  try {
    const mainCategoryId = req.query["mainCategoryId"] ? Number(req.query["mainCategoryId"]) : undefined;

    const allFolders = await prisma.categoryFolder.findMany({
      where: {
        isActive: true,
        ...(mainCategoryId !== undefined && { mainCategoryId }),
      },
      orderBy: { sortOrder: "asc" },
    });

    // Build hierarchical tree in memory
    const folderMap = new Map<number, any>();
    allFolders.forEach(f => folderMap.set(f.id, { ...f, children: [] }));

    const rootFolders: any[] = [];
    folderMap.forEach(folder => {
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(folder);
      } else {
        rootFolders.push(folder);
      }
    });

    res.json({ data: rootFolders });
  } catch (error) {
    next(error);
  }
});

/** GET /api/folders/:id – Single folder view + breadcrumbs + sub-folders + items */
foldersRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params["id"]);
    const folder = await prisma.categoryFolder.findUnique({
      where: { id },
      include: {
        mainCategory: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: { systems: true, videos: true, children: true },
            },
          },
        },
        systems: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        videos: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!folder) {
      res.status(404).json({ message: "תיקייה לא נמצאה" });
      return;
    }

    const breadcrumbs = await buildFolderBreadcrumbs(id);

    res.json({
      data: {
        ...folder,
        breadcrumbs,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/folders – Create a new folder */
foldersRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { name, description, imageUrl, icon, mainCategoryId, parentId, sortOrder } = req.body as {
        name: string;
        description?: string;
        imageUrl?: string;
        icon?: string;
        mainCategoryId: number;
        parentId?: number | null;
        sortOrder?: number;
      };

      if (!name?.trim() || !mainCategoryId) {
        res.status(400).json({ message: "שם תיקייה וקוד קטגוריה ראשית הם שדות חובה" });
        return;
      }

      const folder = await prisma.categoryFolder.create({
        data: {
          name: name.trim(),
          description: description?.trim() ?? null,
          imageUrl: imageUrl?.trim() ?? null,
          icon: icon?.trim() ?? null,
          mainCategoryId: Number(mainCategoryId),
          parentId: parentId ? Number(parentId) : null,
          sortOrder: sortOrder ?? 0,
        },
        include: {
          mainCategory: true,
          parent: true,
        },
      });

      res.status(201).json({ data: folder });
    } catch (error) {
      next(error);
    }
  }
);

/** PUT /api/folders/:id – Update existing folder */
foldersRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      const { name, description, imageUrl, icon, mainCategoryId, parentId, sortOrder, isActive } = req.body as {
        name?: string;
        description?: string;
        imageUrl?: string;
        icon?: string;
        mainCategoryId?: number;
        parentId?: number | null;
        sortOrder?: number;
        isActive?: boolean;
      };

      // Prevent cyclic parent assignment
      if (parentId === id) {
        res.status(400).json({ message: "תיקייה אינה יכולה להיות תיקיית אב של עצמה" });
        return;
      }

      const folder = await prisma.categoryFolder.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description ? description.trim() : null }),
          ...(imageUrl !== undefined && { imageUrl: imageUrl ? imageUrl.trim() : null }),
          ...(icon !== undefined && { icon: icon ? icon.trim() : null }),
          ...(mainCategoryId !== undefined && { mainCategoryId: Number(mainCategoryId) }),
          ...(parentId !== undefined && { parentId: parentId ? Number(parentId) : null }),
          ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          mainCategory: true,
          parent: true,
        },
      });

      res.json({ data: folder });
    } catch (error) {
      next(error);
    }
  }
);

/** DELETE /api/folders/:id – Delete a folder */
foldersRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      await prisma.categoryFolder.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
