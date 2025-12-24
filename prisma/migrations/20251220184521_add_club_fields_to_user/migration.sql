-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clubId" TEXT NOT NULL DEFAULT 'default-club-001',
ADD COLUMN     "clubName" TEXT NOT NULL DEFAULT 'ShuttleMentor Academy';

-- CreateIndex
CREATE INDEX "User_clubId_idx" ON "User"("clubId");
