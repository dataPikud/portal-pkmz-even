import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with new design categories & notifications...");

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

  // Clear existing items to start fresh
  await prisma.system.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.mainCategory.deleteMany();
  await prisma.video.deleteMany();
  await prisma.notification.deleteMany();

  // ===== 3 קטגוריות ראשיות (לפי העיצוב החדש) =====
  const cats = await Promise.all([
    prisma.mainCategory.create({
      data: {
        id: 1,
        name: "דשבורדים",
        description: "סקירות, נתונים ומדדים",
        icon: "bar-chart-2",
        color: "#3b82f6",
        sortOrder: 1,
      },
    }),
    prisma.mainCategory.create({
      data: {
        id: 2,
        name: "מערכות תפעול",
        description: "מערכות ושירותים תפעוליים",
        icon: "settings",
        color: "#10b981",
        sortOrder: 2,
      },
    }),
    prisma.mainCategory.create({
      data: {
        id: 3,
        name: "אפליקציות ברשת",
        description: "אפליקציות ושירותים ברשת",
        icon: "globe",
        color: "#f59e0b",
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${cats.length} main categories`);

  // ===== קטגוריות משנה =====
  const subDash = await prisma.subCategory.create({ data: { id: 1, name: "דשבורדים מרכזיים", sortOrder: 1, mainCategoryId: 1 } });
  const subOps = await prisma.subCategory.create({ data: { id: 2, name: "מערכות תפעוליות", sortOrder: 1, mainCategoryId: 2 } });
  const subNet = await prisma.subCategory.create({ data: { id: 3, name: "אפליקציות רשת", sortOrder: 1, mainCategoryId: 3 } });

  console.log("✅ Created sub-categories");

  // ===== מערכות =====
  const systems = [
    // דשבורדים (Category 1)
    { name: "דשבורד מבצעים", description: "נתונים מבצעיים ואינטגרטיביים בזמן אמת", url: "https://example.com/ops-dashboard", subCategoryId: subDash.id, sortOrder: 1 },
    { name: "דשבורד כוח אדם", description: "סטטיסטיקות כ\"א, מצבות וחתכים ניהוליים", url: "https://example.com/hr-dashboard", subCategoryId: subDash.id, sortOrder: 2 },
    { name: "דשבורד מודיעין", description: "ריכוז נתוני איסוף ומטרות פיקודי", url: "https://example.com/intel-dashboard", subCategoryId: subDash.id, sortOrder: 3 },
    { name: "דשבורד לוגיסטיקה", description: "מצב מלאי, רכש ותנועת שיירות", url: "https://example.com/logistics-dashboard", subCategoryId: subDash.id, sortOrder: 4 },
    { name: "דשבורד אימונים", description: "גרפי התקדמות ומוכנות יחידות", url: "https://example.com/training-dashboard", subCategoryId: subDash.id, sortOrder: 5 },

    // מערכות תפעול (Category 2)
    { name: "מערכת תבל\"ל", description: "מערכת תכנון, בקרה ולוגיסטיקה פיקודית", url: "https://example.com/tablal", subCategoryId: subOps.id, sortOrder: 1 },
    { name: "מערכת כוח אדם", description: "ניהול משאבי אנוש וסבבי תפקידים", url: "https://example.com/hr-system", subCategoryId: subOps.id, sortOrder: 2 },
    { name: "מערכת לוגיסטיקה", description: "מעקב וניהול שרשרת אספקה ומשלוחים", url: "https://example.com/logistics-system", subCategoryId: subOps.id, sortOrder: 3 },
    { name: "מערכת מודיעין", description: "ניהול מטרות ומידע מודיעיני פיקודי", url: "https://example.com/intel-system", subCategoryId: subOps.id, sortOrder: 4 },
    { name: "מערכת אימונים", description: "תכנון, מעקב וניהול אימונים יחידתיים", url: "https://example.com/training-system", subCategoryId: subOps.id, sortOrder: 5 },

    // אפליקציות ברשת (Category 3)
    { name: "דואר ארגוני", description: "גישה לתיבת הדואר האלקטרוני הארגונית", url: "https://example.com/mail", subCategoryId: subNet.id, sortOrder: 1 },
    { name: "פורטל שירות עצמי", description: "מידע אישי, טפסים דיגיטליים ושירותי פרט", url: "https://example.com/self-service", subCategoryId: subNet.id, sortOrder: 2 },
    { name: "מערכת ישיבות", description: "שירות ישיבות וידאו ושיחות ועידה ברשת", url: "https://example.com/meetings", subCategoryId: subNet.id, sortOrder: 3 },
    { name: "SharePoint", description: "אתרי שיתוף תוכן, מסמכים ומידע צוותי", url: "https://example.com/sharepoint", subCategoryId: subNet.id, sortOrder: 4 },
    { name: "מערכת דוחות", description: "מערכת דוחות וניתוח נתונים ארגונית", url: "https://example.com/reports", subCategoryId: subNet.id, sortOrder: 5 },
  ];

  for (const s of systems) {
    await prisma.system.create({ data: s });
  }
  console.log(`✅ Created ${systems.length} systems`);

  // ===== סרטוני הדרכה =====
  const videos = [
    { title: "סרטון הדרכה לפורטל פקמ\"ז החדש", description: "הכרת ממשק המשתמש המשודרג, הניווט החדש והפעולות הנפוצות בפורטל.", fileName: "portal-intro.mp4", duration: 135, sortOrder: 1 },
    { title: "מדריך לשימוש במערכת תבל\"ל", description: "שיעור וידאו מפורט על הזנת נתונים, הפקת דוחות ותכנון לוגיסטי במערכת תבל\"ל.", fileName: "tablal-guide.mp4", duration: 324, sortOrder: 2 },
    { title: "מערכת ישיבות - טיפים וטריקים", description: "כיצד ליצור שיחת ועידה, לשתף מסך ולנהל משתתפים ביעילות.", fileName: "meetings-tips.mp4", duration: 92, sortOrder: 3 },
  ];

  for (const v of videos) {
    await prisma.video.create({ data: v });
  }
  console.log(`✅ Created ${videos.length} training videos`);

  // ===== הודעות מערכת =====
  const notifications = [
    { title: "ברוכים הבאים לפורטל פקמ\"ז המשודרג!", message: "הפורטל שודרג לעיצוב כהה ומודרני הכולל גישה מהירה יותר, מערכת התראות מובנית ותפריט ניווט מהיר." },
    { title: "תחזוקה מתוכננת במערכת תבל\"ל", message: "ביום שלישי הקרוב, ה-21 ביולי, בין השעות 22:00 ל-24:00 תבוצע שדרוג תשתיות במערכת תבל\"ל. הגישה למערכת לא תתאפשר בזמן זה." },
    { title: "סרטוני הדרכה חדשים עלו לאתר", message: "הועלו סרטוני הדרכה חדשים בנושאי תכנון ישיבות וידאו ושימוש מתקדם ב-SharePoint במדור חומרי הטמעה." },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✅ Created ${notifications.length} system notifications`);

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
