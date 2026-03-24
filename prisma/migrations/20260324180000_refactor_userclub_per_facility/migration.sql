-- Step 1: Add facilityId column as nullable first
ALTER TABLE "UserClub" ADD COLUMN "facilityId" TEXT;

-- Step 2: Drop the old unique constraint (userId, clubShortName)
DROP INDEX "UserClub_userId_clubShortName_key";

-- Step 3: Drop the facilityIds array column (no longer needed)
ALTER TABLE "UserClub" DROP COLUMN "facilityIds";

-- Step 4: Backfill — expand each existing UserClub row into one row per active
-- facility in that club. For the original row, set facilityId to the first facility.
-- Then insert additional rows for any remaining facilities.

-- 4a: Set facilityId on existing rows to the first (lowest position) active facility in their club
UPDATE "UserClub" uc
SET "facilityId" = sub."facilityId"
FROM (
  SELECT DISTINCT ON (cf."clubShortName") cf."facilityId", cf."clubShortName"
  FROM "ClubFacility" cf
  WHERE cf."isActive" = true
  ORDER BY cf."clubShortName", cf."position" ASC
) sub
WHERE sub."clubShortName" = uc."clubShortName";

-- 4b: Insert additional rows for remaining facilities (2nd, 3rd, etc.)
-- Each gets the same role as the original membership row.
INSERT INTO "UserClub" ("id", "userId", "clubShortName", "facilityId", "role", "joinedAt")
SELECT gen_random_uuid()::text, uc."userId", uc."clubShortName", cf."facilityId", uc."role", uc."joinedAt"
FROM "UserClub" uc
JOIN "ClubFacility" cf ON cf."clubShortName" = uc."clubShortName" AND cf."isActive" = true
WHERE cf."facilityId" != uc."facilityId";

-- Step 5: Delete any rows where facilityId is still null (clubs with no facilities)
DELETE FROM "UserClub" WHERE "facilityId" IS NULL;

-- Step 6: Make facilityId NOT NULL now that all rows have a value
ALTER TABLE "UserClub" ALTER COLUMN "facilityId" SET NOT NULL;

-- Step 7: Add the new unique constraint and indexes
CREATE UNIQUE INDEX "UserClub_userId_facilityId_key" ON "UserClub"("userId", "facilityId");
CREATE INDEX "UserClub_facilityId_idx" ON "UserClub"("facilityId");

-- Step 8: Add foreign key
ALTER TABLE "UserClub" ADD CONSTRAINT "UserClub_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ClubFacility"("facilityId") ON DELETE CASCADE ON UPDATE CASCADE;
