import "server-only";
import { createClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET, supabaseUrl } from "@/lib/config";

/**
 * Image storage.
 * - With Supabase keys: files go to a private Storage bucket, and pages get a
 *   signed link that expires after one hour.
 * - Demo mode: the image is kept as a data URL in memory.
 */
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function storageClient() {
  if (!supabaseUrl || !secretKey) return null;
  return createClient(supabaseUrl, secretKey, { auth: { persistSession: false } });
}

export async function saveImage(file: File): Promise<string> {
  const client = storageClient();
  if (!client) {
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${bytes.toString("base64")}`;
  }

  const extension = file.type.split("/")[1] ?? "jpg";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return path;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** Loads the image bytes for analysis, wherever the image is stored. */
export async function loadImage(path: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
  if (path.startsWith("data:")) {
    const match = path.match(/^data:([^;]+);base64,(.*)$/);
    return match ? { mimeType: match[1], bytes: Buffer.from(match[2], "base64") } : null;
  }

  if (path.startsWith("/")) {
    // Sample images that ship with the app, in the /public folder.
    const { readFile } = await import("node:fs/promises");
    const { join, normalize } = await import("node:path");
    const publicDir = join(process.cwd(), "public");
    const file = normalize(join(publicDir, path));
    if (!file.startsWith(publicDir)) return null;
    const extension = file.split(".").pop()?.toLowerCase() ?? "";
    return { bytes: await readFile(file), mimeType: MIME_BY_EXTENSION[extension] ?? "application/octet-stream" };
  }

  const client = storageClient();
  if (!client) return null;
  const { data, error } = await client.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) return null;
  return { bytes: Buffer.from(await data.arrayBuffer()), mimeType: data.type || "image/jpeg" };
}

export async function getImageUrl(path: string): Promise<string | null> {
  if (path.startsWith("data:") || path.startsWith("/") || path.startsWith("http")) return path;
  const client = storageClient();
  if (!client) return null;
  const { data } = await client.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
