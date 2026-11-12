/**
 * Fills the database with the same sample data used in demo mode.
 * Run with: npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { DEMO_SOURCES, DEMO_SUBMISSIONS, DEMO_USERS } from "../lib/data/demo-data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Seeding profiles…");
  for (const user of Object.values(DEMO_USERS)) {
    await prisma.profile.upsert({ where: { id: user.id }, create: user, update: {} });
  }

  console.log("Seeding trusted sources…");
  for (const source of DEMO_SOURCES) {
    await prisma.source.upsert({ where: { domain: source.domain }, create: source, update: source });
  }

  console.log("Seeding sample submissions…");
  for (const s of DEMO_SUBMISSIONS) {
    await prisma.submission.deleteMany({ where: { id: s.id } });
    await prisma.submission.create({
      data: {
        id: s.id,
        type: s.type,
        url: s.url,
        text: s.text,
        imagePath: s.imageUrl, // demo images live in /public/demo
        title: s.title,
        contentHash: s.contentHash,
        status: s.status,
        steps: s.steps,
        error: s.error,
        aiVerdict: s.aiVerdict,
        aiConfidence: s.aiConfidence,
        aiSummary: s.aiSummary,
        finalVerdict: s.finalVerdict,
        publicNote: s.publicNote,
        userId: s.userId,
        createdAt: s.createdAt,
        publishedAt: s.publishedAt,
        claims: {
          create: s.claims.map((claim, position) => ({ id: claim.id, text: claim.text, position })),
        },
      },
    });

    // Evidence is created after claims so `claimId` can point at them.
    await prisma.evidence.createMany({
      data: s.evidence.map((e) => ({ ...e, submissionId: s.id })),
    });

    for (const review of s.reviews) {
      await prisma.review.create({
        data: {
          id: review.id,
          submissionId: s.id,
          reviewerId: DEMO_USERS.reviewer.id,
          verdict: review.verdict,
          publicNote: s.publicNote ?? "",
          internalNote: review.internalNote,
          createdAt: review.createdAt,
        },
      });
    }
  }

  console.log(`Done: ${DEMO_SUBMISSIONS.length} submissions, ${DEMO_SOURCES.length} sources.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
