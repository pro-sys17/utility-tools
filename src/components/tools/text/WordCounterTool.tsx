"use client";

import * as React from "react";
import { Button } from "@/components/common/Button";
import { CopyButton } from "@/components/common/CopyButton";
import { Textarea } from "@/components/common/Input";
import { analyzeText, TextMetrics } from "@/lib/text/text-utils";
import { RotateCcw, Sparkles, BookOpen, Mic } from "lucide-react";

const SAMPLE_TEXT = `Welcome to UtilityHub, a comprehensive suite of developer, document, and media tools built for speed and security.

When you process documents or code on UtilityHub, every operation executes directly within your local browser runtime. This ensures that sensitive company data, confidential PDF contracts, and private keys never touch remote external servers.

With native Web APIs and client-side processing, you get instantaneous feedback without network lag or upload queues.`;

export function WordCounterTool() {
  const [text, setText] = React.useState<string>(SAMPLE_TEXT);

  const metrics: TextMetrics = React.useMemo(() => {
    return analyzeText(text);
  }, [text]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.words}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Words</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.characters}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Characters</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.charactersNoSpaces}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">No Spaces</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.sentences}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Sentences</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.paragraphs}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Paragraphs</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.lines}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Lines</p>
        </div>
      </div>

      {/* Reading & Speaking Estimates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Reading Time</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              ~{metrics.readingTimeMinutes} {metrics.readingTimeMinutes === 1 ? "minute" : "minutes"}{" "}
              (at 200 wpm)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 shrink-0">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Speaking Time</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              ~{metrics.speakingTimeMinutes}{" "}
              {metrics.speakingTimeMinutes === 1 ? "minute" : "minutes"} (at 130 wpm)
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Document Text</span>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE_TEXT)}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sample</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setText("")}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
          {text && <CopyButton text={text} size="sm" />}
        </div>
      </div>

      {/* Textarea */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type, paste, or draft your content here..."
        className="h-[280px] text-sm leading-relaxed"
      />

      {/* Top Keywords Table */}
      {metrics.topWords.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Top Keyword Density
          </h4>
          <div className="flex flex-wrap gap-2">
            {metrics.topWords.map((item) => (
              <span
                key={item.word}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <span>{item.word}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono">
                  {item.count}× ({item.percentage}%)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
