"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { loadPdfDocument, convertPdfPageToImage } from "@/lib/pdf/pdf-render";
import { createZipArchive } from "@/lib/archive/zip-engine";
import { downloadBlob } from "@/lib/file/download-utils";
import { Download, RotateCcw, Image as ImageIcon, FileText, CheckCircle2 } from "lucide-react";

interface ConvertedPage {
  pageNumber: number;
  blob: Blob;
  previewUrl: string;
}

export function PdfToJpgTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState<"image/jpeg" | "image/png">("image/jpeg");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [convertedPages, setConvertedPages] = React.useState<ConvertedPage[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      convertedPages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [convertedPages]);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setError(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(new Uint8Array(buffer));
      const totalPages = pdfDoc.numPages;

      const pages: ConvertedPage[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const blob = await convertPdfPageToImage(pdfDoc, i, format, 0.92, 2.0);
        const previewUrl = URL.createObjectURL(blob);
        pages.push({ pageNumber: i, blob, previewUrl });
        setProgress(Math.round((i / totalPages) * 100));
      }

      setConvertedPages(pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(`Failed to convert PDF pages: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (convertedPages.length === 0) return;
    const ext = format === "image/jpeg" ? "jpg" : "png";
    const files = convertedPages.map((p) => ({
      name: `page-${p.pageNumber}.${ext}`,
      content: p.blob,
    }));
    const zipBlob = await createZipArchive(files);
    downloadBlob(zipBlob, `${file?.name.replace(/\.pdf$/i, "")}-images.zip`);
  };

  const handleReset = () => {
    convertedPages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setFile(null);
    setConvertedPages([]);
    setProgress(0);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {convertedPages.length > 0 ? (
        <div className="space-y-6">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">
                    Converted {convertedPages.length} {convertedPages.length === 1 ? "page" : "pages"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Exported as high-resolution {format === "image/jpeg" ? "JPEG" : "PNG"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="md" onClick={handleDownloadAllZip} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="h-4 w-4" />
                  <span>Download All as ZIP</span>
                </Button>
                <Button variant="outline" size="md" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  <span>Convert Another</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Page Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {convertedPages.map((page) => (
              <div
                key={page.pageNumber}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.previewUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Page {page.pageNumber}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      downloadBlob(
                        page.blob,
                        `page-${page.pageNumber}.${format === "image/jpeg" ? "jpg" : "png"}`
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          acceptedTypes={["application/pdf"]}
          multiple={false}
          title="Select a PDF to convert to images"
          subtitle="Extract every page as a high-quality JPG or PNG"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ready to convert</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              <span>Change file</span>
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Output Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === "image/jpeg"}
                  onChange={() => setFormat("image/jpeg")}
                  className="text-blue-600"
                />
                <span>JPEG (Smaller size, standard)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === "image/png"}
                  onChange={() => setFormat("image/png")}
                  className="text-blue-600"
                />
                <span>PNG (Lossless, sharper)</span>
              </label>
            </div>
          </div>

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              progress={progress}
              statusMessage={`Rendering PDF pages to images (${progress}%)...`}
            />
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={handleConvert} disabled={isProcessing}>
              <ImageIcon className="h-5 w-5" />
              <span>Convert PDF Pages</span>
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
