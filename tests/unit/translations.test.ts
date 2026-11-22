import { describe, expect, it } from "vitest";
import { DICTIONARIES, LANGS, isLang, translate } from "@/lib/i18n/dictionaries";

const englishKeys = Object.keys(DICTIONARIES.en) as (keyof typeof DICTIONARIES.en)[];

describe("translations", () => {
  it("offers English and Hindi as the main languages", () => {
    expect(LANGS.filter((l) => l.main).map((l) => l.code)).toEqual(["en", "hi"]);
  });

  it.each(LANGS.map((l) => [l.code, l.english] as const))("%s (%s) translates every piece of text", (code) => {
    const missing = englishKeys.filter((key) => !DICTIONARIES[code][key]?.trim());
    expect(missing).toEqual([]);
  });

  it("falls back to English for unknown keys and rejects unknown language codes", () => {
    expect(translate("ta", "nav.submit")).toBe(DICTIONARIES.ta["nav.submit"]);
    expect(isLang("te")).toBe(true);
    expect(isLang("xx")).toBe(false);
  });
});
