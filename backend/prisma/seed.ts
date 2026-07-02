import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  await prisma.user.upsert({
    where: { employeeId: "admin001" },
    update: {},
    create: {
      employeeId: "admin001",
      displayName: "מנהל מערכת",
      email: "admin@org.local",
      isAdmin: true,
    },
  });

  // Demo user
  await prisma.user.upsert({
    where: { employeeId: "user001" },
    update: {},
    create: {
      employeeId: "user001",
      displayName: "ישראל ישראלי",
      email: "israel@org.local",
      isAdmin: false,
    },
  });

  // ===== 4 קטגוריות ראשיות =====
  const cats = await Promise.all([
    prisma.mainCategory.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "תפעול ותמיכה",
        description: "מוקדי שירות, ניהול תקלות וכלי תפעול יומיומי",
        icon: "wrench",
        color: "#0f766e",
        sortOrder: 1,
      },
    }),
    prisma.mainCategory.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: "משאבי אנוש",
        description: "שירותי עובדים, חופשות, הטבות וטפסים",
        icon: "users",
        color: "#7c3aed",
        sortOrder: 2,
      },
    }),
    prisma.mainCategory.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: "ידע ומידע",
        description: "נהלים, מסמכים, מדריכים ובסיסי ידע",
        icon: "book-open",
        color: "#b45309",
        sortOrder: 3,
      },
    }),
    prisma.mainCategory.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        name: "עסקים ופיננסים",
        description: "תקציבים, רכש, חשבוניות ודוחות",
        icon: "chart-bar",
        color: "#0369a1",
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${cats.length} main categories`);

  // ===== קטגוריות משנה =====
  const ops1 = await prisma.subCategory.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "מוקד תמיכה",       sortOrder: 1, mainCategoryId: 1 } });
  const ops2 = await prisma.subCategory.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: "ניטור ותשתיות",    sortOrder: 2, mainCategoryId: 1 } });
  const hr1  = await prisma.subCategory.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: "שירותי עובדים",    sortOrder: 1, mainCategoryId: 2 } });
  const hr2  = await prisma.subCategory.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: "גיוס והשמה",       sortOrder: 2, mainCategoryId: 2 } });
  const kb1  = await prisma.subCategory.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: "נהלים ומסמכים",    sortOrder: 1, mainCategoryId: 3 } });
  const biz1 = await prisma.subCategory.upsert({ where: { id: 6 }, update: {}, create: { id: 6, name: "פיננסים",          sortOrder: 1, mainCategoryId: 4 } });
  const biz2 = await prisma.subCategory.upsert({ where: { id: 7 }, update: {}, create: { id: 7, name: "רכש ולוגיסטיקה",  sortOrder: 2, mainCategoryId: 4 } });

  console.log("✅ Created sub-categories");

  // ===== מערכות =====
  const systems = [
    { id:  1, name: "מוקד תמיכה",     description: "פתיחת קריאות שירות ומעקב אחר בקשות",   url: "https://example.com/helpdesk",     subCategoryId: ops1.id, sortOrder: 1 },
    { id:  2, name: "ניהול אירועים",  description: "ניטור ותגובה לאירועי IT",                url: "https://example.com/incidents",    subCategoryId: ops1.id, sortOrder: 2 },
    { id:  3, name: "ניטור שרתים",    description: "לוח בקרה לביצועי תשתית",                url: "https://example.com/monitoring",   subCategoryId: ops2.id, sortOrder: 1 },
    { id:  4, name: "ניהול גישות",    description: "הרשאות, VPN ואבטחת מידע",               url: "https://example.com/access",       subCategoryId: ops2.id, sortOrder: 2 },
    { id:  5, name: "פורטל עובדים",   description: "חופשות, הטבות, תלושי שכר",              url: "https://example.com/hr",           subCategoryId: hr1.id,  sortOrder: 1 },
    { id:  6, name: "לוח זמנים",      description: "שעות עבודה, משמרות ונוכחות",            url: "https://example.com/schedule",     subCategoryId: hr1.id,  sortOrder: 2 },
    { id:  7, name: "מערכת גיוס",     description: "פרסום משרות ומעקב מועמדים",             url: "https://example.com/recruit",      subCategoryId: hr2.id,  sortOrder: 1 },
    { id:  8, name: "מאגר ידע",       description: "נהלים, מדריכים ותהליכי עבודה",          url: "https://example.com/kb",           subCategoryId: kb1.id,  sortOrder: 1 },
    { id:  9, name: "ספריית מסמכים",  description: "חוזים, הסכמים ומסמכים רשמיים",         url: "https://example.com/docs",         subCategoryId: kb1.id,  sortOrder: 2 },
    { id: 10, name: "מערכת כספים",    description: "תקציבים, תשלומים ודוחות כספיים",        url: "https://example.com/finance",      subCategoryId: biz1.id, sortOrder: 1 },
    { id: 11, name: "דוחות BI",       description: "מחוונים ונתוני עסק בזמן אמת",           url: "https://example.com/bi",           subCategoryId: biz1.id, sortOrder: 2 },
    { id: 12, name: "ניהול רכש",      description: "בקשות רכישה ואישורים",                  url: "https://example.com/procurement",  subCategoryId: biz2.id, sortOrder: 1 },
  ];

  for (const s of systems) {
    await prisma.system.upsert({ where: { id: s.id }, update: {}, create: s });
  }

  console.log(`✅ Created ${systems.length} systems`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
