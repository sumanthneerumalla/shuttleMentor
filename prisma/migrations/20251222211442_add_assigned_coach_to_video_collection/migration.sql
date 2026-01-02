-- AlterTable
ALTER TABLE "VideoCollection" ADD COLUMN     "assignedCoachId" TEXT;

-- CreateIndex
CREATE INDEX "VideoCollection_assignedCoachId_idx" ON "VideoCollection"("assignedCoachId");

-- AddForeignKey
ALTER TABLE "VideoCollection" ADD CONSTRAINT "VideoCollection_assignedCoachId_fkey" FOREIGN KEY ("assignedCoachId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
