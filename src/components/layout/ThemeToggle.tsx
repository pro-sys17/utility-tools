"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { Button } from "../common/Button";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("utility_hub_theme") as ThemeMode) || "system";
}

function getServerThemeSnapshot(): ThemeMode {
  return "system";
}

export function ThemeToggle() {
  const theme = React.useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const cycleTheme = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    localStorage.setItem("utility_hub_theme", nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Click to toggle)`}
      aria-label="Toggle visual theme"
      className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
    >
      {theme === "light" && <Sun className="h-5 w-5" />}
      {theme === "dark" && <Moon className="h-5 w-5" />}
      {theme === "system" && <Laptop className="h-5 w-5" />}
    </Button>
  );
}
