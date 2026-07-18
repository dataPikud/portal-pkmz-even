import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * SSO Auth Middleware (stub)
 *
 * מאמת על-ידי header X-Employee-Id.
 * בעתיד יוחלף ב-SAML/OIDC SSO אמיתי.
 * אם המשתמש לא קיים ב-DB – יוצר אותו אוטומטית (JIT provisioning).
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const employeeId = req.headers["x-employee-id"] as string | undefined;

  if (!employeeId) {
    res.status(401).json({ message: "לא מזוהה – נדרשת כניסה ארגונית" });
    return;
  }

  try {
    let user = await prisma.user.findUnique({ where: { employeeId } });

    if (!user) {
      const rawDisplayName = req.headers["x-display-name"] as string | undefined;
      let displayName = employeeId;
      if (rawDisplayName) {
        try {
          displayName = decodeURIComponent(rawDisplayName);
        } catch {
          displayName = rawDisplayName;
        }
      }
      const email =
        (req.headers["x-email"] as string | undefined) ??
        `${employeeId}@org.local`;

      user = await prisma.user.create({
        data: { employeeId, displayName, email },
      });
    }

    res.locals["user"] = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Auth אופציונלי – מנסה לזהות משתמש אם יש header,
 * אבל לא חוסם אם אין. מאפשר תוכן ציבורי עם פרסונליזציה.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const employeeId = req.headers["x-employee-id"] as string | undefined;

  if (!employeeId) {
    next();
    return;
  }

  try {
    let user = await prisma.user.findUnique({ where: { employeeId } });

    if (!user) {
      const rawDisplayName = req.headers["x-display-name"] as string | undefined;
      let displayName = employeeId;
      if (rawDisplayName) {
        try {
          displayName = decodeURIComponent(rawDisplayName);
        } catch {
          displayName = rawDisplayName;
        }
      }
      const email =
        (req.headers["x-email"] as string | undefined) ??
        `${employeeId}@org.local`;

      user = await prisma.user.create({
        data: { employeeId, displayName, email },
      });
    }

    res.locals["user"] = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin guard – לשימוש אחרי requireAuth
 */
export const requireAdmin = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = res.locals["user"] as { isAdmin: boolean } | undefined;

  if (!user?.isAdmin) {
    res.status(403).json({ message: "אין הרשאת ניהול" });
    return;
  }

  next();
};

/**
 * Content Admin guard – לשימוש אחרי requireAuth
 * מאפשר גישה למנהל תוכן (isContentAdmin) בלבד.
 * למנהל מערכת רגיל (isAdmin) אין גישה כאן אוטומטית – השתמש ב-requireContentOrAdmin.
 */
export const requireContentAdmin = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = res.locals["user"] as { isAdmin: boolean; isContentAdmin: boolean } | undefined;

  if (!user?.isContentAdmin) {
    res.status(403).json({ message: "אין הרשאת ניהול חומרי הטמעה" });
    return;
  }

  next();
};

/**
 * Content Or Admin guard – לשימוש אחרי requireAuth
 * מאפשר גישה לכל מי שהוא isAdmin OR isContentAdmin.
 * זהו ה-guard הנכון לנתיבי CRUD של וידאו.
 */
export const requireContentOrAdmin = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = res.locals["user"] as { isAdmin: boolean; isContentAdmin: boolean } | undefined;

  if (!user?.isAdmin && !user?.isContentAdmin) {
    res.status(403).json({ message: "אין הרשאת גישה לניהול תוכן" });
    return;
  }

  next();
};
