import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const searchRouter = Router();

/** GET /api/search?q=query&tag=tag – Unified search by query and/or tag */
searchRouter.get("/", async (req, res, next) => {
  try {
    const q = req.query["q"] ? String(req.query["q"]).trim() : "";
    const tag = req.query["tag"] ? String(req.query["tag"]).trim() : "";

    if (!q && !tag) {
      res.json({
        data: {
          systems: [],
          videos: [],
          folders: [],
        },
      });
      return;
    }

    const searchTerm = q || tag;

    // Search Systems by name, description, or tags
    const systems = await prisma.system.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { tags: { has: searchTerm } },
          ...(tag ? [{ tags: { has: tag } }] : []),
        ],
      },
      include: {
        folder: {
          include: {
            mainCategory: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Search Videos by title, description, or tags
    const videos = await prisma.video.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { tags: { has: searchTerm } },
          ...(tag ? [{ tags: { has: tag } }] : []),
        ],
      },
      include: {
        folder: {
          include: {
            mainCategory: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Search Folders by name or description
    const folders = await prisma.categoryFolder.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      include: {
        mainCategory: true,
        _count: {
          select: { systems: true, videos: true, children: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    res.json({
      data: {
        systems,
        videos,
        folders,
        total: systems.length + videos.length + folders.length,
      },
    });
  } catch (error) {
    next(error);
  }
});
