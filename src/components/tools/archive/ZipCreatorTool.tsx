"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { FileList } from "@/components/file/FileList";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { UtilityFile, createUtilityFile } from "@/lib/file/file-utils";
import { downloadBlob } from "@/lib/file/download-utils";
import { createZipArchive } from "@/lib/archive/zip-engine";
import { formatBytes } from "@/lib/utils";
import { Download, RotateCcw, CheckCircle2, Archive } from "lucide-react";

export function ZipCreatorTool() {
  const [files, setFiles] = React.useState<UtilityFile[]>([]);
  const [zipName, setZipName] = React.useState<string>("archive.zip");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [zipBlob, setZipBlob] = React.useState<Blob | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    const wrapped = newFiles.map(createUtilityFile);
    setFiles((prev) => [...prev, ...wrapped]);
    setError(null);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCreateZip = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const zipPayload = files.map((f) => ({
        name: f.name,
        content: f.file,
      }));

      const blob = await createZipArchive(zipPayload, (pct) => {
        setProgress(pct);
      });

      setZipBlob(blob);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(`Failed to create ZIP: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setZipBlob(null);
    setProgress(0);
    setError(null);
    setIsProcessing(false);
  };

  const totalInputSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6">
      {zipBlob ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                ZIP Archive Created!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Packaged {files.length} files ({formatBytes(totalInputSize)}) into a compressed archive ({formatBytes(zipBlob.size)}).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => downloadBlob(zipBlob, zipName.endsWith(".zip") ? zipName : `${zipName}.zip`)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-5 w-5" />
                <span>Download {zipName}</span>
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
                <span>Create Another ZIP</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            multiple={true}
            title="Drop files of any type to compress into a ZIP"
            subtitle="Secure client-side bundling without file size quotas"
          />

          <FileList files={files} onRemove={handleRemove} />

          {files.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Archive Filename
              </label>
              <Input
                value={zipName}
                onChange={(e) => setZipName(e.target.value)}
                placeholder="archive.zip"
              />
            </div>
          )}

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              progress={progress}
              statusMessage={`Compressing ${files.length} files (${progress}%)...`}
            />
          )}

          {files.length > 0 && !isProcessing && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </Button>

              <Button size="lg" onClick={handleCreateZip}>
                <Archive className="h-5 w-5" />
                <span>Create ZIP Archive ({formatBytes(totalInputSize)})</span>
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
