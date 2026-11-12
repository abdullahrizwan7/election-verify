/**
 * Shared domain types used by pages and components.
 * They mirror the enums and models in prisma/schema.prisma, so the UI does not
 * depend on the database library directly.
 */

export type Role = "USER" | "REVIEWER" | "ADMIN";
export type InputType = "URL" | "TEXT" | "IMAGE";
export type Status = "QUEUED" | "PROCESSING" | "NEEDS_REVIEW" | "PUBLISHED" | "FAILED";
export type Verdict =
  | "ACCURATE"
  | "MISLEADING"
  | "FALSE"
  | "MISSING_CONTEXT"
  | "UNVERIFIED"
  | "SATIRE";
export type EvidenceKind =
  | "SOURCE_INFO"
  | "FACT_CHECK"
  | "WEB_SOURCE"
  | "IMAGE_MATCH"
  | "IMAGE_METADATA"
  | "OCR_TEXT"
  | "AI_IMAGE_NOTES";
export type Stance = "SUPPORTS" | "REFUTES" | "NEUTRAL";
export type SourceType = "OFFICIAL" | "NEWS" | "FACT_CHECKER" | "SATIRE" | "KNOWN_MISINFO";

/** The steps of the verification pipeline, in the order they run. */
export type PipelineStepKey =
  | "extract"
  | "sourceInfo"
  | "image"
  | "claims"
  | "factCheck"
  | "webEvidence"
  | "synthesize";
export type StepState = "pending" | "running" | "done" | "skipped" | "failed";
export type PipelineSteps = Partial<Record<PipelineStepKey, StepState>>;

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export interface Claim {
  id: string;
  text: string;
}

export interface Evidence {
  id: string;
  claimId: string | null;
  kind: EvidenceKind;
  title: string;
  url: string | null;
  publisher: string | null;
  rating: string | null;
  stance: Stance | null;
  snippet: string | null;
  publishedAt: Date | null;
}

export interface Review {
  id: string;
  reviewerName: string;
  verdict: Verdict;
  publicNote: string;
  internalNote: string | null;
  createdAt: Date;
}

/** Small version of a submission, used in lists and tables. */
export interface SubmissionSummary {
  id: string;
  type: InputType;
  title: string;
  url: string | null;
  status: Status;
  aiVerdict: Verdict | null;
  aiConfidence: number | null;
  finalVerdict: Verdict | null;
  publicNote: string | null;
  createdAt: Date;
  publishedAt: Date | null;
}

/** Everything about one submission, used on the result and review pages. */
export interface SubmissionDetail extends SubmissionSummary {
  text: string | null;
  imageUrl: string | null;
  steps: PipelineSteps;
  error: string | null;
  aiSummary: string | null;
  claims: Claim[];
  evidence: Evidence[];
  reviews: Review[];
}

export interface Source {
  domain: string;
  name: string;
  type: SourceType;
  trust: number;
  notes: string | null;
}

export interface DashboardStats {
  total: number;
  published: number;
  needsReview: number;
  processing: number;
  failed: number;
}

/** Data the submit form sends to the data layer once it has been validated. */
export interface NewSubmission {
  type: InputType;
  url?: string;
  text?: string;
  imagePath?: string;
  title: string;
  contentHash: string;
  userId: string | null;
}

export type NewEvidence = Omit<Evidence, "id">;

/** The raw fields the verification pipeline needs. */
export interface PipelineInput {
  id: string;
  type: InputType;
  url: string | null;
  text: string | null;
  imagePath: string | null;
  title: string;
  status: Status;
  steps: PipelineSteps;
}

/** Fields the pipeline is allowed to change on a submission. */
export type SubmissionPatch = Partial<{
  status: Status;
  steps: PipelineSteps;
  error: string | null;
  title: string;
  text: string | null;
  aiVerdict: Verdict | null;
  aiConfidence: number | null;
  aiSummary: string | null;
}>;

export interface ActivityEntry {
  id: string;
  actorName: string | null;
  action: string;
  submissionId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

export interface NewReview {
  submissionId: string;
  reviewerId: string;
  verdict: Verdict;
  publicNote: string;
  internalNote?: string;
}
