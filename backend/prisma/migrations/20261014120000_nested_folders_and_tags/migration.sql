-- SubCategory becomes CategoryFolder (nested folders). Prisma's generated diff drops the table
-- and the System.subCategoryId column; this migration renames them instead, so existing rows and
-- links survive. Constraint and sequence names are renamed to what Prisma expects for the new
-- model names, so a later `prisma migrate diff` stays empty.

-- RenameTable
ALTER TABLE "SubCategory" RENAME TO "CategoryFolder";
ALTER TABLE "CategoryFolder" RENAME CONSTRAINT "SubCategory_pkey" TO "CategoryFolder_pkey";
ALTER TABLE "CategoryFolder" RENAME CONSTRAINT "SubCategory_mainCategoryId_fkey" TO "CategoryFolder_mainCategoryId_fkey";
ALTER SEQUENCE "SubCategory_id_seq" RENAME TO "CategoryFolder_id_seq";

-- AlterTable: the new folder columns
ALTER TABLE "CategoryFolder" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "parentId" INTEGER;

-- RenameColumn: System.subCategoryId -> folderId
ALTER TABLE "System" RENAME COLUMN "subCategoryId" TO "folderId";
ALTER TABLE "System" RENAME CONSTRAINT "System_subCategoryId_fkey" TO "System_folderId_fkey";

-- AlterTable: tags on systems and videos, videos in folders
ALTER TABLE "System" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Video" ADD COLUMN     "folderId" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: a visit is now either a system visit or a video visit
ALTER TABLE "UserVisit" ADD COLUMN     "videoId" INTEGER,
ALTER COLUMN "systemId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "CategoryFolder_mainCategoryId_parentId_idx" ON "CategoryFolder"("mainCategoryId", "parentId");

-- AddForeignKey
ALTER TABLE "CategoryFolder" ADD CONSTRAINT "CategoryFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CategoryFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVisit" ADD CONSTRAINT "UserVisit_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "CategoryFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
