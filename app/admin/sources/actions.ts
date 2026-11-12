"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAction, saveSource } from "@/lib/data";
import { fieldErrors, sourceSchema } from "@/lib/validators";

export type SourceState = { errors?: Record<string, string>; saved?: string };

export async function saveSourceAction(_prev: SourceState, formData: FormData): Promise<SourceState> {
  const admin = await requireRole("ADMIN", "/admin/sources");

  const parsed = sourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await saveSource({ ...parsed.data, notes: parsed.data.notes || null });
  await logAction({ actorId: admin.id, action: "source.saved", meta: { domain: parsed.data.domain } });

  revalidatePath("/admin/sources");
  return { saved: parsed.data.domain };
}
