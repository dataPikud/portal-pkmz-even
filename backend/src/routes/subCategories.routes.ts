import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const subCategoriesRouter = Router();

/** POST /api/sub-categories – יצירה (admin) */
subCategoriesRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { name, description, sortOrder, mainCategoryId } = req.body as {
        name: string;
        description?: string;
        sortOrder?: number;
        mainCategoryId: number;
      };

      if (!name?.trim() || !mainCategoryId) {
        res.status(400).json({ message: "שם ומזהה קטגוריה ראשית הם שדות חובה" });
        return;
      }

      const sub = await prisma.subCategory.create({
        data: { name, description, sortOrder: sortOrder ?? 0, mainCategoryId },
      });
      res.status(201).json({ data: sub });
    } catch (error) {
      next(error);
    }
  }
);

/** PUT /api/sub-categories/:id – עדכון (admin) */
subCategoriesRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      const { name, description, sortOrder, isActive } = req.body as {
        name?: string;
        description?: string;
        sortOrder?: number;
        isActive?: boolean;
      };

      const sub = await prisma.subCategory.update({
        where: { id },
        data: { name, description, sortOrder, isActive },
      });
      res.json({ data: sub });
    } catch (error) {
      next(error);
    }
  }
);

/** DELETE /api/sub-categories/:id – מחיקה (admin) */
subCategoriesRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params["id"]);
      await prisma.subCategory.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
