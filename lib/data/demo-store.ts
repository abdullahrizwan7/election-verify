import "server-only";
import { DEMO_SOURCES, DEMO_SUBMISSIONS, DEMO_USERS } from "@/lib/data/demo-data";
import type { Repository } from "@/lib/data/repository";
import type { AppUser, Source, SubmissionDetail, SubmissionSummary } from "@/lib/types";

type StoredSubmission = SubmissionDetail & { userId: string | null; contentHash: string };

interface DemoState {
  submissions: StoredSubmission[];
  sources: Source[];
  profiles: AppUser[];
}

/**
 * In-memory data for demo mode. It is kept on `globalThis` so it survives
 * hot reloads in development, and it resets when the server restarts.
 */
const globalForDemo = globalThis as unknown as { demoState?: DemoState };

function state(): DemoState {
  if (!globalForDemo.demoState) {
    globalForDemo.demoState = {
      submissions: structuredClone(DEMO_SUBMISSIONS),
      sources: structuredClone(DEMO_SOURCES),
      profiles: structuredClone(Object.values(DEMO_USERS)),
    };
  }
  return globalForDemo.demoState;
}

function toSummary(s: StoredSubmission): SubmissionSummary {
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    url: s.url,
    status: s.status,
    aiVerdict: s.aiVerdict,
    aiConfidence: s.aiConfidence,
    finalVerdict: s.finalVerdict,
    publicNote: s.publicNote,
    createdAt: s.createdAt,
    publishedAt: s.publishedAt,
  };
}

const newestFirst = (a: { createdAt: Date }, b: { createdAt: Date }) =>
  b.createdAt.getTime() - a.createdAt.getTime();

export const demoStore: Repository = {
  async listPublished(filter) {
    return state()
      .submissions.filter((s) => s.status === "PUBLISHED")
      .filter((s) => !filter?.verdict || s.finalVerdict === filter.verdict)
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
      .map(toSummary);
  },

  async listForReview(filter) {
    return state()
      .submissions.filter((s) => (filter?.status ? s.status === filter.status : s.status !== "PUBLISHED"))
      .sort(newestFirst)
      .map(toSummary);
  },

  async getStats() {
    const all = state().submissions;
    const count = (status: SubmissionDetail["status"]) => all.filter((s) => s.status === status).length;
    return {
      total: all.length,
      published: count("PUBLISHED"),
      needsReview: count("NEEDS_REVIEW"),
      processing: count("PROCESSING") + count("QUEUED"),
      failed: count("FAILED"),
    };
  },

  async getSubmission(id) {
    const found = state().submissions.find((s) => s.id === id);
    return found ? structuredClone(found) : null;
  },

  async findPublishedByHash(contentHash) {
    const found = state().submissions.find((s) => s.contentHash === contentHash && s.status === "PUBLISHED");
    return found ? toSummary(found) : null;
  },

  async createSubmission(input) {
    const id = `sub-${crypto.randomUUID().slice(0, 8)}`;
    state().submissions.push({
      id,
      type: input.type,
      title: input.title,
      url: input.url ?? null,
      text: input.text ?? null,
      imageUrl: input.imagePath ?? null,
      status: "QUEUED",
      steps: {},
      error: null,
      aiVerdict: null,
      aiConfidence: null,
      aiSummary: null,
      finalVerdict: null,
      publicNote: null,
      createdAt: new Date(),
      publishedAt: null,
      userId: input.userId,
      contentHash: input.contentHash,
      claims: [],
      evidence: [],
      reviews: [],
    });
    return { id };
  },

  async publishReview(input) {
    const submission = state().submissions.find((s) => s.id === input.submissionId);
    if (!submission) throw new Error("Submission not found");
    const reviewer = state().profiles.find((p) => p.id === input.reviewerId);
    const now = new Date();
    submission.reviews.push({
      id: `rv-${crypto.randomUUID().slice(0, 8)}`,
      reviewerName: reviewer?.name ?? reviewer?.email ?? "Reviewer",
      verdict: input.verdict,
      publicNote: input.publicNote,
      internalNote: input.internalNote ?? null,
      createdAt: now,
    });
    submission.finalVerdict = input.verdict;
    submission.publicNote = input.publicNote;
    submission.status = "PUBLISHED";
    submission.publishedAt = now;
  },

  async listSources() {
    return [...state().sources].sort((a, b) => b.trust - a.trust);
  },

  async saveSource(source) {
    const sources = state().sources;
    const index = sources.findIndex((s) => s.domain === source.domain);
    if (index >= 0) sources[index] = source;
    else sources.push(source);
  },

  async getProfile(id) {
    return state().profiles.find((p) => p.id === id) ?? null;
  },

  async saveProfile(user) {
    const profiles = state().profiles;
    const existing = profiles.find((p) => p.id === user.id);
    if (existing) return existing;
    profiles.push(user);
    return user;
  },

  async logAction(entry) {
    if (process.env.NODE_ENV === "development") {
      console.log("[audit]", entry.action, entry.submissionId ?? "", entry.actorId ?? "anonymous");
    }
  },
};
