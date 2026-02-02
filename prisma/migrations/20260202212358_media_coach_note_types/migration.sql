-- CreateEnum
CREATE TYPE "MediaCoachNoteType" AS ENUM ('TEXT', 'YOUTUBE');

-- AlterTable
ALTER TABLE "MediaCoachNote" ADD COLUMN     "noteType" "MediaCoachNoteType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "videoUrl" TEXT,
ALTER COLUMN "noteContent" DROP NOT NULL;
