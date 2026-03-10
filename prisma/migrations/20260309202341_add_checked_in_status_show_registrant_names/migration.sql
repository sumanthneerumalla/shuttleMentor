-- AlterEnum
ALTER TYPE "RegistrationStatus" ADD VALUE 'CHECKED_IN';

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "showRegistrantNames" BOOLEAN NOT NULL DEFAULT false;
