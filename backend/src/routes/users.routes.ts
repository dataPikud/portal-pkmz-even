import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";

export const usersRouter = Router();

/**
 * GET /api/users/me
 * מחזיר את פרטי המשתמש המחובר, או null אם אין זיהוי
 */
usersRouter.get("/me", optionalAuth, (_req, res) => {
  const user = res.locals.user ?? null;
  res.json({ data: user });
});
