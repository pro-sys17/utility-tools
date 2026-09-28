"use client";

import * as React from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import { validateFile } from "@/lib/file/file-utils";

export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSizeInBytes?: number;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function FileDropzone({
  onFilesSelected,
  acceptedTypes,
  maxSizeInBytes = 100 * 1024 * 1024, // 100MB default
  multiple = false,
  title = "Drag & drop your files here",
  subtitle = "or click to browse from your device",
  className = "",
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = (rawFiles: FileList | null) => {
    if (!rawFiles || rawFiles.length === 0) return;
    setErrorMessage(null);

    const validFiles: File[] = [];
    const filesToValidate = multiple ? Array.from(rawFiles) : [rawFiles[0]];

    for (const file of filesToValidate) {
      const validation = validateFile(file, {
        maxSizeInBytes,
        acceptedMimeTypes: acceptedTypes,
      });

      if (!validation.valid) {
        setErrorMessage(validation.error || "Invalid file.");
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset input so same file can be selected again if needed
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-2">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isDragOver
            ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-400 scale-[1.01]"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/60"
        } ${className}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes?.join(",")}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-4 transition-transform group-hover:scale-110 duration-200 shadow-sm">
          <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>

        <h4 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h4>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>

        {acceptedTypes && acceptedTypes.length > 0 && (
          <div className="mt-3 inline-flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            <span>Supported: {acceptedTypes.join(", ")}</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
