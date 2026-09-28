"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { getPdfInfo, splitPdf } from "@/lib/pdf/pdf-engine";
import { createZipArchive } from "@/lib/archive/zip-engine";
import { downloadBlob } from "@/lib/file/download-utils";
import { Download, RotateCcw, CheckCircle2, Scissors, FileText } from "lucide-react";

export function SplitPdfTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState<number>(0);
  const [mode, setMode] = React.useState<"extract-range" | "separate-all">("extract-range");
  const [rangeInput, setRangeInput] = React.useState<string>("1");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [resultBlob, setResultBlob] = React.useState<{ blob: Blob; filename: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const meta = await getPdfInfo(buffer);
      setPageCount(meta.pageCount);
      setFile(selectedFile);
      setRangeInput(`1-${Math.min(3, meta.pageCount)}`);
    } catch {
      setError("Unable to read PDF file. Please ensure it is a valid, unencrypted PDF.");
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();

      if (mode === "separate-all") {
        const pages = await splitPdf(buffer, "", "separate-all");
        // Package pages into a ZIP archive
        const zipFiles = pages.map((p) => ({
          name: p.filename,
          content: p.data,
        }));
        const zipBlob = await createZipArchive(zipFiles);
        setResultBlob({
          blob: zipBlob,
          filename: `${file.name.replace(/\.pdf$/i, "")}-split-pages.zip`,
        });
      } else {
        const results = await splitPdf(buffer, rangeInput, "extract-range");
        if (results.length === 0) {
          throw new Error("No pages extracted.");
        }
        const pdfBlob = new Blob([results[0].data as BlobPart], { type: "application/pdf" });
        setResultBlob({
          blob: pdfBlob,
          filename: `${file.name.replace(/\.pdf$/i, "")}-extracted.pdf`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(`Split failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setResultBlob(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {resultBlob ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              PDF Pages Split Successfully!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Your split document is ready for download.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => downloadBlob(resultBlob.blob, resultBlob.filename)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-5 w-5" />
                <span>Download Result</span>
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
                <span>Split Another PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          acceptedTypes={["application/pdf"]}
          multiple={false}
          title="Select a PDF to split"
          subtitle="Extract specific page ranges or extract all pages as individual files"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total pages: <strong className="text-slate-700 dark:text-slate-300">{pageCount}</strong>
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              <span>Change file</span>
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setMode("extract-range")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mode === "extract-range"
                  ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <h5 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Extract Page Range
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Combine selected pages into a single new PDF document.
              </p>
            </div>

            <div
              onClick={() => setMode("separate-all")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mode === "separate-all"
                  ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <h5 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Separate All Pages
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Extract each page into a separate PDF file and bundle into a ZIP.
              </p>
            </div>
          </div>

          {mode === "extract-range" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Page Range (e.g. 1-3, 5, 7)
              </label>
              <Input
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={`1-${pageCount}`}
              />
              <p className="text-[11px] text-slate-500">
                Specify pages to include. Available page numbers: 1 to {pageCount}.
              </p>
            </div>
          )}

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              statusMessage="Splitting and preparing PDF pages..."
            />
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSplit} disabled={isProcessing}>
              <Scissors className="h-5 w-5" />
              <span>{mode === "separate-all" ? "Extract All to ZIP" : "Extract Pages"}</span>
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-sm border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}
    </div>
  );
}
