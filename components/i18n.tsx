"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGS, isLang, translate, type Lang, type MessageKey } from "@/lib/i18n/dictionaries";

/**
 * Language switching for the public pages: English and Hindi first, then eight more Indian languages.
 * The choice is saved in the browser. Pages are rendered in English on the
 * server, then switch to the chosen language in the browser, so pages stay fast.
 */
const KEY = "ev-lang";
const listeners = new Set<() => void>();

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    return isLang(saved) ? saved : "en";
  } catch {
    return "en";
  }
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // Storage can be blocked; the switch then lasts until the page reloads.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => "en");
}

/** Returns a translate function for the current language (for strings passed as props). */
export function useT() {
  const lang = useLang();
  return (k: MessageKey) => translate(lang, k);
}

/** Renders a translated piece of text. Usable inside server components too. */
export function T({ k }: { k: MessageKey }) {
  const lang = useLang();
  const dir = LANGS.find((l) => l.code === lang)?.dir;
  return (
    <span lang={lang} dir={dir === "rtl" ? "rtl" : undefined}>
      {translate(lang, k)}
    </span>
  );
}

/** Keeps <html lang> in sync and listens for language commands from the command palette. */
export function LanguageSync() {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const onSet = (event: Event) => setLang((event as CustomEvent<Lang>).detail);
    window.addEventListener("ev:set-lang", onSet);
    return () => window.removeEventListener("ev:set-lang", onSet);
  }, []);
  return null;
}

export function LanguageSwitcher() {
  const lang = useLang();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Change language">
          <Languages aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] w-56 overflow-y-auto">
        <DropdownMenuLabel>
          <T k="lang.label" />
        </DropdownMenuLabel>
        {LANGS.filter((l) => l.main).map((option) => (
          <LangItem key={option.code} option={option} current={lang} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          <T k="lang.more" />
        </DropdownMenuLabel>
        {LANGS.filter((l) => !l.main).map((option) => (
          <LangItem key={option.code} option={option} current={lang} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LangItem({ option, current }: { option: (typeof LANGS)[number]; current: Lang }) {
  return (
    <DropdownMenuItem onSelect={() => setLang(option.code)}>
      <span lang={option.code} dir={option.dir}>
        {option.name}
      </span>
      {option.code !== "en" && <span className="text-xs text-muted-foreground">{option.english}</span>}
      {option.code === current && <Check className="ml-auto" aria-hidden />}
    </DropdownMenuItem>
  );
}
