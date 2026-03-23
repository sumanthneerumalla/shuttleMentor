-- AlterTable
ALTER TABLE "User" ALTER COLUMN "clubShortName" SET DEFAULT 'shuttlementor';

-- Rename default club short name from default-club-001 to shuttlementor
-- Update FK references first (child tables), then the parent Club row
UPDATE "UserClub" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';
UPDATE "User" SET "clubShortName" = 'shuttlementor' WHERE "clubShortName" = 'default-club-001';
UPDATE "Club" SET "clubShortName" = 'shuttlementor', "clubName" = 'Shuttlementor Academy', "updatedAt" = NOW() WHERE "clubShortName" = 'default-club-001';
