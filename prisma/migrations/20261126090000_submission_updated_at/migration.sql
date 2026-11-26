-- When a submission last changed. Used to spot checks that stopped part-way
-- (for example a server that timed out) so a reviewer can run them again.
ALTER TABLE "Submission" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
