-- CreateTable
CREATE TABLE "Tag" (
    "tagId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "bgColor" VARCHAR(20) NOT NULL,
    "textColor" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("tagId")
);

-- CreateTable
CREATE TABLE "UserTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "UserTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_clubShortName_idx" ON "Tag"("clubShortName");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_clubShortName_name_key" ON "Tag"("clubShortName", "name");

-- CreateIndex
CREATE INDEX "UserTag_userId_idx" ON "UserTag"("userId");

-- CreateIndex
CREATE INDEX "UserTag_tagId_idx" ON "UserTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTag_userId_tagId_key" ON "UserTag"("userId", "tagId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("tagId") ON DELETE CASCADE ON UPDATE CASCADE;
