/**
 * Quick capture: something a person dropped or pasted on a page (a photo, a
 * screenshot, a link or some text), waiting to fill in the Submit form.
 * Kept in memory, so it survives moving to /submit without a page reload.
 */
export type Capture = { kind: "IMAGE"; file: File } | { kind: "URL"; url: string } | { kind: "TEXT"; text: string };

let pending: Capture | null = null;
let version = 0;
const listeners = new Set<() => void>();

export function setCapture(capture: Capture) {
  pending = capture;
  version += 1;
  listeners.forEach((listener) => listener());
}

/** Goes up by one with every new capture, so the Submit form notices it. */
export function getCaptureVersion() {
  return version;
}

/** Returns the waiting capture once, then forgets it. */
export function takeCapture(): Capture | null {
  const capture = pending;
  pending = null;
  return capture;
}

export function onCapture(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Works out what was dropped or pasted. Returns null if it isn't something we can check. */
export function readTransfer(data: DataTransfer | null): Capture | null {
  if (!data) return null;
  const file = [...data.files].find((f) => IMAGE_TYPES.includes(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
  if (file) return { kind: "IMAGE", file };
  const uri = data.getData("text/uri-list").split("\n").find((line) => line && !line.startsWith("#"));
  const text = (uri || data.getData("text/plain") || "").trim();
  if (!text) return null;
  if (/^https?:\/\/\S+$/i.test(text)) return { kind: "URL", url: text };
  return text.length >= 20 ? { kind: "TEXT", text: text.slice(0, 5000) } : null;
}
