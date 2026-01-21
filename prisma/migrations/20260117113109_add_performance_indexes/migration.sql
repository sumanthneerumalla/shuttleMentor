-- CreateIndex
-- Add composite index on User table for efficient club-based student queries
CREATE INDEX "User_clubId_userType_idx" ON "User"("clubId", "userType");

-- CreateIndex
-- Add composite index on CoachMediaCollection for efficient coach's active collections queries
CREATE INDEX "CoachMediaCollection_coachId_isDeleted_idx" ON "CoachMediaCollection"("coachId", "isDeleted");
