-- AlterTable: change the column default
ALTER TABLE "User" ALTER COLUMN "clubShortName" SET DEFAULT 'shuttlementor';

-- Rename default club short name from default-club-001 to shuttlementor
-- Prisma FKs are NOT deferrable, so we temporarily drop them, rename, then re-add.

-- 1. Drop FK constraints that reference Club.clubShortName
ALTER TABLE "User" DROP CONSTRAINT "User_clubShortName_fkey";
ALTER TABLE "UserClub" DROP CONSTRAINT "UserClub_clubShortName_fkey";
ALTER TABLE "ClubResourceType" DROP CONSTRAINT "ClubResourceType_clubShortName_fkey";
ALTER TABLE "ClubResource" DROP CONSTRAINT "ClubResource_clubShortName_fkey";
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_clubShortName_fkey";
ALTER TABLE "Product" DROP CONSTRAINT "Product_clubShortName_fkey";

-- 2. Rename the parent row
UPDATE "Club" SET "clubShortName" = 'shuttlementor', "clubName" = 'Shuttlementor Academy', "updatedAt" = NOW() WHERE "clubShortName" = 'default-club-001';

-- 3. Update all child rows
UPDATE "User" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';
UPDATE "UserClub" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';
UPDATE "ClubResourceType" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';
UPDATE "ClubResource" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';
UPDATE "CalendarEvent" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';
UPDATE "Product" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';

-- 4. Re-add FK constraints
ALTER TABLE "User" ADD CONSTRAINT "User_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserClub" ADD CONSTRAINT "UserClub_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubResourceType" ADD CONSTRAINT "ClubResourceType_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubResource" ADD CONSTRAINT "ClubResource_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;
