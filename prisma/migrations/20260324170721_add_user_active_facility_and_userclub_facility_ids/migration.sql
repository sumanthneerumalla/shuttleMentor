-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeFacilityId" TEXT;

-- AlterTable
ALTER TABLE "UserClub" ADD COLUMN     "facilityIds" TEXT[];

-- CreateIndex
CREATE INDEX "User_activeFacilityId_idx" ON "User"("activeFacilityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeFacilityId_fkey" FOREIGN KEY ("activeFacilityId") REFERENCES "ClubFacility"("facilityId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: set each user's activeFacilityId to the first (lowest position) active facility in their club
UPDATE "User" u
SET "activeFacilityId" = sub."facilityId"
FROM (
  SELECT DISTINCT ON (cf."clubShortName") cf."facilityId", cf."clubShortName"
  FROM "ClubFacility" cf
  WHERE cf."isActive" = true
  ORDER BY cf."clubShortName", cf."position" ASC
) sub
WHERE sub."clubShortName" = u."clubShortName";

-- Backfill: populate facilityIds on UserClub with all active facility IDs for that club
UPDATE "UserClub" uc
SET "facilityIds" = sub."ids"
FROM (
  SELECT cf."clubShortName", array_agg(cf."facilityId" ORDER BY cf."position") AS "ids"
  FROM "ClubFacility" cf
  WHERE cf."isActive" = true
  GROUP BY cf."clubShortName"
) sub
WHERE sub."clubShortName" = uc."clubShortName";
