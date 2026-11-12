-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('URL', 'TEXT', 'IMAGE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('QUEUED', 'PROCESSING', 'NEEDS_REVIEW', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('ACCURATE', 'MISLEADING', 'FALSE', 'MISSING_CONTEXT', 'UNVERIFIED', 'SATIRE');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('SOURCE_INFO', 'FACT_CHECK', 'WEB_SOURCE', 'IMAGE_MATCH', 'IMAGE_METADATA', 'OCR_TEXT', 'AI_IMAGE_NOTES');

-- CreateEnum
CREATE TYPE "Stance" AS ENUM ('SUPPORTS', 'REFUTES', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL', 'NEWS', 'FACT_CHECKER', 'SATIRE', 'KNOWN_MISINFO');

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "type" "InputType" NOT NULL,
    "url" TEXT,
    "text" TEXT,
    "imagePath" TEXT,
    "title" TEXT,
    "contentHash" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'QUEUED',
    "steps" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "aiVerdict" "Verdict",
    "aiConfidence" DOUBLE PRECISION,
    "aiSummary" TEXT,
    "finalVerdict" "Verdict",
    "publicNote" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "claimId" TEXT,
    "kind" "EvidenceKind" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "publisher" TEXT,
    "rating" TEXT,
    "stance" "Stance",
    "snippet" TEXT,
    "publishedAt" TIMESTAMP(3),
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" UUID NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "publicNote" TEXT NOT NULL,
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "trust" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("domain")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "submissionId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_contentHash_idx" ON "Submission"("contentHash");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
