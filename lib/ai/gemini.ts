import "server-only";
import { services } from "@/lib/config";

/**
 * A tiny client for Google's Gemini API (free tier available at aistudio.google.com).
 * It sends a prompt (and optionally an image) and asks for JSON in a fixed shape.
 *
 * Only this file knows about Gemini. To use another AI provider, write a file
 * with the same `generateJson` function and change the import in lib/ai/tasks.ts.
 */

/** Gemini's schema format: a subset of OpenAPI with upper-case type names. */
export type GeminiSchema =
  | { type: "STRING"; enum?: string[]; description?: string }
  | { type: "NUMBER" | "INTEGER" | "BOOLEAN"; description?: string }
  | { type: "ARRAY"; items: GeminiSchema; description?: string }
  | { type: "OBJECT"; properties: Record<string, GeminiSchema>; required?: string[]; description?: string };

export function isAiConfigured(): boolean {
  return Boolean(services.gemini.apiKey);
}

export async function generateJson<T>(options: {
  system: string;
  prompt: string;
  schema: GeminiSchema;
  image?: { bytes: Buffer; mimeType: string };
}): Promise<T> {
  const { apiKey, model } = services.gemini;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const parts: object[] = [];
  if (options.image) {
    parts.push({ inlineData: { mimeType: options.image.mimeType, data: options.image.bytes.toString("base64") } });
  }
  parts.push({ text: options.prompt });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", responseSchema: options.schema, temperature: 0.2 },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini API error ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };
  if (data.promptFeedback?.blockReason) throw new Error(`Gemini declined the request: ${data.promptFeedback.blockReason}`);

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned text that is not valid JSON");
  }
}
