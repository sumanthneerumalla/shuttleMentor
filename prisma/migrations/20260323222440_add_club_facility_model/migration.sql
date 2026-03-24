-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "facilityId" TEXT;

-- AlterTable
ALTER TABLE "ClubResource" ADD COLUMN     "facilityId" TEXT;

-- CreateTable
CREATE TABLE "ClubFacility" (
    "facilityId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT,
    "timezone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubFacility_pkey" PRIMARY KEY ("facilityId")
);

-- CreateIndex
CREATE INDEX "ClubFacility_clubShortName_idx" ON "ClubFacility"("clubShortName");

-- CreateIndex
CREATE UNIQUE INDEX "ClubFacility_clubShortName_name_key" ON "ClubFacility"("clubShortName", "name");

-- CreateIndex
CREATE INDEX "CalendarEvent_facilityId_idx" ON "CalendarEvent"("facilityId");

-- CreateIndex
CREATE INDEX "ClubResource_facilityId_idx" ON "ClubResource"("facilityId");

-- Backfill: create a "Main" facility for every club that has resources or events
INSERT INTO "ClubFacility" ("facilityId", "clubShortName", "name", "isActive", "position", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c."clubShortName", 'Main', true, 0, NOW(), NOW()
FROM "Club" c
WHERE EXISTS (SELECT 1 FROM "ClubResource" cr WHERE cr."clubShortName" = c."clubShortName")
   OR EXISTS (SELECT 1 FROM "CalendarEvent" ce WHERE ce."clubShortName" = c."clubShortName");

-- Backfill: assign all existing resources to their club's "Main" facility
UPDATE "ClubResource" cr
SET "facilityId" = cf."facilityId"
FROM "ClubFacility" cf
WHERE cf."clubShortName" = cr."clubShortName" AND cf."name" = 'Main';

-- Backfill: assign all existing events to their club's "Main" facility
UPDATE "CalendarEvent" ce
SET "facilityId" = cf."facilityId"
FROM "ClubFacility" cf
WHERE cf."clubShortName" = ce."clubShortName" AND cf."name" = 'Main';

-- AddForeignKey
ALTER TABLE "ClubFacility" ADD CONSTRAINT "ClubFacility_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubResource" ADD CONSTRAINT "ClubResource_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ClubFacility"("facilityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ClubFacility"("facilityId") ON DELETE RESTRICT ON UPDATE CASCADE;
