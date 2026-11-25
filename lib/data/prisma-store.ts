import "server-only";
import { computeAnalytics } from "@/lib/analytics";
import { getPrisma } from "@/lib/db";
import type { Repository } from "@/lib/data/repository";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getImageUrl } from "@/lib/storage";
import type { EvidenceData, PipelineSteps, SubmissionDetail, SubmissionSummary } from "@/lib/types";

/** Columns needed for list views. Keeps queries small. */
const summarySelect = {
  id: true,
  type: true,
  title: true,
  url: true,
  text: true,
  status: true,
  aiVerdict: true,
  aiConfidence: true,
  finalVerdict: true,
  publicNote: true,
  reportCount: true,
  createdAt: true,
  publishedAt: true,
} satisfies Prisma.SubmissionSelect;

type SummaryRow = Prisma.SubmissionGetPayload<{ select: typeof summarySelect }>;

function toSummary(row: SummaryRow): SubmissionSummary {
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? row.url ?? row.text?.slice(0, 80) ?? "Untitled submission",
    url: row.url,
    status: row.status,
    aiVerdict: row.aiVerdict,
    aiConfidence: row.aiConfidence,
    finalVerdict: row.finalVerdict,
    publicNote: row.publicNote,
    reportCount: row.reportCount,
    createdAt: row.createdAt,
    publishedAt: row.publishedAt,
  };
}

export const prismaStore: Repository = {
  async listPublished(filter) {
    const query = filter?.query?.trim();
    const contains = { contains: query, mode: "insensitive" as const };
    const rows = await getPrisma().submission.findMany({
      where: {
        status: "PUBLISHED",
        ...(filter?.verdict ? { finalVerdict: filter.verdict } : {}),
        ...(query ? { OR: [{ title: contains }, { text: contains }, { publicNote: contains }] } : {}),
      },
      orderBy: { publishedAt: "desc" },
      select: summarySelect,
      take: 60,
    });
    return rows.map(toSummary);
  },

  async listForReview(filter) {
    const rows = await getPrisma().submission.findMany({
      where: filter?.status ? { status: filter.status } : { status: { not: "PUBLISHED" } },
      orderBy:
        filter?.sort === "oldest"
          ? { createdAt: "asc" }
          : filter?.sort === "reports"
            ? [{ reportCount: "desc" }, { createdAt: "desc" }]
            : { createdAt: "desc" },
      select: summarySelect,
      take: 100,
    });
    return rows.map(toSummary);
  },

  async listByUser(userId) {
    const rows = await getPrisma().submission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: summarySelect,
      take: 100,
    });
    return rows.map(toSummary);
  },

  async getStats() {
    const groups = await getPrisma().submission.groupBy({ by: ["status"], _count: { _all: true } });
    const count = (status: string) => groups.find((g) => g.status === status)?._count._all ?? 0;
    return {
      total: groups.reduce((sum, g) => sum + g._count._all, 0),
      published: count("PUBLISHED"),
      needsReview: count("NEEDS_REVIEW"),
      processing: count("PROCESSING") + count("QUEUED"),
      failed: count("FAILED"),
    };
  },

  async getAnalytics(rangeDays) {
    const since = new Date(Date.now() - (rangeDays + 1) * 86_400_000);
    const [records, top] = await Promise.all([
      getPrisma().submission.findMany({
        where: { OR: [{ createdAt: { gte: since } }, { publishedAt: { gte: since } }] },
        select: { type: true, status: true, aiVerdict: true, finalVerdict: true, createdAt: true, publishedAt: true },
      }),
      getPrisma().submission.findMany({
        orderBy: { reportCount: "desc" },
        take: 5,
        select: { id: true, title: true, reportCount: true, status: true, finalVerdict: true },
      }),
    ]);
    const topReported = top.map((t) => ({ ...t, title: t.title ?? "Untitled submission" }));
    return computeAnalytics(records, { rangeDays, topReported });
  },

  async getSubmission(id) {
    const row = await getPrisma().submission.findUnique({
      where: { id },
      include: {
        claims: { orderBy: { position: "asc" } },
        evidence: { orderBy: { createdAt: "asc" } },
        reviews: { orderBy: { createdAt: "desc" }, include: { reviewer: true } },
      },
    });
    if (!row) return null;

    const detail: SubmissionDetail = {
      ...toSummary(row),
      text: row.text,
      imageUrl: row.imagePath ? await getImageUrl(row.imagePath) : null,
      steps: (row.steps ?? {}) as PipelineSteps,
      error: row.error,
      aiSummary: row.aiSummary,
      claims: row.claims.map((c) => ({ id: c.id, text: c.text })),
      evidence: row.evidence.map((e) => ({
        id: e.id,
        claimId: e.claimId,
        kind: e.kind,
        title: e.title,
        url: e.url,
        publisher: e.publisher,
        rating: e.rating,
        stance: e.stance,
        snippet: e.snippet,
        publishedAt: e.publishedAt,
        data: (e.data ?? null) as EvidenceData | null,
      })),
      reviews: row.reviews.map((r) => ({
        id: r.id,
        reviewerName: r.reviewer.name ?? r.reviewer.email,
        verdict: r.verdict,
        publicNote: r.publicNote,
        internalNote: r.internalNote,
        createdAt: r.createdAt,
      })),
    };
    // Fill in the image of an earlier copy, for the side-by-side comparison.
    const compareIds = detail.evidence.map((e) => e.data?.compareSubmissionId).filter((v): v is string => Boolean(v));
    if (compareIds.length) {
      const others = await getPrisma().submission.findMany({ where: { id: { in: compareIds } }, select: { id: true, imagePath: true } });
      for (const e of detail.evidence) {
        const other = others.find((o) => o.id === e.data?.compareSubmissionId);
        if (other?.imagePath && e.data) e.data.compareImageUrl = (await getImageUrl(other.imagePath)) ?? undefined;
      }
    }
    return detail;
  },

  async findPublishedByHash(contentHash) {
    const row = await getPrisma().submission.findFirst({
      where: { contentHash, status: "PUBLISHED" },
      select: summarySelect,
    });
    return row ? toSummary(row) : null;
  },

  async findOpenByHash(contentHash) {
    const row = await getPrisma().submission.findFirst({
      where: { contentHash, status: { in: ["QUEUED", "PROCESSING", "NEEDS_REVIEW"] } },
      select: summarySelect,
    });
    return row ? toSummary(row) : null;
  },

  async addReport(id) {
    await getPrisma().submission.update({ where: { id }, data: { reportCount: { increment: 1 } } });
  },

  async addEvidence(id, item) {
    const created = await getPrisma().evidence.create({
      data: { ...item, data: (item.data ?? undefined) as Prisma.InputJsonValue | undefined, submissionId: id },
      select: {
        id: true,
        claimId: true,
        kind: true,
        title: true,
        url: true,
        publisher: true,
        rating: true,
        stance: true,
        snippet: true,
        publishedAt: true,
        data: true,
      },
    });
    return { ...created, data: (created.data ?? null) as EvidenceData | null };
  },

  async listImageFingerprints(excludeId) {
    const rows = await getPrisma().submission.findMany({
      where: { id: { not: excludeId }, imageHash: { not: null } },
      select: { id: true, title: true, status: true, finalVerdict: true, imageHash: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    return rows.map((r) => ({ ...r, title: r.title ?? "Uploaded image", imageHash: r.imageHash! }));
  },

  async countSubmissionsSince(userId, since) {
    return getPrisma().submission.count({ where: { userId, createdAt: { gte: since } } });
  },

  async getPipelineInput(id) {
    const row = await getPrisma().submission.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        url: true,
        text: true,
        imagePath: true,
        imageHash: true,
        title: true,
        status: true,
        steps: true,
      },
    });
    if (!row) return null;
    return { ...row, title: row.title ?? "Untitled submission", steps: (row.steps ?? {}) as PipelineSteps };
  },

  async updateSubmission(id, patch) {
    await getPrisma().submission.update({ where: { id }, data: patch });
  },

  async replaceClaims(id, texts) {
    const prisma = getPrisma();
    const [, , created] = await prisma.$transaction([
      prisma.evidence.updateMany({ where: { submissionId: id, claimId: { not: null } }, data: { claimId: null } }),
      prisma.claim.deleteMany({ where: { submissionId: id } }),
      prisma.claim.createManyAndReturn({
        data: texts.map((text, position) => ({ submissionId: id, text, position })),
        select: { id: true, text: true },
      }),
    ]);
    return created;
  },

  async replaceEvidence(id, kinds, items) {
    const prisma = getPrisma();
    const [, created] = await prisma.$transaction([
      prisma.evidence.deleteMany({ where: { submissionId: id, kind: { in: kinds } } }),
      prisma.evidence.createManyAndReturn({
        data: items.map((item) => ({ ...item, data: (item.data ?? undefined) as Prisma.InputJsonValue | undefined, submissionId: id })),
        select: {
          id: true,
          claimId: true,
          kind: true,
          title: true,
          url: true,
          publisher: true,
          rating: true,
          stance: true,
          snippet: true,
          publishedAt: true,
          data: true,
        },
      }),
    ]);
    return created.map((e) => ({ ...e, data: (e.data ?? null) as EvidenceData | null }));
  },

  async createSubmission(input) {
    const row = await getPrisma().submission.create({
      data: {
        type: input.type,
        url: input.url,
        text: input.text,
        imagePath: input.imagePath,
        imageHash: input.imageHash,
        title: input.title,
        contentHash: input.contentHash,
        userId: input.userId,
      },
      select: { id: true },
    });
    return row;
  },

  async publishReview(input) {
    // Both writes succeed together or not at all.
    await getPrisma().$transaction([
      getPrisma().review.create({
        data: {
          submissionId: input.submissionId,
          reviewerId: input.reviewerId,
          verdict: input.verdict,
          publicNote: input.publicNote,
          internalNote: input.internalNote,
        },
      }),
      getPrisma().submission.update({
        where: { id: input.submissionId },
        data: {
          finalVerdict: input.verdict,
          publicNote: input.publicNote,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      }),
    ]);
  },

  async listSources() {
    return getPrisma().source.findMany({
      orderBy: { trust: "desc" },
      select: { domain: true, name: true, type: true, trust: true, notes: true },
    });
  },

  async findSource(domain) {
    return getPrisma().source.findUnique({
      where: { domain },
      select: { domain: true, name: true, type: true, trust: true, notes: true },
    });
  },

  async saveSource(source) {
    await getPrisma().source.upsert({
      where: { domain: source.domain },
      create: source,
      update: source,
    });
  },

  async getProfile(id) {
    return getPrisma().profile.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });
  },

  async saveProfile(user) {
    // Only creates the profile on first sign-in. Existing roles are never overwritten.
    return getPrisma().profile.upsert({
      where: { id: user.id },
      create: user,
      update: {},
      select: { id: true, email: true, name: true, role: true },
    });
  },

  async listProfiles() {
    const rows = await getPrisma().profile.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true, _count: { select: { submissions: true } } },
    });
    return rows.map(({ _count, ...profile }) => ({ ...profile, submissionCount: _count.submissions }));
  },

  async setRole(id, role) {
    await getPrisma().profile.update({ where: { id }, data: { role } });
  },

  async logAction(entry) {
    await getPrisma().auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        submissionId: entry.submissionId,
        meta: entry.meta as Prisma.InputJsonValue | undefined,
      },
    });
  },

  async listActivity(limit) {
    const prisma = getPrisma();
    const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    const actorIds = [...new Set(rows.map((r) => r.actorId).filter((id): id is string => Boolean(id)))];
    const actors = await prisma.profile.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } });
    const nameOf = (id: string | null) => {
      const actor = actors.find((a) => a.id === id);
      return actor ? (actor.name ?? actor.email) : null;
    };
    return rows.map((r) => ({
      id: r.id,
      actorName: nameOf(r.actorId),
      action: r.action,
      submissionId: r.submissionId,
      meta: (r.meta ?? null) as Record<string, unknown> | null,
      createdAt: r.createdAt,
    }));
  },
};
