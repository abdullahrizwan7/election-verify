import type {
  AppUser,
  DashboardStats,
  NewReview,
  NewSubmission,
  Source,
  Status,
  SubmissionDetail,
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
  listPublished(filter?: { verdict?: Verdict }): Promise<SubmissionSummary[]>;
  listForReview(filter?: { status?: Status }): Promise<SubmissionSummary[]>;
  getStats(): Promise<DashboardStats>;
  getSubmission(id: string): Promise<SubmissionDetail | null>;
  findPublishedByHash(contentHash: string): Promise<SubmissionSummary | null>;
  createSubmission(input: NewSubmission): Promise<{ id: string }>;
  publishReview(input: NewReview): Promise<void>;
  listSources(): Promise<Source[]>;
  saveSource(source: Source): Promise<void>;
  getProfile(id: string): Promise<AppUser | null>;
  saveProfile(user: AppUser): Promise<AppUser>;
  logAction(entry: { actorId: string | null; action: string; submissionId?: string; meta?: Record<string, unknown> }): Promise<void>;
}
