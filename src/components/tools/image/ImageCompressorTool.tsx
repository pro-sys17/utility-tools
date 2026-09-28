"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { ProcessingIndicator } from "@/components/tool/ProcessingIndicator";
import { compressImage, CompressedImageResult } from "@/lib/image/image-engine";
import { downloadBlob } from "@/lib/file/download-utils";
import { formatBytes } from "@/lib/utils";
import { Download, RotateCcw, Sliders } from "lucide-react";

export function ImageCompressorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [quality, setQuality] = React.useState<number>(80);
  const [format, setFormat] = React.useState<"image/jpeg" | "image/webp" | "image/png">("image/jpeg");
  const [maxWidth, setMaxWidth] = React.useState<number>(1920);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<CompressedImageResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (result?.dataUrl) {
        URL.revokeObjectURL(result.dataUrl);
      }
    };
  }, [result]);

  const runCompression = React.useCallback(
    async (targetFile: File, q: number, fmt: "image/jpeg" | "image/webp" | "image/png", maxW: number) => {
      setIsProcessing(true);
      setError(null);

      try {
        const compressed = await compressImage(targetFile, {
          quality: q / 100,
          format: fmt,
          maxWidth: maxW,
        });
        setResult(compressed);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred";
        setError(`Failed to compress image: ${msg}`);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const handleFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    runCompression(selected, quality, format, maxWidth);
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (file) {
      runCompression(file, newQ, format, maxWidth);
    }
  };

  const handleFormatChange = (newFmt: "image/jpeg" | "image/webp" | "image/png") => {
    setFormat(newFmt);
    if (file) {
      runCompression(file, quality, newFmt, maxWidth);
    }
  };

  const handleReset = () => {
    if (result?.dataUrl) {
      URL.revokeObjectURL(result.dataUrl);
    }
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const ext = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    downloadBlob(result.blob, `${nameWithoutExt}-compressed.${ext}`);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
          multiple={false}
          title="Select an image to compress"
          subtitle="Supports JPG, PNG, and WebP up to 100MB with client-side Canvas optimization"
        />
      ) : (
        <div className="space-y-6">
          {/* Settings Panel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Compression Settings
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Quality Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Quality</span>
                  <span>{quality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) =>
                    handleFormatChange(e.target.value as "image/jpeg" | "image/webp" | "image/png")
                  }
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="image/jpeg">JPEG (Universal, great compression)</option>
                  <option value="image/webp">WebP (Modern, high efficiency)</option>
                  <option value="image/png">PNG (Lossless, sharp edges)</option>
                </select>
              </div>

              {/* Max Width */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Max Width: {maxWidth}px
                </label>
                <input
                  type="range"
                  min="400"
                  max="3840"
                  step="100"
                  value={maxWidth}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setMaxWidth(val);
                    if (file) runCompression(file, quality, format, val);
                  }}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Results Comparison & Preview */}
          {result && (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-center">
                <div>
                  <p className="text-xs text-slate-500">Original Size</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Compressed Size</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Space Saved</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {result.savingsPercentage > 0 ? `-${result.savingsPercentage}%` : "0%"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dimensions</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {result.width} × {result.height}px
                  </p>
                </div>
              </div>

              {/* Preview Image */}
              <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.dataUrl}
                    alt="Compressed output"
                    className="max-h-[500px] w-auto object-contain rounded-lg shadow-sm"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <Button variant="ghost" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  <span>Compress another image</span>
                </Button>

                <Button size="lg" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="h-5 w-5" />
                  <span>Download Compressed Image</span>
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <ProcessingIndicator
              isProcessing={isProcessing}
              statusMessage="Compressing image on Canvas..."
            />
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
