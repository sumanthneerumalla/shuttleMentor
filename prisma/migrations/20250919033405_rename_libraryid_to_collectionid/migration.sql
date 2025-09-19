/*
  Warnings:

  - You are about to drop the column `libraryId` on the `Media` table. All the data in the column will be lost.
  - The primary key for the `VideoLibrary` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `libraryId` on the `VideoLibrary` table. All the data in the column will be lost.
  - Added the required column `collectionId` to the `Media` table without a default value. This is not possible if the table is not empty.
  - The required column `collectionId` was added to the `VideoLibrary` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_libraryId_fkey";

-- DropIndex
DROP INDEX "Media_libraryId_idx";

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "libraryId",
ADD COLUMN     "collectionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VideoLibrary" DROP CONSTRAINT "VideoLibrary_pkey",
DROP COLUMN "libraryId",
ADD COLUMN     "collectionId" TEXT NOT NULL,
ADD CONSTRAINT "VideoLibrary_pkey" PRIMARY KEY ("collectionId");

-- CreateIndex
CREATE INDEX "Media_collectionId_idx" ON "Media"("collectionId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "VideoLibrary"("collectionId") ON DELETE CASCADE ON UPDATE CASCADE;
