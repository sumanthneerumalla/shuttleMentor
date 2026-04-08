-- CreateTable
CREATE TABLE "Attendance" (
    "attendanceId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "registrationId" TEXT,
    "checkedInBy" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "RegistrationStatusLog" (
    "logId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "oldStatus" "RegistrationStatus",
    "newStatus" "RegistrationStatus" NOT NULL,
    "source" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationStatusLog_pkey" PRIMARY KEY ("logId")
);

-- CreateIndex
CREATE INDEX "Attendance_clubShortName_idx" ON "Attendance"("clubShortName");

-- CreateIndex
CREATE INDEX "Attendance_facilityId_idx" ON "Attendance"("facilityId");

-- CreateIndex
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");

-- CreateIndex
CREATE INDEX "Attendance_eventId_idx" ON "Attendance"("eventId");

-- CreateIndex
CREATE INDEX "Attendance_checkedInAt_idx" ON "Attendance"("checkedInAt");

-- CreateIndex
CREATE INDEX "RegistrationStatusLog_clubShortName_idx" ON "RegistrationStatusLog"("clubShortName");

-- CreateIndex
CREATE INDEX "RegistrationStatusLog_registrationId_idx" ON "RegistrationStatusLog"("registrationId");

-- CreateIndex
CREATE INDEX "RegistrationStatusLog_userId_idx" ON "RegistrationStatusLog"("userId");

-- CreateIndex
CREATE INDEX "RegistrationStatusLog_changedByUserId_idx" ON "RegistrationStatusLog"("changedByUserId");

-- CreateIndex
CREATE INDEX "RegistrationStatusLog_createdAt_idx" ON "RegistrationStatusLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ClubFacility"("facilityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("eventId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("registrationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationStatusLog" ADD CONSTRAINT "RegistrationStatusLog_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationStatusLog" ADD CONSTRAINT "RegistrationStatusLog_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("registrationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationStatusLog" ADD CONSTRAINT "RegistrationStatusLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationStatusLog" ADD CONSTRAINT "RegistrationStatusLog_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
