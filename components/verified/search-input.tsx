"use client";

import { useT } from "@/components/i18n";
import { Input } from "@/components/ui/input";

/** The search box on the Verified page, with its hint in the visitor's language. */
export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const t = useT();
  return (
    <Input name="q" defaultValue={defaultValue} placeholder={t("verified.placeholder")} className="h-12 rounded-full pl-11" aria-label={t("verified.search")} />
  );
}
