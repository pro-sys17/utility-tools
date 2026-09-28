"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { compressPdf } from "@/lib/pdf/pdf-engine";
import { downloadBlob } from "@/lib/file/download-utils";
import { formatBytes } from "@/lib/utils";
import { Download, RotateCcw, CheckCircle2, Minimize2, FileText } from "lucide-react";

export function PdfCompressTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<{
    blob: Blob;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setError(null);
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const compressedBytes = await compressPdf(buffer);
      const blob = new Blob([compressedBytes as BlobPart], { type: "application/pdf" });

      setResult({
        blob,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(`Compression failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {result ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                PDF Optimized Successfully!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Your PDF has been re-serialized and stripped of redundant metadata.
              </p>
            </div>

            {/* Size Comparison Card */}
            <div className="max-w-md mx-auto grid grid-cols-2 gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500">Original Size</p>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                  {formatBytes(result.originalSize)}
                </p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Optimized Size
                </p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBytes(result.compressedSize)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() =>
                  downloadBlob(result.blob, `optimized-${file?.name || "document.pdf"}`)
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-5 w-5" />
                <span>Download Optimized PDF</span>
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
                <span>Compress Another PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          acceptedTypes={["application/pdf"]}
          multiple={false}
          title="Drop a PDF file to compress"
          subtitle="Reduce file size by removing unneeded objects and restructuring streams"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Original size: {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              <span>Change file</span>
            </Button>
          </div>

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              statusMessage="Re-serializing PDF streams and stripping redundant metadata..."
            />
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={handleCompress} disabled={isProcessing}>
              <Minimize2 className="h-5 w-5" />
              <span>Compress PDF</span>
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
