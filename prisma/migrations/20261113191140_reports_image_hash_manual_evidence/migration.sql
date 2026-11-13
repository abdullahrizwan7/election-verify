-- AlterEnum
ALTER TYPE "EvidenceKind" ADD VALUE 'MANUAL';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "imageHash" TEXT,
ADD COLUMN     "reportCount" INTEGER NOT NULL DEFAULT 1;
