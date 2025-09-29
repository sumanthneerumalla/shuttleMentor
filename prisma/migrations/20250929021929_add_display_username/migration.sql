/*
  Warnings:

  - A unique constraint covering the columns `[displayUsername]` on the table `CoachProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayUsername]` on the table `StudentProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "displayUsername" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "displayUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_displayUsername_key" ON "CoachProfile"("displayUsername");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_displayUsername_key" ON "StudentProfile"("displayUsername");
