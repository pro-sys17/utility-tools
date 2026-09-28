"use client";

import * as React from "react";
import { ArrowUp, ArrowDown, Trash2, File as FileIcon } from "lucide-react";
import { UtilityFile } from "@/lib/file/file-utils";
import { formatBytes } from "@/lib/utils";

export interface FileItemProps {
  file: UtilityFile;
  index: number;
  totalFiles: number;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onRemove: (id: string) => void;
  canReorder?: boolean;
}

export function FileItem({
  file,
  index,
  totalFiles,
  onMoveUp,
  onMoveDown,
  onRemove,
  canReorder = false,
}: FileItemProps) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center space-x-3 overflow-hidden mr-3">
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
          <FileIcon className="h-5 w-5" />
        </div>
        <div className="truncate">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {file.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatBytes(file.size)}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1 shrink-0">
        {canReorder && (
          <>
            <button
              onClick={() => onMoveUp && onMoveUp(index)}
              disabled={index === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Move file up"
              title="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => onMoveDown && onMoveDown(index)}
              disabled={index === totalFiles - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Move file down"
              title="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          onClick={() => onRemove(file.id)}
          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
          aria-label={`Remove ${file.name}`}
          title="Remove file"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export interface FileListProps {
  files: UtilityFile[];
  onRemove: (id: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  canReorder?: boolean;
  className?: string;
}

export function FileList({
  files,
  onRemove,
  onMoveUp,
  onMoveDown,
  canReorder = false,
  className = "",
}: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className={`space-y-2 w-full ${className}`}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Selected Files ({files.length})
        </span>
      </div>
      <div className="space-y-2">
        {files.map((file, idx) => (
          <FileItem
            key={file.id}
            file={file}
            index={idx}
            totalFiles={files.length}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
            canReorder={canReorder}
          />
        ))}
      </div>
    </div>
  );
}
