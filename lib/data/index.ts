import "server-only";
import { connection } from "next/server";
import { hasDatabase } from "@/lib/config";
import { demoStore } from "@/lib/data/demo-store";
import { prismaStore } from "@/lib/data/prisma-store";
import type { Repository } from "@/lib/data/repository";
import type { NewReview, NewSubmission, Source, Status, Verdict } from "@/lib/types";

/**
 * The data access layer. Pages and Server Actions import from here only.
 *
 * Read functions call `connection()` first. It tells Next.js that the result
 * must be fetched for every request instead of being frozen at build time.
 * Components that call these functions must sit inside a <Suspense> boundary.
 */
const store: Repository = hasDatabase ? prismaStore : demoStore;

export async function listPublished(filter?: { verdict?: Verdict }) {
  await connection();
  return store.listPublished(filter);
}

export async function listForReview(filter?: { status?: Status }) {
  await connection();
  return store.listForReview(filter);
}

export async function getStats() {
  await connection();
  return store.getStats();
}

export async function getSubmission(id: string) {
  await connection();
  return store.getSubmission(id);
}

export async function listSources() {
  await connection();
  return store.listSources();
}

// Writes are only called from Server Actions, which always run per request.
export const findPublishedByHash = (hash: string) => store.findPublishedByHash(hash);
export const createSubmission = (input: NewSubmission) => store.createSubmission(input);
export const publishReview = (input: NewReview) => store.publishReview(input);
export const saveSource = (source: Source) => store.saveSource(source);
export const getProfile = (id: string) => store.getProfile(id);
export const saveProfile: Repository["saveProfile"] = (user) => store.saveProfile(user);
export const logAction: Repository["logAction"] = (entry) => store.logAction(entry);
