import "server-only";
import { connection } from "next/server";
import { hasDatabase } from "@/lib/config";
import { demoStore } from "@/lib/data/demo-store";
import { prismaStore } from "@/lib/data/prisma-store";
import type { Repository } from "@/lib/data/repository";
import type { Status, Verdict } from "@/lib/types";

/**
 * The data access layer. Pages, Server Actions and the pipeline import from here only.
 *
 * Read functions used by pages call `connection()` first. It tells Next.js that
 * the result must be fetched for every request instead of being frozen at build
 * time. Components that call them must sit inside a <Suspense> boundary.
 */
const store: Repository = hasDatabase ? prismaStore : demoStore;

// ── Reads for pages ──────────────────────────────────────────────────
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

export async function listActivity(limit = 100) {
  await connection();
  return store.listActivity(limit);
}

// ── Used by Server Actions and the pipeline (always run per request) ──
/** Same as getSubmission, for code that runs outside page rendering (pipeline, actions). */
export const readSubmission: Repository["getSubmission"] = (id) => store.getSubmission(id);
export const readSources: Repository["listSources"] = () => store.listSources();
export const findPublishedByHash: Repository["findPublishedByHash"] = (hash) => store.findPublishedByHash(hash);
export const countSubmissionsSince: Repository["countSubmissionsSince"] = (userId, since) =>
  store.countSubmissionsSince(userId, since);
export const createSubmission: Repository["createSubmission"] = (input) => store.createSubmission(input);
export const publishReview: Repository["publishReview"] = (input) => store.publishReview(input);
export const getPipelineInput: Repository["getPipelineInput"] = (id) => store.getPipelineInput(id);
export const updateSubmission: Repository["updateSubmission"] = (id, patch) => store.updateSubmission(id, patch);
export const replaceClaims: Repository["replaceClaims"] = (id, texts) => store.replaceClaims(id, texts);
export const replaceEvidence: Repository["replaceEvidence"] = (id, kinds, items) =>
  store.replaceEvidence(id, kinds, items);
export const findSource: Repository["findSource"] = (domain) => store.findSource(domain);
export const saveSource: Repository["saveSource"] = (source) => store.saveSource(source);
export const getProfile: Repository["getProfile"] = (id) => store.getProfile(id);
export const saveProfile: Repository["saveProfile"] = (user) => store.saveProfile(user);
export const logAction: Repository["logAction"] = (entry) => store.logAction(entry);
