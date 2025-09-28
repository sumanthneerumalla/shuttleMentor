-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "profileImage" BYTEA,
ADD COLUMN     "profileImageType" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "profileImage" BYTEA,
ADD COLUMN     "profileImageType" TEXT;
