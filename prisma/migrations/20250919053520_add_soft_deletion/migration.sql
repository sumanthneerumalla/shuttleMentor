-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VideoLibrary" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Media_isDeleted_idx" ON "Media"("isDeleted");

-- CreateIndex
CREATE INDEX "VideoLibrary_isDeleted_idx" ON "VideoLibrary"("isDeleted");
