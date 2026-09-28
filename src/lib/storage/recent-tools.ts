import * as React from "react";

const RECENT_TOOLS_KEY = "utility_hub_recent_tools";
const MAX_RECENT_TOOLS = 12;

export function getRecentToolSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentToolSlug(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    const current = getRecentToolSlugs().filter((s) => s !== slug);
    const updated = [slug, ...current].slice(0, MAX_RECENT_TOOLS);
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("utility_hub_recent_changed", { detail: updated }));
  } catch {
    // Ignore storage quota or disabled storage
  }
}

export function clearRecentTools(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_TOOLS_KEY);
    window.dispatchEvent(new CustomEvent("utility_hub_recent_changed", { detail: [] }));
  } catch {
    // Ignore
  }
}

function subscribeRecent(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("utility_hub_recent_changed", callback);
  return () => window.removeEventListener("utility_hub_recent_changed", callback);
}

function getRecentSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(RECENT_TOOLS_KEY) || "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

export function useRecentToolSlugs(): string[] {
  const raw = React.useSyncExternalStore(subscribeRecent, getRecentSnapshot, getServerSnapshot);
  return React.useMemo(() => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }, [raw]);
}
