-- A reviewer can take a claim ("In review" on the review board). Both columns are optional,
-- so existing rows and older app versions keep working.
ALTER TABLE "Submission" ADD COLUMN "assigneeId" UUID;
ALTER TABLE "Submission" ADD COLUMN "assignedAt" TIMESTAMP(3);

CREATE INDEX "Submission_assigneeId_idx" ON "Submission"("assigneeId");

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
