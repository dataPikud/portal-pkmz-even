import { prisma } from "../lib/prisma.js";

const fallbackLinks = [
  {
    id: 1,
    name: "Help Desk",
    description: "Open support tickets and track requests.",
    url: "https://example.com/help-desk",
    category: "Operations",
  },
  {
    id: 2,
    name: "HR Portal",
    description: "Benefits, time off, and employee services.",
    url: "https://example.com/hr",
    category: "People",
  },
  {
    id: 3,
    name: "Knowledge Base",
    description: "Policies, procedures, and internal guides.",
    url: "https://example.com/kb",
    category: "Knowledge",
  },
];

export const listSystemLinks = async () => {
  try {
    return await prisma.systemLink.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: true },
    });
  } catch {
    return fallbackLinks;
  }
};
