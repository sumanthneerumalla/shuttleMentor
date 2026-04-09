-- CreateTable
CREATE TABLE "PackagePlan" (
    "packagePlanId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "productId" TEXT,
    "isGeneralDropIn" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sessionCount" INTEGER,
    "priceInCents" INTEGER NOT NULL,
    "durationValue" INTEGER,
    "durationUnit" VARCHAR(20),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagePlan_pkey" PRIMARY KEY ("packagePlanId")
);

-- CreateTable
CREATE TABLE "MemberPackage" (
    "memberPackageId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packagePlanId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "creditsTotal" INTEGER,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL,
    "soldBy" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberPackage_pkey" PRIMARY KEY ("memberPackageId")
);

-- CreateTable
CREATE TABLE "PackageCreditUsage" (
    "usageId" TEXT NOT NULL,
    "memberPackageId" TEXT NOT NULL,
    "eventId" TEXT,
    "registrationId" TEXT,
    "attendanceId" TEXT,
    "creditsConsumed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageCreditUsage_pkey" PRIMARY KEY ("usageId")
);

-- CreateIndex
CREATE INDEX "PackagePlan_clubShortName_idx" ON "PackagePlan"("clubShortName");

-- CreateIndex
CREATE INDEX "PackagePlan_productId_idx" ON "PackagePlan"("productId");

-- CreateIndex
CREATE INDEX "MemberPackage_clubShortName_idx" ON "MemberPackage"("clubShortName");

-- CreateIndex
CREATE INDEX "MemberPackage_userId_idx" ON "MemberPackage"("userId");

-- CreateIndex
CREATE INDEX "MemberPackage_packagePlanId_idx" ON "MemberPackage"("packagePlanId");

-- CreateIndex
CREATE INDEX "MemberPackage_status_idx" ON "MemberPackage"("status");

-- CreateIndex
CREATE INDEX "MemberPackage_endDate_idx" ON "MemberPackage"("endDate");

-- CreateIndex
CREATE INDEX "PackageCreditUsage_memberPackageId_idx" ON "PackageCreditUsage"("memberPackageId");

-- CreateIndex
CREATE INDEX "PackageCreditUsage_registrationId_idx" ON "PackageCreditUsage"("registrationId");

-- CreateIndex
CREATE INDEX "PackageCreditUsage_attendanceId_idx" ON "PackageCreditUsage"("attendanceId");

-- CreateIndex
CREATE INDEX "PackageCreditUsage_eventId_idx" ON "PackageCreditUsage"("eventId");

-- AddForeignKey
ALTER TABLE "PackagePlan" ADD CONSTRAINT "PackagePlan_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePlan" ADD CONSTRAINT "PackagePlan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPackage" ADD CONSTRAINT "MemberPackage_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPackage" ADD CONSTRAINT "MemberPackage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPackage" ADD CONSTRAINT "MemberPackage_packagePlanId_fkey" FOREIGN KEY ("packagePlanId") REFERENCES "PackagePlan"("packagePlanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPackage" ADD CONSTRAINT "MemberPackage_soldBy_fkey" FOREIGN KEY ("soldBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageCreditUsage" ADD CONSTRAINT "PackageCreditUsage_memberPackageId_fkey" FOREIGN KEY ("memberPackageId") REFERENCES "MemberPackage"("memberPackageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageCreditUsage" ADD CONSTRAINT "PackageCreditUsage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("eventId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageCreditUsage" ADD CONSTRAINT "PackageCreditUsage_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("registrationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageCreditUsage" ADD CONSTRAINT "PackageCreditUsage_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("attendanceId") ON DELETE SET NULL ON UPDATE CASCADE;
