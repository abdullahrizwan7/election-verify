"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAction, setRole } from "@/lib/data";
import type { Role } from "@/lib/types";

export type RoleState = { error?: string; saved?: string };

const ROLES: Role[] = ["USER", "REVIEWER", "ADMIN"];

/** Admins change what someone can do. Every change is written to the activity log. */
export async function setRoleAction(_prev: RoleState, formData: FormData): Promise<RoleState> {
  const admin = await requireRole("ADMIN", "/admin/users");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;

  if (!userId || !ROLES.includes(role)) return { error: "Choose a valid role." };
  // Admins can't demote themselves, so the workspace never ends up without an admin by accident.
  if (userId === admin.id && role !== "ADMIN") return { error: "You can't remove your own admin access." };

  await setRole(userId, role);
  await logAction({ actorId: admin.id, action: "user.role_changed", meta: { userId, role } });
  revalidatePath("/admin/users");
  return { saved: userId };
}
