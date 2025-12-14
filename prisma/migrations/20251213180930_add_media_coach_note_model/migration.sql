-- CreateTable
CREATE TABLE "MediaCoachNote" (
    "noteId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "noteContent" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaCoachNote_pkey" PRIMARY KEY ("noteId")
);

-- CreateIndex
CREATE INDEX "MediaCoachNote_mediaId_idx" ON "MediaCoachNote"("mediaId");

-- CreateIndex
CREATE INDEX "MediaCoachNote_coachId_idx" ON "MediaCoachNote"("coachId");

-- AddForeignKey
ALTER TABLE "MediaCoachNote" ADD CONSTRAINT "MediaCoachNote_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("mediaId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCoachNote" ADD CONSTRAINT "MediaCoachNote_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
