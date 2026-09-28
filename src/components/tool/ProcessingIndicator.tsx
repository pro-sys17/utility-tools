"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ProcessingIndicatorProps {
  progress?: number; // 0 to 100, or undefined for indeterminate
  statusMessage?: string;
  isProcessing: boolean;
  onCancel?: () => void;
}

export function ProcessingIndicator({
  progress,
  statusMessage = "Processing your files locally...",
  isProcessing,
  onCancel,
}: ProcessingIndicatorProps) {
  if (!isProcessing) return null;

  const isIndeterminate = progress === undefined || progress < 0;

  return (
    <div className="w-full rounded-2xl border border-blue-200 bg-blue-50/80 p-5 dark:border-blue-900/60 dark:bg-blue-950/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2.5">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin dark:text-blue-400" />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {statusMessage}
          </span>
        </div>
        {!isIndeterminate && (
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/70 dark:bg-blue-900/60">
        {isIndeterminate ? (
          <div className="h-full w-1/3 rounded-full bg-blue-600 dark:bg-blue-400 animate-indeterminate" />
        ) : (
          <div
            className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </div>

      {onCancel && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-medium"
          >
            Cancel operation
          </button>
        </div>
      )}
    </div>
  );
}
