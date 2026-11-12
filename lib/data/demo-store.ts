import "server-only";
import { DEMO_SOURCES, DEMO_SUBMISSIONS, DEMO_USERS } from "@/lib/data/demo-data";
import type { Repository } from "@/lib/data/repository";
import type { ActivityEntry, AppUser, Source, SubmissionDetail, SubmissionSummary } from "@/lib/types";

type StoredSubmission = SubmissionDetail & { userId: string | null; contentHash: string };
type StoredActivity = Omit<ActivityEntry, "actorName"> & { actorId: string | null };

interface DemoState {
  submissions: StoredSubmission[];
  sources: Source[];
  profiles: AppUser[];
  activity: StoredActivity[];
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
      activity: [],
    };
  }
  return globalForDemo.demoState;
}

function find(id: string): StoredSubmission {
  const submission = state().submissions.find((s) => s.id === id);
  if (!submission) throw new Error(`Submission ${id} not found`);
  return submission;
}

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

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

  async countSubmissionsSince(userId, since) {
    return state().submissions.filter((s) => s.userId === userId && s.createdAt >= since).length;
  },

  async createSubmission(input) {
    const id = newId("sub");
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
    const submission = find(input.submissionId);
    const reviewer = state().profiles.find((p) => p.id === input.reviewerId);
    const now = new Date();
    submission.reviews.unshift({
      id: newId("rv"),
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

  async getPipelineInput(id) {
    const s = state().submissions.find((item) => item.id === id);
    if (!s) return null;
    return {
      id: s.id,
      type: s.type,
      url: s.url,
      text: s.text,
      imagePath: s.imageUrl, // demo mode keeps the image itself (data URL) or a /public path here
      title: s.title,
      status: s.status,
      steps: { ...s.steps },
    };
  },

  async updateSubmission(id, patch) {
    Object.assign(find(id), patch);
  },

  async replaceClaims(id, texts) {
    const submission = find(id);
    submission.claims = texts.map((text) => ({ id: newId("cl"), text }));
    // Evidence that pointed at the old claims no longer has a claim.
    const claimIds = new Set(submission.claims.map((c) => c.id));
    for (const e of submission.evidence) if (e.claimId && !claimIds.has(e.claimId)) e.claimId = null;
    return structuredClone(submission.claims);
  },

  async replaceEvidence(id, kinds, items) {
    const submission = find(id);
    const created = items.map((item) => ({ ...item, id: newId("ev") }));
    submission.evidence = [...submission.evidence.filter((e) => !kinds.includes(e.kind)), ...created];
    return structuredClone(created);
  },

  async listSources() {
    return [...state().sources].sort((a, b) => b.trust - a.trust);
  },

  async findSource(domain) {
    return state().sources.find((s) => s.domain === domain) ?? null;
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
    state().activity.unshift({
      id: newId("log"),
      actorId: entry.actorId,
      action: entry.action,
      submissionId: entry.submissionId ?? null,
      meta: entry.meta ?? null,
      createdAt: new Date(),
    });
  },

  async listActivity(limit) {
    const profiles = state().profiles;
    return state()
      .activity.slice(0, limit)
      .map(({ actorId, ...entry }) => {
        const actor = profiles.find((p) => p.id === actorId);
        return { ...entry, actorName: actor ? (actor.name ?? actor.email) : null };
      });
  },
};
