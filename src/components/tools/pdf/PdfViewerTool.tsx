"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { getPdfInfo } from "@/lib/pdf/pdf-engine";
import { createSafeObjectUrl, revokeSafeObjectUrl } from "@/lib/file/file-utils";
import { downloadBlob } from "@/lib/file/download-utils";
import { Download, RotateCcw, ZoomIn, ZoomOut, FileText, Maximize2 } from "lucide-react";

export function PdfViewerTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(100);
  const [pdfMeta, setPdfMeta] = React.useState<{
    pageCount: number;
    title?: string;
    dimensions: { width: number; height: number }[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      revokeSafeObjectUrl(objectUrl || undefined);
    };
  }, [objectUrl]);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const meta = await getPdfInfo(buffer);
      setPdfMeta(meta);

      const url = createSafeObjectUrl(selectedFile);
      setObjectUrl(url);
      setFile(selectedFile);
    } catch {
      setError("Unable to read PDF file. The file may be password-protected or corrupted.");
    }
  };

  const handleReset = () => {
    revokeSafeObjectUrl(objectUrl || undefined);
    setFile(null);
    setObjectUrl(null);
    setPdfMeta(null);
    setError(null);
    setZoom(100);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          acceptedTypes={["application/pdf"]}
          multiple={false}
          title="Select a PDF document to view"
          subtitle="View pages, inspect metadata, and read without server uploads"
        />
      ) : (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center space-x-3 text-sm">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</span>
                {pdfMeta && (
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    ({pdfMeta.pageCount} {pdfMeta.pageCount === 1 ? "page" : "pages"})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((z) => Math.max(50, z - 20))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-mono px-2 text-slate-600 dark:text-slate-300">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((z) => Math.min(200, z + 20))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(objectUrl!, "_blank")}
                title="Open in new window"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadBlob(file, file.name)}
              >
                <Download className="h-4 w-4" />
                <span>Save</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                <span>Close</span>
              </Button>
            </div>
          </div>

          {/* PDF Viewer Container */}
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            <CardContent className="p-0">
              <div className="w-full bg-slate-100 dark:bg-slate-950 flex justify-center overflow-auto min-h-[600px] h-[75vh]">
                {objectUrl && (
                  <iframe
                    src={`${objectUrl}#toolbar=1&navpanes=1&zoom=${zoom}`}
                    title={file.name}
                    className="w-full h-full border-0"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
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
