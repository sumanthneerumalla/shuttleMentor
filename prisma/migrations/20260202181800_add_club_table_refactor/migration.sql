/*
  Warnings:

  - You are about to drop the column `clubId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `clubName` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_clubId_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clubId",
DROP COLUMN "clubName",
ADD COLUMN     "clubShortName" TEXT NOT NULL DEFAULT 'default-club-001';

-- CreateTable
CREATE TABLE "Club" (
    "clubShortName" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("clubShortName")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_clubName_key" ON "Club"("clubName");

-- CreateIndex
CREATE INDEX "User_clubShortName_idx" ON "User"("clubShortName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE RESTRICT ON UPDATE CASCADE;
