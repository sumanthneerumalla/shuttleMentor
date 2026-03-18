-- CreateTable: UserClub — membership registry for multi-club support.
-- User.clubShortName + User.userType remain the live active-club fields;
-- UserClub records which clubs a user belongs to and their role at each.
CREATE TABLE "UserClub" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubShortName" TEXT NOT NULL,
    "role" "UserType" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserClub_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserClub_userId_clubShortName_key" ON "UserClub"("userId", "clubShortName");

-- CreateIndex
CREATE INDEX "UserClub_userId_idx" ON "UserClub"("userId");

-- CreateIndex
CREATE INDEX "UserClub_clubShortName_idx" ON "UserClub"("clubShortName");

-- AddForeignKey
ALTER TABLE "UserClub" ADD CONSTRAINT "UserClub_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserClub" ADD CONSTRAINT "UserClub_clubShortName_fkey" FOREIGN KEY ("clubShortName") REFERENCES "Club"("clubShortName") ON DELETE CASCADE ON UPDATE CASCADE;
