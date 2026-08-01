import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const subCategoriesRouter = Router();

/** POST /api/sub-categories – יצירת תיקייה/תת-קטגוריה */
subCategoriesRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { name, description, sortOrder, mainCategoryId, parentId } = req.body as {
        name: string;
        description?: string;
        sortOrder?: number;
        mainCategoryId: number;
        parentId?: number | null;
      };

      if (!name?.trim() || !mainCategoryId) {
        res.status(400).json({ message: "שם ומזהה קטגוריה ראשית הם שדות חובה" });
        return;
      }

      const sub = await prisma.categoryFolder.create({
        data: {
          name: name.trim(),
          description: description?.trim() ?? null,
          sortOrder: sortOrder ?? 0,
          mainCategoryId: Number(mainCategoryId),
          parentId: parentId ? Number(parentId) : null,
        },
      });
      res.status(201).json({ data: sub });
    } catch (error) {
      next(error);
    }
  }
);

/** PUT /api/sub-categories/:id – עדכון תיקייה/תת-קטגוריה */
subCategoriesRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      const { name, description, sortOrder, isActive, parentId } = req.body as {
        name?: string;
        description?: string;
        sortOrder?: number;
        isActive?: boolean;
        parentId?: number | null;
      };

      const sub = await prisma.categoryFolder.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description ? description.trim() : null }),
          ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
          ...(isActive !== undefined && { isActive }),
          ...(parentId !== undefined && { parentId: parentId ? Number(parentId) : null }),
        },
      });
      res.json({ data: sub });
    } catch (error) {
      next(error);
    }
  }
);

/** DELETE /api/sub-categories/:id – מחיקת תיקייה/תת-קטגוריה */
subCategoriesRouter.delete(
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
