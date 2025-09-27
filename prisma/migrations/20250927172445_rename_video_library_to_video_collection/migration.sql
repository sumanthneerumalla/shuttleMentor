/*
  Warnings:

  - You are about to drop the `VideoLibrary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "VideoLibrary" DROP CONSTRAINT "VideoLibrary_userId_fkey";

-- DropTable
DROP TABLE "VideoLibrary";

-- CreateTable
CREATE TABLE "VideoCollection" (
    "collectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCollection_pkey" PRIMARY KEY ("collectionId")
);

-- CreateIndex
CREATE INDEX "VideoCollection_userId_idx" ON "VideoCollection"("userId");

-- CreateIndex
CREATE INDEX "VideoCollection_isDeleted_idx" ON "VideoCollection"("isDeleted");

-- AddForeignKey
ALTER TABLE "VideoCollection" ADD CONSTRAINT "VideoCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "VideoCollection"("collectionId") ON DELETE CASCADE ON UPDATE CASCADE;
