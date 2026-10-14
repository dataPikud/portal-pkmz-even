import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});
const prisma = new PrismaClient({ adapter });

// Same categories and ids as seed.dev.ts: the sidebar links to /category/1, /2 and /3.
// "חומרי הטמעה" is not a category – it is the videos section (/content).
const MAIN_CATEGORIES = [
  { id: 1, name: "דשבורדים", description: "סקירות, נתונים ומדדים", icon: "bar-chart-2", color: "#3b82f6", sortOrder: 1 },
  { id: 2, name: "מערכות תפעול", description: "מערכות ושירותים תפעוליים", icon: "settings", color: "#10b981", sortOrder: 2 },
  { id: 3, name: "אפליקציות ברשת", description: "אפליקציות ושירותים ברשת", icon: "globe", color: "#f59e0b", sortOrder: 3 },
];

// Only adds what is missing. Never updates or deletes, so it is safe to run again.
async function main() {
  console.log("🌱 Seeding production database (adds missing data only)...");

  let created = 0;
  for (const category of MAIN_CATEGORIES) {
    const existing = await prisma.mainCategory.findFirst({
      where: { OR: [{ id: category.id }, { name: category.name }] },
    });
    if (existing) continue;

    await prisma.mainCategory.create({ data: category });
    created++;
  }

  // The ids above are explicit, so move the id sequence past them.
  // Otherwise the first category an admin adds would try to reuse id 1.
  await prisma.$queryRaw`
    SELECT setval(
      pg_get_serial_sequence('"MainCategory"', 'id'),
      (SELECT COALESCE(MAX(id), 1) FROM "MainCategory")
    )
  `;

  console.log(`✅ Main categories: ${created} created, ${MAIN_CATEGORIES.length - created} already existed`);
  console.log("🎉 Production seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
