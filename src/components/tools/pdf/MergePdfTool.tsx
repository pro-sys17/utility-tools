"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { FileList } from "@/components/file/FileList";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { UtilityFile, createUtilityFile, moveItemInList } from "@/lib/file/file-utils";
import { downloadBlob } from "@/lib/file/download-utils";
import { mergePdfs } from "@/lib/pdf/pdf-engine";
import { Download, RotateCcw, CheckCircle2, Layers } from "lucide-react";

export function MergePdfTool() {
  const [files, setFiles] = React.useState<UtilityFile[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [mergedBlob, setMergedBlob] = React.useState<Blob | null>(null);
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

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const buffers = await Promise.all(files.map((f) => f.file.arrayBuffer()));
      const mergedBytes = await mergePdfs(buffers);
      const blob = new Blob([mergedBytes as BlobPart], { type: "application/pdf" });
      setMergedBlob(blob);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(`Failed to merge PDF files: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (mergedBlob) {
      downloadBlob(mergedBlob, "merged-document.pdf");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setMergedBlob(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {mergedBlob ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              PDFs Merged Successfully!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Your {files.length} documents have been merged into a single consolidated PDF directly in your browser.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button size="lg" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="h-5 w-5" />
                <span>Download Merged PDF</span>
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
                <span>Merge More Files</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            acceptedTypes={["application/pdf"]}
            multiple={true}
            title="Drop PDF files here to merge"
            subtitle="Select multiple PDF documents to combine into one"
          />

          <FileList
            files={files}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            canReorder={true}
          />

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              statusMessage={`Merging ${files.length} PDF documents in browser...`}
            />
          )}

          {files.length > 0 && !isProcessing && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </Button>

              <Button
                size="lg"
                onClick={handleMerge}
                disabled={files.length < 2}
                title={files.length < 2 ? "Add at least 2 PDFs" : "Merge PDFs"}
              >
                <Layers className="h-5 w-5" />
                <span>Merge {files.length} PDFs</span>
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
