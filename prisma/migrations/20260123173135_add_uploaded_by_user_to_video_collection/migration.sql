-- AlterTable
ALTER TABLE "VideoCollection" ADD COLUMN     "uploadedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "VideoCollection_uploadedByUserId_idx" ON "VideoCollection"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "VideoCollection" ADD CONSTRAINT "VideoCollection_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
