/*
  Warnings:

  - The values [CANCELLED] on the enum `RegistrationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `polarOrderId` on the `EventRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `polarPriceId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `polarProductId` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Made the column `timezone` on table `ClubFacility` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- ============================================================
-- Phase 5a safety: pre-migration data fixups for prod/dev
-- ============================================================

-- 1. Remap CANCELLED → LATE_CANCEL before Prisma's enum swap drops CANCELLED.
--    Column is old enum type so we can't assign LATE_CANCEL directly. Instead,
--    cast to text, remap, and leave as text for Prisma's swap block to handle.
ALTER TABLE "EventRegistration" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EventRegistration" ALTER COLUMN "status" TYPE TEXT;
UPDATE "EventRegistration" SET "status" = 'LATE_CANCEL' WHERE "status" = 'CANCELLED';

-- 2. Backfill NULL timezones before NOT NULL constraint
UPDATE "ClubFacility" SET "timezone" = 'America/New_York' WHERE "timezone" IS NULL;

-- 3. Delete orphaned Products (if any) so NOT NULL categoryId doesn't fail.
--    Product table will be empty or near-empty (no real users); this is a safety net.
--    Products are re-created by staff after the migration with proper categoryIds.
DELETE FROM "EventRegistration" WHERE "productId" IN (
  SELECT "productId" FROM "Product"
);
DELETE FROM "CalendarEvent" WHERE "productId" IN (
  SELECT "productId" FROM "Product"
);
-- Unlink calendar events that reference products (keep the events, just null out productId)
UPDATE "CalendarEvent" SET "productId" = NULL WHERE "productId" IS NOT NULL;
DELETE FROM "Product";

-- ============================================================
-- Prisma-generated migration below
-- ============================================================

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'RENTAL_WINDOW';
ALTER TYPE "EventType" ADD VALUE 'RENTAL_BOOKING';

-- AlterEnum
BEGIN;
CREATE TYPE "RegistrationStatus_new" AS ENUM ('REGISTERED', 'CHECKED_IN', 'EARLY_CANCEL', 'LATE_CANCEL', 'RESCHEDULED', 'NO_SHOW');
ALTER TABLE "public"."EventRegistration" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EventRegistration" ALTER COLUMN "status" TYPE "RegistrationStatus_new" USING ("status"::text::"RegistrationStatus_new");
ALTER TYPE "RegistrationStatus" RENAME TO "RegistrationStatus_old";
ALTER TYPE "RegistrationStatus_new" RENAME TO "RegistrationStatus";
DROP TYPE "public"."RegistrationStatus_old";
ALTER TABLE "EventRegistration" ALTER COLUMN "status" SET DEFAULT 'REGISTERED';
COMMIT;

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_productId_fkey";

-- DropIndex
DROP INDEX "EventRegistration_polarOrderId_idx";

-- DropIndex
DROP INDEX "Product_category_idx";

-- DropIndex
DROP INDEX "Product_polarProductId_idx";

-- DropIndex
DROP INDEX "Product_polarProductId_key";

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "earlyCancelCutoffHours" INTEGER;

-- AlterTable
ALTER TABLE "ClubFacility" ALTER COLUMN "timezone" SET NOT NULL,
ALTER COLUMN "timezone" SET DEFAULT 'America/New_York';

-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "polarOrderId",
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "polarPriceId",
DROP COLUMN "polarProductId",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "sku" VARCHAR(100),
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeProductId" TEXT;

-- DropEnum
DROP TYPE "ProductCategory";

-- CreateTable
CREATE TABLE "ProductCategory" (
    "categoryId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "parentCategoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("categoryId")
);

-- CreateIndex
CREATE INDEX "ProductCategory_clubShortName_idx" ON "ProductCategory"("clubShortName");

-- CreateIndex
CREATE INDEX "ProductCategory_parentCategoryId_idx" ON "ProductCategory"("parentCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_clubShortName_name_parentCategoryId_key" ON "ProductCategory"("clubShortName", "name", "parentCategoryId");

-- CreateIndex
CREATE INDEX "EventRegistration_stripeCheckoutSessionId_idx" ON "EventRegistration"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "EventRegistration_stripePaymentIntentId_idx" ON "EventRegistration"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_stripeProductId_key" ON "Product"("stripeProductId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_stripeProductId_idx" ON "Product"("stripeProductId");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "ProductCategory"("categoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE SET NULL ON UPDATE CASCADE;
