/*
  Warnings:

  - You are about to alter the column `bio` on the `CoachProfile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `experience` on the `CoachProfile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.

*/
-- AlterTable
ALTER TABLE "CoachProfile" ALTER COLUMN "bio" SET DATA TYPE VARCHAR(300),
ALTER COLUMN "experience" SET DATA TYPE VARCHAR(1000);
