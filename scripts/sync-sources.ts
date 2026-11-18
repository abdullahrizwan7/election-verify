/**
 * Puts the real Indian trusted-sources list into the database and removes the
 * made-up ".example" sources. Submissions and reviews are not touched.
 * Run with: npm run db:sources
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { INDIA_SOURCES } from "../lib/data/sources-india";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const removed = await prisma.source.deleteMany({ where: { domain: { endsWith: ".example" } } });
  let added = 0;
  for (const source of INDIA_SOURCES) {
    const existing = await prisma.source.findUnique({ where: { domain: source.domain } });
    if (existing) continue; // keep any trust score or note an admin has changed
    await prisma.source.create({ data: source });
    added++;
  }
  const total = await prisma.source.count();
  console.log(`Removed ${removed.count} made-up sources, added ${added} Indian sources. ${total} sources in the list now.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
