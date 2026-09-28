"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { FileList } from "@/components/file/FileList";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { UtilityFile, createUtilityFile, moveItemInList } from "@/lib/file/file-utils";
import { downloadBlob } from "@/lib/file/download-utils";
import { imagesToPdf } from "@/lib/pdf/pdf-engine";
import { Download, RotateCcw, CheckCircle2, FileInput } from "lucide-react";

export function JpgToPdfTool() {
  const [files, setFiles] = React.useState<UtilityFile[]>([]);
  const [pageSize, setPageSize] = React.useState<"fit-image" | "a4">("a4");
  const [margin, setMargin] = React.useState<number>(20);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    const wrapped = newFiles.map(createUtilityFile);
    setFiles((prev) => [...prev, ...wrapped]);
    setError(null);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveUp = (index: number) => {
    setFiles((prev) => moveItemInList(prev, index, "up"));
  };

  const handleMoveDown = (index: number) => {
    setFiles((prev) => moveItemInList(prev, index, "down"));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const imageInputs = await Promise.all(
        files.map(async (f) => ({
          buffer: await f.file.arrayBuffer(),
          type: f.file.type,
        }))
      );

      const pdfBytes = await imagesToPdf(imageInputs, {
        pageSize,
        margin,
      });

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      setPdfBlob(blob);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(`Failed to convert images to PDF: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPdfBlob(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {pdfBlob ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              PDF Created Successfully!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Your {files.length} {files.length === 1 ? "image" : "images"} have been packaged into a PDF document.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => downloadBlob(pdfBlob, "images-bundle.pdf")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-5 w-5" />
                <span>Download PDF</span>
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
                <span>Convert More Images</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
            multiple={true}
            title="Drop JPG, PNG, or WebP images here"
            subtitle="Combine photos or scanned receipts into a single PDF"
          />

          <FileList
            files={files}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            canReorder={true}
          />

          {files.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Page Layout
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="pageSize"
                      checked={pageSize === "a4"}
                      onChange={() => setPageSize("a4")}
                      className="text-blue-600"
                    />
                    <span>Standard A4</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="pageSize"
                      checked={pageSize === "fit-image"}
                      onChange={() => setPageSize("fit-image")}
                      className="text-blue-600"
                    />
                    <span>Fit to Image Size</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Margin: {margin}pt
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              statusMessage={`Converting ${files.length} images into PDF...`}
            />
          )}

          {files.length > 0 && !isProcessing && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </Button>

              <Button size="lg" onClick={handleConvert}>
                <FileInput className="h-5 w-5" />
                <span>Create PDF ({files.length} {files.length === 1 ? "page" : "pages"})</span>
              </Button>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-sm border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}
    </div>
  );
}
