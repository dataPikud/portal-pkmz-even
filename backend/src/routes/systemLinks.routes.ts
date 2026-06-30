import { Router } from "express";
import { listSystemLinks } from "../services/systemLinks.service.js";

export const systemLinksRouter = Router();

systemLinksRouter.get("/", async (_req, res, next) => {
  try {
    const links = await listSystemLinks();
    res.json({ data: links });
  } catch (error) {
    next(error);
  }
});
