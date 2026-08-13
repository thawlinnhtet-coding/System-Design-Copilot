"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemePreference = "system" | "light" | "dark";

const themeStorageKey = "theme-preference:v1";

const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const themeListeners = new Set<() => void>();

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function ThemeToggle() {
  const preference = useSyncExternalStore<ThemePreference>(subscribeTheme, readStoredTheme, () => "system");

  function changeTheme() {
    const next = nextTheme[preference];

    if (next === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = next;
    }

    try {
      if (next === "system") {
        window.localStorage.removeItem(themeStorageKey);
      } else {
        window.localStorage.setItem(themeStorageKey, next);
      }
    } catch {
      // The in-memory preference still applies for this session.
    }

    themeListeners.forEach((listener) => listener());
  }

  const Icon = preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;

  return (
    <button
      aria-label={`Theme: ${preference}. Switch to ${nextTheme[preference]} theme`}
      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-alt hover:text-foreground"
      onClick={changeTheme}
      type="button"
    >
      <Icon aria-hidden="true" size={15} />
      <span className="hidden sm:inline">{preference}</span>
    </button>
  );
}
