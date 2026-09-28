"use client";

import * as React from "react";
import { Button } from "@/components/common/Button";
import { Textarea } from "@/components/common/Input";
import { computeTextDiff, DiffResult } from "@/lib/text/text-utils";
import { RotateCcw, Sparkles } from "lucide-react";

const SAMPLE_OLD = `UtilityHub is a collection of utilities.
It runs on the server.
Files must be uploaded.
Supported formats:
- PDF
- Text`;

const SAMPLE_NEW = `UtilityHub is a collection of high-performance utilities.
It runs 100% locally in your browser.
No files are ever uploaded.
Supported formats:
- PDF
- Text
- Images & Archives`;

export function TextDiffTool() {
  const [oldText, setOldText] = React.useState<string>(SAMPLE_OLD);
  const [newText, setNewText] = React.useState<string>(SAMPLE_NEW);
  const [mode, setMode] = React.useState<"lines" | "words">("lines");

  const diffResult: DiffResult = React.useMemo(() => {
    return computeTextDiff(oldText, newText, mode);
  }, [oldText, newText, mode]);

  const handleClear = () => {
    setOldText("");
    setNewText("");
  };

  const handleSample = () => {
    setOldText(SAMPLE_OLD);
    setNewText(SAMPLE_NEW);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Mode:</span>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              onClick={() => setMode("lines")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === "lines"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Line by Line
            </button>
            <button
              onClick={() => setMode("words")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === "words"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Word by Word
            </button>
          </div>
        </div>

        {/* Change Stats */}
        <div className="flex items-center space-x-3 text-xs font-medium">
          <span className="text-emerald-600 dark:text-emerald-400">
            +{diffResult.additions} additions
          </span>
          <span className="text-red-600 dark:text-red-400">
            -{diffResult.deletions} deletions
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={handleSample}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sample</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* Input Textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">Original Text</label>
          <Textarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="Paste original text here..."
            className="h-[220px] font-mono text-xs leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">Modified Text</label>
          <Textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Paste modified text here..."
            className="h-[220px] font-mono text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* Visual Diff Output */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500">Visual Comparison</label>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 font-mono text-xs leading-relaxed overflow-x-auto min-h-[160px]">
          {diffResult.parts.length === 0 ? (
            <p className="text-slate-400 text-center py-6">Enter text to view comparison.</p>
          ) : (
            diffResult.parts.map((part, index) => {
              if (part.added) {
                return (
                  <span
                    key={index}
                    className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 px-0.5 rounded"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span
                    key={index}
                    className="bg-red-100 text-red-900 line-through dark:bg-red-950/70 dark:text-red-200 px-0.5 rounded"
                  >
                    {part.value}
                  </span>
                );
              }
              return (
                <span key={index} className="text-slate-700 dark:text-slate-300">
                  {part.value}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
