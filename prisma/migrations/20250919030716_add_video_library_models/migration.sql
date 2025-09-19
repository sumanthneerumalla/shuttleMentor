-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('URL_VIDEO', 'FILE_VIDEO');

-- CreateTable
CREATE TABLE "VideoLibrary" (
    "libraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoLibrary_pkey" PRIMARY KEY ("libraryId")
);

-- CreateTable
CREATE TABLE "Media" (
    "mediaId" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "duration" INTEGER,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("mediaId")
);

-- CreateIndex
CREATE INDEX "VideoLibrary_userId_idx" ON "VideoLibrary"("userId");

-- CreateIndex
CREATE INDEX "Media_libraryId_idx" ON "Media"("libraryId");

-- AddForeignKey
ALTER TABLE "VideoLibrary" ADD CONSTRAINT "VideoLibrary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "VideoLibrary"("libraryId") ON DELETE CASCADE ON UPDATE CASCADE;
