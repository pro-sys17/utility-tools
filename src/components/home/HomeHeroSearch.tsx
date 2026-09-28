"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { CommandPalette } from "../layout/CommandPalette";

export function HomeHeroSearch() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="w-full max-w-2xl mx-auto flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md shadow-lg shadow-blue-500/5 hover:border-blue-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 cursor-pointer transition-all duration-200 group"
      >
        <div className="flex items-center space-x-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <Search className="h-5 w-5" />
          <span className="text-base text-slate-500 dark:text-slate-400">
            Search tools, formats, or keywords... (e.g. pdf, compress, uuid)
          </span>
        </div>

        <kbd className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
          <span>Ctrl</span>
          <span>K</span>
        </kbd>
      </div>

      <CommandPalette isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
