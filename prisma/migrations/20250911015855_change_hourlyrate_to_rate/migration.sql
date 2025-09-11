/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `CoachProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CoachProfile" DROP COLUMN "hourlyRate",
ADD COLUMN     "rate" INTEGER NOT NULL DEFAULT 0;
