/*
  Warnings:

  - The values [SPECIFIC_STUDENTS] on the enum `SharingType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `studentId` on the `CoachCollectionShare` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[collectionId,sharedWithId]` on the table `CoachCollectionShare` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sharedWithId` to the `CoachCollectionShare` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SharingType_new" AS ENUM ('SPECIFIC_USERS', 'ALL_STUDENTS', 'ALL_COACHES');
ALTER TABLE "public"."CoachMediaCollection" ALTER COLUMN "sharingType" DROP DEFAULT;
ALTER TABLE "CoachMediaCollection" ALTER COLUMN "sharingType" TYPE "SharingType_new" USING ("sharingType"::text::"SharingType_new");
ALTER TYPE "SharingType" RENAME TO "SharingType_old";
ALTER TYPE "SharingType_new" RENAME TO "SharingType";
DROP TYPE "public"."SharingType_old";
ALTER TABLE "CoachMediaCollection" ALTER COLUMN "sharingType" SET DEFAULT 'SPECIFIC_USERS';
COMMIT;

-- DropForeignKey
ALTER TABLE "CoachCollectionShare" DROP CONSTRAINT "CoachCollectionShare_studentId_fkey";

-- DropIndex
DROP INDEX "CoachCollectionShare_collectionId_studentId_key";

-- DropIndex
DROP INDEX "CoachCollectionShare_studentId_idx";

-- DropIndex
DROP INDEX "CoachMediaCollection_coachId_isDeleted_idx";

-- DropIndex
DROP INDEX "User_clubId_userType_idx";

-- AlterTable
ALTER TABLE "CoachCollectionShare" DROP COLUMN "studentId",
ADD COLUMN     "sharedWithId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CoachMediaCollection" ALTER COLUMN "sharingType" SET DEFAULT 'SPECIFIC_USERS';

-- CreateIndex
CREATE INDEX "CoachCollectionShare_sharedWithId_idx" ON "CoachCollectionShare"("sharedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachCollectionShare_collectionId_sharedWithId_key" ON "CoachCollectionShare"("collectionId", "sharedWithId");

-- AddForeignKey
ALTER TABLE "CoachCollectionShare" ADD CONSTRAINT "CoachCollectionShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
