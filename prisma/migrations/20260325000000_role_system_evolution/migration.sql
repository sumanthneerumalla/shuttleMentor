-- Role System Evolution: ADMIN → PLATFORM_ADMIN + CLUB_ADMIN
-- Recreates the UserType enum with new values, backfills ADMIN → PLATFORM_ADMIN.

-- Step 1: Create new enum with all desired values
CREATE TYPE "UserType_new" AS ENUM ('STUDENT', 'COACH', 'FACILITY', 'CLUB_ADMIN', 'PLATFORM_ADMIN');

-- Step 2: Convert columns to text, update values, convert to new enum
ALTER TABLE "User" ALTER COLUMN "userType" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "userType" TYPE TEXT;
UPDATE "User" SET "userType" = 'PLATFORM_ADMIN' WHERE "userType" = 'ADMIN';
ALTER TABLE "User" ALTER COLUMN "userType" TYPE "UserType_new" USING "userType"::"UserType_new";
ALTER TABLE "User" ALTER COLUMN "userType" SET DEFAULT 'STUDENT';

ALTER TABLE "UserClub" ALTER COLUMN "role" TYPE TEXT;
UPDATE "UserClub" SET "role" = 'PLATFORM_ADMIN' WHERE "role" = 'ADMIN';
ALTER TABLE "UserClub" ALTER COLUMN "role" TYPE "UserType_new" USING "role"::"UserType_new";

-- Step 3: Drop old enum and rename
DROP TYPE "UserType";
ALTER TYPE "UserType_new" RENAME TO "UserType";
