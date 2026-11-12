import type {
  ActivityEntry,
  AppUser,
  Claim,
  DashboardStats,
  Evidence,
  EvidenceKind,
  NewEvidence,
  NewReview,
  NewSubmission,
  PipelineInput,
  Source,
  Status,
  SubmissionDetail,
  SubmissionPatch,
  SubmissionSummary,
  Verdict,
} from "@/lib/types";

/**
 * Everything the app needs from storage, in one place.
 *
 * There are two implementations:
 * - `demo-store.ts`   keeps data in memory (no setup needed, resets on restart)
 * - `prisma-store.ts` reads and writes PostgreSQL through Prisma
 *
 * Pages never import a store directly. They use `@/lib/data`, which picks one.
 */
export interface Repository {
  // Pages
  listPublished(filter?: { verdict?: Verdict }): Promise<SubmissionSummary[]>;
  listForReview(filter?: { status?: Status }): Promise<SubmissionSummary[]>;
  getStats(): Promise<DashboardStats>;
  getSubmission(id: string): Promise<SubmissionDetail | null>;
  findPublishedByHash(contentHash: string): Promise<SubmissionSummary | null>;
  countSubmissionsSince(userId: string, since: Date): Promise<number>;
  createSubmission(input: NewSubmission): Promise<{ id: string }>;
  publishReview(input: NewReview): Promise<void>;

  // Verification pipeline
  getPipelineInput(id: string): Promise<PipelineInput | null>;
  updateSubmission(id: string, patch: SubmissionPatch): Promise<void>;
  /** Deletes the submission's claims and saves these instead. */
  replaceClaims(id: string, texts: string[]): Promise<Claim[]>;
  /** Deletes the submission's evidence of these kinds and saves the new items. */
  replaceEvidence(id: string, kinds: EvidenceKind[], items: NewEvidence[]): Promise<Evidence[]>;

  // Sources
  listSources(): Promise<Source[]>;
  findSource(domain: string): Promise<Source | null>;
  saveSource(source: Source): Promise<void>;

  // People and activity
  getProfile(id: string): Promise<AppUser | null>;
  saveProfile(user: AppUser): Promise<AppUser>;
  logAction(entry: { actorId: string | null; action: string; submissionId?: string; meta?: Record<string, unknown> }): Promise<void>;
  listActivity(limit: number): Promise<ActivityEntry[]>;
}
