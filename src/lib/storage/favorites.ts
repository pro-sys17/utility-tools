import * as React from "react";

const FAVORITES_STORAGE_KEY = "utility_hub_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(toolId: string): boolean {
  return getFavorites().includes(toolId);
}

export function toggleFavorite(toolId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getFavorites();
    let updated: string[];
    let isFav = false;
    if (current.includes(toolId)) {
      updated = current.filter((id) => id !== toolId);
      isFav = false;
    } else {
      updated = [...current, toolId];
      isFav = true;
    }
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("utility_hub_favorites_changed", { detail: updated }));
    return isFav;
  } catch {
    return false;
  }
}

function subscribeFavorites(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("utility_hub_favorites_changed", callback);
  return () => window.removeEventListener("utility_hub_favorites_changed", callback);
}

function getFavoritesSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

export function useFavorites(): string[] {
  const raw = React.useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getServerSnapshot);
  return React.useMemo(() => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }, [raw]);
}

export function useIsFavorite(toolId: string): boolean {
  const favorites = useFavorites();
  return favorites.includes(toolId);
}
