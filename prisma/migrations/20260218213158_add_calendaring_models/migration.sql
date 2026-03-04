-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BLOCK', 'BOOKABLE', 'COACHING_SLOT');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('PER_INSTANCE', 'PER_SERIES');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('COACHING_SESSION', 'CALENDAR_EVENT', 'COACHING_SLOT', 'CREDIT_PACK');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ClubResourceType" (
    "resourceTypeId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20),
    "backgroundColor" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubResourceType_pkey" PRIMARY KEY ("resourceTypeId")
);

-- CreateTable
CREATE TABLE "ClubResource" (
    "resourceId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "resourceTypeId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "backgroundColor" VARCHAR(20),
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubResource_pkey" PRIMARY KEY ("resourceId")
);

-- CreateTable
CREATE TABLE "ResourceBusinessHours" (
    "businessHoursId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "daysOfWeek" TEXT[],
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceBusinessHours_pkey" PRIMARY KEY ("businessHoursId")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "eventId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "resourceId" TEXT,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" VARCHAR(20),
    "backgroundColor" VARCHAR(20),
    "uid" TEXT NOT NULL,
    "rrule" TEXT,
    "exdates" TIMESTAMP(3)[],
    "recurrenceId" TEXT,
    "parentEventId" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'BLOCK',
    "isBlocking" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "maxParticipants" INTEGER,
    "registrationType" "RegistrationType",
    "creditCost" INTEGER,
    "productId" TEXT,
    "resourceIds" TEXT[],
    "createdByUserId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "Product" (
    "productId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "priceInCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "polarProductId" TEXT,
    "polarPriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instanceDate" TIMESTAMP(3),
    "polarOrderId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("registrationId")
);

-- CreateIndex
CREATE INDEX "ClubResourceType_clubShortName_idx" ON "ClubResourceType"("clubShortName");

-- CreateIndex
CREATE UNIQUE INDEX "ClubResourceType_clubShortName_name_key" ON "ClubResourceType"("clubShortName", "name");

-- CreateIndex
CREATE INDEX "ClubResource_clubShortName_idx" ON "ClubResource"("clubShortName");

-- CreateIndex
CREATE INDEX "ClubResource_resourceTypeId_idx" ON "ClubResource"("resourceTypeId");

-- CreateIndex
CREATE INDEX "ResourceBusinessHours_resourceId_idx" ON "ResourceBusinessHours"("resourceId");

-- CreateIndex
CREATE INDEX "CalendarEvent_clubShortName_idx" ON "CalendarEvent"("clubShortName");

-- CreateIndex
CREATE INDEX "CalendarEvent_resourceId_idx" ON "CalendarEvent"("resourceId");

-- CreateIndex
CREATE INDEX "CalendarEvent_uid_idx" ON "CalendarEvent"("uid");

-- CreateIndex
CREATE INDEX "CalendarEvent_parentEventId_idx" ON "CalendarEvent"("parentEventId");

-- CreateIndex
CREATE INDEX "CalendarEvent_createdByUserId_idx" ON "CalendarEvent"("createdByUserId");

-- CreateIndex
CREATE INDEX "CalendarEvent_isDeleted_idx" ON "CalendarEvent"("isDeleted");

-- CreateIndex
CREATE INDEX "CalendarEvent_start_end_idx" ON "CalendarEvent"("start", "end");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventType_idx" ON "CalendarEvent"("eventType");

-- CreateIndex
CREATE INDEX "CalendarEvent_productId_idx" ON "CalendarEvent"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_polarProductId_key" ON "Product"("polarProductId");

-- CreateIndex
CREATE INDEX "Product_clubShortName_idx" ON "Product"("clubShortName");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_polarProductId_idx" ON "Product"("polarProductId");

-- CreateIndex
CREATE INDEX "Product_createdByUserId_idx" ON "Product"("createdByUserId");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistration_productId_idx" ON "EventRegistration"("productId");

-- CreateIndex
CREATE INDEX "EventRegistration_userId_idx" ON "EventRegistration"("userId");

-- CreateIndex
CREATE INDEX "EventRegistration_polarOrderId_idx" ON "EventRegistration"("polarOrderId");

-- AddForeignKey
ALTER TABLE "ClubResourceType" ADD CONSTRAINT "ClubResourceType_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubResource" ADD CONSTRAINT "ClubResource_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubResource" ADD CONSTRAINT "ClubResource_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ClubResourceType"("resourceTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBusinessHours" ADD CONSTRAINT "ResourceBusinessHours_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ClubResource"("resourceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ClubResource"("resourceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "CalendarEvent"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
