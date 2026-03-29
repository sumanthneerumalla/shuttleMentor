/*
  Warnings:

  - Made the column `timeZone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "timeZone" SET NOT NULL,
ALTER COLUMN "timeZone" SET DEFAULT 'America/New_York';
