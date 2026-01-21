-- CreateEnum
CREATE TYPE "SharingType" AS ENUM ('SPECIFIC_STUDENTS', 'ALL_STUDENTS');

-- CreateTable
CREATE TABLE "CoachMediaCollection" (
    "collectionId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "sharingType" "SharingType" NOT NULL DEFAULT 'SPECIFIC_STUDENTS',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachMediaCollection_pkey" PRIMARY KEY ("collectionId")
);

-- CreateTable
CREATE TABLE "CoachMedia" (
    "mediaId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachMedia_pkey" PRIMARY KEY ("mediaId")
);

-- CreateTable
CREATE TABLE "CoachCollectionShare" (
    "shareId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachCollectionShare_pkey" PRIMARY KEY ("shareId")
);

-- CreateIndex
CREATE INDEX "CoachMediaCollection_coachId_idx" ON "CoachMediaCollection"("coachId");

-- CreateIndex
CREATE INDEX "CoachMediaCollection_isDeleted_idx" ON "CoachMediaCollection"("isDeleted");

-- CreateIndex
CREATE INDEX "CoachMediaCollection_sharingType_idx" ON "CoachMediaCollection"("sharingType");

-- CreateIndex
CREATE INDEX "CoachMedia_collectionId_idx" ON "CoachMedia"("collectionId");

-- CreateIndex
CREATE INDEX "CoachMedia_isDeleted_idx" ON "CoachMedia"("isDeleted");

-- CreateIndex
CREATE INDEX "CoachCollectionShare_collectionId_idx" ON "CoachCollectionShare"("collectionId");

-- CreateIndex
CREATE INDEX "CoachCollectionShare_studentId_idx" ON "CoachCollectionShare"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachCollectionShare_collectionId_studentId_key" ON "CoachCollectionShare"("collectionId", "studentId");

-- AddForeignKey
ALTER TABLE "CoachMediaCollection" ADD CONSTRAINT "CoachMediaCollection_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMedia" ADD CONSTRAINT "CoachMedia_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CoachMediaCollection"("collectionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachCollectionShare" ADD CONSTRAINT "CoachCollectionShare_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CoachMediaCollection"("collectionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachCollectionShare" ADD CONSTRAINT "CoachCollectionShare_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
