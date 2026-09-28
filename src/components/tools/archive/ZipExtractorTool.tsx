"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { extractZipArchive, ExtractedZipItem } from "@/lib/archive/zip-engine";
import { downloadBlob } from "@/lib/file/download-utils";
import { formatBytes } from "@/lib/utils";
import { Download, RotateCcw, FolderArchive, File, Folder } from "lucide-react";

export function ZipExtractorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [extractedItems, setExtractedItems] = React.useState<ExtractedZipItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const zipFile = files[0];
    setFile(zipFile);
    setError(null);
    setIsProcessing(true);

    try {
      const buffer = await zipFile.arrayBuffer();
      const items = await extractZipArchive(buffer);
      setExtractedItems(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid archive format";
      setError(`Failed to read ZIP archive: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadItem = async (item: ExtractedZipItem) => {
    try {
      const blob = await item.getBlob();
      const cleanName = item.name.split("/").filter(Boolean).pop() || "extracted-file";
      downloadBlob(blob, cleanName);
    } catch {
      setError(`Failed to extract ${item.name}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedItems([]);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          acceptedTypes={["application/zip", "application/x-zip-compressed"]}
          multiple={false}
          title="Select a ZIP archive to extract"
          subtitle="Inspect file listings and extract individual files directly in browser"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <FolderArchive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {extractedItems.length} files and directories ({formatBytes(file.size)})
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              <span>Extract another ZIP</span>
            </Button>
          </div>

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              statusMessage="Unpacking archive file entries..."
            />
          )}

          {extractedItems.length > 0 && (
            <Card className="border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {extractedItems.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden mr-4">
                      {item.isDir ? (
                        <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                      ) : (
                        <File className="h-4 w-4 text-blue-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 font-mono truncate">
                          {item.name}
                        </p>
                        {!item.isDir && item.size > 0 && (
                          <span className="text-[11px] text-slate-500">
                            {formatBytes(item.size)}
                          </span>
                        )}
                      </div>
                    </div>

                    {!item.isDir && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadItem(item)}
                        className="shrink-0 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
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
