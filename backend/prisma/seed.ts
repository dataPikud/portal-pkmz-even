import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with 4 Main Categories, Nested Folders, Items, Tags & User Visits...");

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { employeeId: "admin001" },
    update: {},
    create: {
      employeeId: "admin001",
      displayName: "מנהל מערכת",
      email: "admin@org.local",
      isAdmin: true,
    },
  });

  // Demo users
  const user1 = await prisma.user.upsert({
    where: { employeeId: "user001" },
    update: {},
    create: {
      employeeId: "user001",
      displayName: "ישראל ישראלי",
      email: "israel@org.local",
      isAdmin: false,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { employeeId: "user002" },
    update: {},
    create: {
      employeeId: "user002",
      displayName: "דני כהן",
      email: "danny@org.local",
      isAdmin: false,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { employeeId: "user003" },
    update: {},
    create: {
      employeeId: "user003",
      displayName: "רחל לוי",
      email: "rachel@org.local",
      isAdmin: false,
    },
  });

  // Clear existing items
  await prisma.userVisit.deleteMany();
  await prisma.system.deleteMany();
  await prisma.video.deleteMany();
  await prisma.categoryFolder.deleteMany();
  await prisma.mainCategory.deleteMany();
  await prisma.notification.deleteMany();

  // ===== 4 קטגוריות ראשיות (כולל חומרי הטמעה) =====
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
    prisma.mainCategory.create({
      data: {
        id: 4,
        name: "חומרי הטמעה",
        description: "סרטוני הדרכה, נהלים וחומרי לימוד",
        icon: "film",
        color: "#a855f7",
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${cats.length} main categories`);

  // ===== תיקיות היררכיות (Nested Folders) =====
  // Category 1: דשבורדים
  const folderDashMain = await prisma.categoryFolder.create({
    data: { name: "דשבורדים מרכזיים", description: "דשבורדים פיקודיים בזמן אמת", mainCategoryId: 1, sortOrder: 1 }
  });
  const folderDataBases = await prisma.categoryFolder.create({
    data: { name: "בסיסי נתונים ודאטה", description: "ניהול מסדי נתונים ואנליטיקה", mainCategoryId: 1, sortOrder: 2 }
  });
  const folderSQL = await prisma.categoryFolder.create({
    data: { name: "ניהול SQL ושאילתות", description: "מסדי נתונים SQL ושירותי שאילתות", mainCategoryId: 1, parentId: folderDataBases.id, sortOrder: 1 }
  });

  // Category 2: מערכות תפעול
  const folderOpsMain = await prisma.categoryFolder.create({
    data: { name: "מערכות תפעוליות", description: "מערכות תפעול ולוגיסטיקה", mainCategoryId: 2, sortOrder: 1 }
  });

  // Category 3: אפליקציות ברשת
  const folderNetMain = await prisma.categoryFolder.create({
    data: { name: "אפליקציות רשת", description: "שירותי ענן ופורטלים ארגוניים", mainCategoryId: 3, sortOrder: 1 }
  });

  // Category 4: חומרי הטמעה (Video Folders!)
  const folderVideoTablal = await prisma.categoryFolder.create({
    data: { name: "מדריכי תבל\"ל ולוגיסטיקה", description: "הדרכות וידאו לשימוש במערכת תבל\"ל", mainCategoryId: 4, sortOrder: 1 }
  });
  const folderVideoSQL = await prisma.categoryFolder.create({
    data: { name: "הדרכות SQL ודאטה", description: "שיעורי וידאו על מסדי נתונים ושאילתות", mainCategoryId: 4, sortOrder: 2 }
  });
  const folderVideoPortal = await prisma.categoryFolder.create({
    data: { name: "סרטוני פורטל פקמ\"ז", description: "הכרת ממשק הפורטל והיכולות החדשות", mainCategoryId: 4, sortOrder: 3 }
  });

  console.log("✅ Created nested category folders including Content Page folders");

  // ===== מערכות (Systems) =====
  const createdSystems: any[] = [];
  const systemDatas = [
    { name: "דשבורד מבצעים", description: "נתונים מבצעיים ואינטגרטיביים בזמן אמת", url: "https://example.com/ops-dashboard", folderId: folderDashMain.id, tags: ["מבצעים", "נתונים", "שלד"], sortOrder: 1 },
    { name: "דשבורד כוח אדם", description: "סטטיסטיקות כ\"א, מצבות וחתכים ניהוליים", url: "https://example.com/hr-dashboard", folderId: folderDashMain.id, tags: ["כוח אדם", "משאבי אנוש"], sortOrder: 2 },
    { name: "דשבורד מודיעין", description: "ריכוז נתוני איסוף ומטרות פיקודי", url: "https://example.com/intel-dashboard", folderId: folderDashMain.id, tags: ["מודיעין", "מטרות"], sortOrder: 3 },
    
    { name: "מסד נתונים ראשי (SQL Server)", description: "ניהול בסיסי נתונים טבלאיים ושאילתות SQL", url: "https://example.com/sql-admin", folderId: folderSQL.id, tags: ["sql", "database", "דאטה", "תשתיות"], sortOrder: 1 },
    { name: "מערכת אנליטיקת SQL", description: "ניתוח שאילתות וביצועי מסד נתונים", url: "https://example.com/sql-analytics", folderId: folderSQL.id, tags: ["sql", "analytics", "דאטה"], sortOrder: 2 },

    { name: "מערכת תבל\"ל", description: "מערכת תכנון, בקרה ולוגיסטיקה פיקודית", url: "https://example.com/tablal", folderId: folderOpsMain.id, tags: ["לוגיסטיקה", "תכנון", "תבלל"], sortOrder: 1 },
    { name: "מערכת כוח אדם", description: "ניהול משאבי אנוש וסבבי תפקידים", url: "https://example.com/hr-system", folderId: folderOpsMain.id, tags: ["כוח אדם", "משאבי אנוש"], sortOrder: 2 },
    { name: "מערכת לוגיסטיקה", description: "מעקב וניהול שרשרת אספקה ומשלוחים", url: "https://example.com/logistics-system", folderId: folderOpsMain.id, tags: ["לוגיסטיקה", "משלוחים"], sortOrder: 3 },

    { name: "דואר ארגוני", description: "גישה לתיבת הדואר האלקטרוני הארגונית", url: "https://example.com/mail", folderId: folderNetMain.id, tags: ["מייל", "תקשורת"], sortOrder: 1 },
    { name: "פורטל שירות עצמי", description: "מידע אישי, טפסים דיגיטליים ושירותי פרט", url: "https://example.com/self-service", folderId: folderNetMain.id, tags: ["אישי", "טפסים"], sortOrder: 2 },
    { name: "מערכת ישיבות", description: "שירות ישיבות וידאו ושיחות ועידה ברשת", url: "https://example.com/meetings", folderId: folderNetMain.id, tags: ["וידאו", "ישיבות"], sortOrder: 3 },
    { name: "SharePoint", description: "אתרי שיתוף תוכן, מסמכים ומידע צוותי", url: "https://example.com/sharepoint", folderId: folderNetMain.id, tags: ["שיתוף", "מסמכים"], sortOrder: 4 },
  ];

  for (const s of systemDatas) {
    const sys = await prisma.system.create({ data: s });
    createdSystems.push(sys);
  }
  console.log(`✅ Created ${createdSystems.length} systems with folders & tags`);

  // ===== סרטוני הדרכה (Videos) =====
  const videoDatas = [
    { title: "סרטון הדרכה לפורטל פקמ\"ז החדש", description: "הכרת ממשק המשתמש המשודרג, הניווט החדש והפעולות הנפוצות בפורטל.", fileName: "portal-intro.mp4", duration: 135, folderId: folderVideoPortal.id, tags: ["הדרכה", "פורטל"], sortOrder: 1 },
    { title: "מדריך לשימוש במערכת תבל\"ל", description: "שיעור וידאו מפורט על הזנת נתונים, הפקת דוחות ותכנון לוגיסטי במערכת תבל\"ל.", fileName: "tablal-guide.mp4", duration: 324, folderId: folderVideoTablal.id, tags: ["תבלל", "לוגיסטיקה", "הדרכה"], sortOrder: 2 },
    { title: "הסבר מקיף על שאילתות SQL ומסדי נתונים", description: "סרטון הדרכה על חיבור למסד נתונים SQL וכתיבת שאילתות מתקדמות.", fileName: "sql-tutorial.mp4", duration: 240, folderId: folderVideoSQL.id, tags: ["sql", "database", "הדרכה", "דאטה"], sortOrder: 3 },
    { title: "מערכת ישיבות - טיפים וטריקים", description: "כיצד ליצור שיחת ועידה, לשתף מסך ולנהל משתתפים ביעילות.", fileName: "meetings-tips.mp4", duration: 92, folderId: folderVideoPortal.id, tags: ["ישיבות", "וידאו"], sortOrder: 4 },
  ];

  for (const v of videoDatas) {
    await prisma.video.create({ data: v });
  }
  console.log(`✅ Created ${videoDatas.length} training videos with folders & tags`);

  // ===== כניסות משתמשים (User Visits for Analytics Graphs) =====
  const usersList = [adminUser, user1, user2, user3];
  const now = new Date();

  // Generate realistic visit events over the last 14 days
  for (let i = 0; i < 65; i++) {
    const randomUser = usersList[Math.floor(Math.random() * usersList.length)];
    const randomSys = createdSystems[Math.floor(Math.random() * createdSystems.length)];
    const daysAgo = Math.floor(Math.random() * 14);
    const visitDate = new Date(now.getTime() - daysAgo * 86400000 - Math.random() * 3600000 * 8);

    await prisma.userVisit.create({
      data: {
        userId: randomUser.id,
        systemId: randomSys.id,
        visitedAt: visitDate,
      },
    });
  }
  console.log("✅ Created 65 realistic UserVisit log entries for Analytics");

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
