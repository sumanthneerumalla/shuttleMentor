/*
  Warnings:

  - You are about to drop the column `address` on the `ClubFacility` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClubFacility" DROP COLUMN "address",
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(30),
ADD COLUMN     "state" VARCHAR(100),
ADD COLUMN     "streetAddress" VARCHAR(500),
ADD COLUMN     "zipCode" VARCHAR(20);
