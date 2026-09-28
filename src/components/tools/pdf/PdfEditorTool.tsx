"use client";

import * as React from "react";
import { FileDropzone } from "@/components/file/FileDropzone";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import {
  applyPdfEdits,
  PageEditState,
  TextAnnotation,
  DrawingStroke,
  RectangleAnnotation,
  getPdfInfo,
} from "@/lib/pdf/pdf-engine";
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
  PdfDocumentProxy,
} from "@/lib/pdf/pdf-render";
import { downloadBlob } from "@/lib/file/download-utils";
import {
  Type,
  PenTool,
  Highlighter,
  ShieldAlert,
  RotateCw,
  Trash2,
  Undo2,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  AlertTriangle,
  Eraser,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type EditorMode = "text" | "draw" | "highlight" | "redact";

const PRESET_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "Blue", value: "#2563eb" },
  { label: "Red", value: "#dc2626" },
  { label: "Green", value: "#16a34a" },
  { label: "White", value: "#ffffff" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#facc15" },
  { label: "Green", value: "#4ade80" },
  { label: "Cyan", value: "#38bdf8" },
  { label: "Pink", value: "#f472b6" },
];

export function PdfEditorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = React.useState<ArrayBuffer | null>(null);
  const [pdfDoc, setPdfDoc] = React.useState<PdfDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [scale, setScale] = React.useState(1.4);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportSuccess, setExportSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Editor modes and tool states
  const [mode, setMode] = React.useState<EditorMode>("text");
  const [textColor, setTextColor] = React.useState("#000000");
  const [fontSize, setFontSize] = React.useState(16);
  const [textInput, setTextInput] = React.useState("Approved");
  const [penColor, setPenColor] = React.useState("#dc2626");
  const [penWidth, setPenWidth] = React.useState(3);
  const [highlightColor, setHighlightColor] = React.useState("#facc15");

  // Per-page edits mapping: 0-indexed page indices
  const [edits, setEdits] = React.useState<Record<number, PageEditState>>({});

  // Canvas refs
  const baseCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Active interaction refs
  const isPointerDownRef = React.useRef(false);
  const activeStrokeRef = React.useRef<{ xPct: number; yPct: number }[]>([]);
  const rectStartRef = React.useRef<{ xPct: number; yPct: number } | null>(null);
  const rectCurrentRef = React.useRef<{ xPct: number; yPct: number } | null>(null);

  const pageIndex = currentPage - 1;
  const currentEdit = React.useMemo(() => {
    return (
      edits[pageIndex] || {
        pageIndex,
        rotationOffset: 0,
        isDeleted: false,
        texts: [],
        drawings: [],
        rectangles: [],
      }
    );
  }, [edits, pageIndex]);

  // 1. Handle PDF file selection
  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setError(null);
    setIsLoading(true);
    setExportSuccess(false);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const meta = await getPdfInfo(buffer);
      const loadedDoc = await loadPdfDocument(buffer);

      setFile(selectedFile);
      setFileBuffer(buffer);
      setPdfDoc(loadedDoc);
      setTotalPages(meta.pageCount);
      setCurrentPage(1);
      setEdits({});
    } catch {
      setError("Unable to read PDF file. The file may be password-protected or corrupted.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Redraw Overlay Canvas with annotations
  const redrawOverlay = React.useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const width = overlay.width;
    const height = overlay.height;

    ctx.clearRect(0, 0, width, height);

    // Draw saved rectangles
    for (const rect of currentEdit.rectangles) {
      ctx.save();
      ctx.fillStyle = rect.color;
      ctx.globalAlpha = rect.opacity;
      ctx.fillRect(
        rect.xPct * width,
        rect.yPct * height,
        rect.widthPct * width,
        rect.heightPct * height
      );
      ctx.restore();
    }

    // Draw in-progress rectangle preview
    if (rectStartRef.current && rectCurrentRef.current) {
      const start = rectStartRef.current;
      const cur = rectCurrentRef.current;
      const minX = Math.min(start.xPct, cur.xPct);
      const minY = Math.min(start.yPct, cur.yPct);
      const w = Math.abs(cur.xPct - start.xPct);
      const h = Math.abs(cur.yPct - start.yPct);

      ctx.save();
      const isRedact = mode === "redact";
      ctx.fillStyle = isRedact ? "#000000" : highlightColor;
      ctx.globalAlpha = isRedact ? 1.0 : 0.4;
      ctx.fillRect(minX * width, minY * height, w * width, h * height);
      ctx.strokeStyle = isRedact ? "#dc2626" : "#ca8a04";
      ctx.lineWidth = 1;
      ctx.strokeRect(minX * width, minY * height, w * width, h * height);
      ctx.restore();
    }

    // Draw saved drawing strokes
    for (const stroke of currentEdit.drawings) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1.0;

      const p0 = stroke.points[0];
      ctx.moveTo(p0.xPct * width, p0.yPct * height);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.xPct * width, pt.yPct * height);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw in-progress stroke preview
    if (activeStrokeRef.current.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const p0 = activeStrokeRef.current[0];
      ctx.moveTo(p0.xPct * width, p0.yPct * height);
      for (let i = 1; i < activeStrokeRef.current.length; i++) {
        const pt = activeStrokeRef.current[i];
        ctx.lineTo(pt.xPct * width, pt.yPct * height);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw text annotations
    for (const textItem of currentEdit.texts) {
      ctx.save();
      ctx.fillStyle = textItem.color;
      // Adjust preview font size for scale factor (rendered at scale 1.4)
      const scaledFontSize = Math.max(10, Math.round(textItem.fontSize * (scale / 1.0)));
      ctx.font = `600 ${scaledFontSize}px Helvetica, Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(textItem.text, textItem.xPct * width, textItem.yPct * height);
      ctx.restore();
    }
  }, [currentEdit, mode, highlightColor, penColor, penWidth, scale]);

  // 3. Render Base PDF Page on Canvas
  React.useEffect(() => {
    if (!pdfDoc || !baseCanvasRef.current || currentPage < 1 || currentPage > totalPages) return;

    let isMounted = true;

    const render = async () => {
      try {
        const baseCanvas = baseCanvasRef.current;
        if (!baseCanvas) return;
        const dims = await renderPdfPageToCanvas(pdfDoc, currentPage, baseCanvas, scale);

        if (!isMounted) return;

        // Size overlay canvas identically to base canvas
        const overlayCanvas = overlayCanvasRef.current;
        if (overlayCanvas) {
          overlayCanvas.width = dims.width;
          overlayCanvas.height = dims.height;
          redrawOverlay();
        }
      } catch (err) {
        console.error("Failed to render page to canvas:", err);
      }
    };

    render();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, totalPages, scale, redrawOverlay]);

  React.useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  // 4. Update Edit State Helper
  const updateCurrentPageEdit = (updater: (prev: PageEditState) => PageEditState) => {
    setEdits((prev) => {
      const existing = prev[pageIndex] || {
        pageIndex,
        rotationOffset: 0,
        isDeleted: false,
        texts: [],
        drawings: [],
        rectangles: [],
      };
      return {
        ...prev,
        [pageIndex]: updater(existing),
      };
    });
    setExportSuccess(false);
  };

  // 5. Canvas Pointer Interactions
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { xPct: 0, yPct: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      xPct: Math.max(0, Math.min(1, x / rect.width)),
      yPct: Math.max(0, Math.min(1, y / rect.height)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentEdit.isDeleted) return;
    const coords = getCanvasCoords(e);
    isPointerDownRef.current = true;

    if (mode === "text") {
      if (!textInput.trim()) return;
      const newText: TextAnnotation = {
        id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: textInput.trim(),
        xPct: coords.xPct,
        yPct: coords.yPct,
        fontSize,
        color: textColor,
      };
      updateCurrentPageEdit((prev) => ({
        ...prev,
        texts: [...prev.texts, newText],
      }));
      isPointerDownRef.current = false;
      return;
    }

    if (mode === "draw") {
      activeStrokeRef.current = [coords];
      redrawOverlay();
      return;
    }

    if (mode === "highlight" || mode === "redact") {
      rectStartRef.current = coords;
      rectCurrentRef.current = coords;
      redrawOverlay();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || currentEdit.isDeleted) return;
    const coords = getCanvasCoords(e);

    if (mode === "draw") {
      activeStrokeRef.current.push(coords);
      redrawOverlay();
      return;
    }

    if (mode === "highlight" || mode === "redact") {
      rectCurrentRef.current = coords;
      redrawOverlay();
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (mode === "draw" && activeStrokeRef.current.length > 1) {
      const newStroke: DrawingStroke = {
        id: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        points: [...activeStrokeRef.current],
        color: penColor,
        width: penWidth,
      };
      activeStrokeRef.current = [];
      updateCurrentPageEdit((prev) => ({
        ...prev,
        drawings: [...prev.drawings, newStroke],
      }));
      return;
    }

    if (
      (mode === "highlight" || mode === "redact") &&
      rectStartRef.current &&
      rectCurrentRef.current
    ) {
      const start = rectStartRef.current;
      const cur = rectCurrentRef.current;
      const minX = Math.min(start.xPct, cur.xPct);
      const minY = Math.min(start.yPct, cur.yPct);
      const widthPct = Math.abs(cur.xPct - start.xPct);
      const heightPct = Math.abs(cur.yPct - start.yPct);

      // Only add if dragging covered at least 0.5% of dimension
      if (widthPct > 0.005 && heightPct > 0.005) {
        const isRedact = mode === "redact";
        const newRect: RectangleAnnotation = {
          id: `rect_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          xPct: minX,
          yPct: minY,
          widthPct,
          heightPct,
          color: isRedact ? "#000000" : highlightColor,
          opacity: isRedact ? 1.0 : 0.4,
        };
        updateCurrentPageEdit((prev) => ({
          ...prev,
          rectangles: [...prev.rectangles, newRect],
        }));
      }

      rectStartRef.current = null;
      rectCurrentRef.current = null;
      redrawOverlay();
    }
  };

  // 6. Rotate Page (+90 deg)
  const handleRotatePage = () => {
    updateCurrentPageEdit((prev) => ({
      ...prev,
      rotationOffset: (prev.rotationOffset + 90) % 360,
    }));
  };

  // 7. Toggle Page Deletion
  const handleToggleDeletePage = () => {
    // Check if other non-deleted pages exist
    if (!currentEdit.isDeleted) {
      let nonDeletedCount = 0;
      for (let i = 0; i < totalPages; i++) {
        if (i === pageIndex) continue;
        if (!edits[i]?.isDeleted) {
          nonDeletedCount++;
        }
      }
      if (nonDeletedCount === 0) {
        setError("You cannot delete all pages in the PDF document.");
        return;
      }
    }
    setError(null);
    updateCurrentPageEdit((prev) => ({
      ...prev,
      isDeleted: !prev.isDeleted,
    }));
  };

  // 8. Undo Last Action on Current Page
  const handleUndo = () => {
    updateCurrentPageEdit((prev) => {
      if (prev.texts.length > 0 && mode === "text") {
        return { ...prev, texts: prev.texts.slice(0, -1) };
      }
      if (prev.drawings.length > 0 && mode === "draw") {
        return { ...prev, drawings: prev.drawings.slice(0, -1) };
      }
      if (prev.rectangles.length > 0 && (mode === "highlight" || mode === "redact")) {
        return { ...prev, rectangles: prev.rectangles.slice(0, -1) };
      }
      // General fallback: pop from whichever has latest
      if (prev.texts.length > 0) {
        return { ...prev, texts: prev.texts.slice(0, -1) };
      }
      if (prev.drawings.length > 0) {
        return { ...prev, drawings: prev.drawings.slice(0, -1) };
      }
      if (prev.rectangles.length > 0) {
        return { ...prev, rectangles: prev.rectangles.slice(0, -1) };
      }
      return prev;
    });
  };

  // 9. Clear All Annotations on Current Page
  const handleClearPage = () => {
    updateCurrentPageEdit((prev) => ({
      ...prev,
      texts: [],
      drawings: [],
      rectangles: [],
    }));
  };

  // 10. Delete Individual Annotation
  const handleDeleteText = (id: string) => {
    updateCurrentPageEdit((prev) => ({
      ...prev,
      texts: prev.texts.filter((t) => t.id !== id),
    }));
  };

  const handleDeleteRect = (id: string) => {
    updateCurrentPageEdit((prev) => ({
      ...prev,
      rectangles: prev.rectangles.filter((r) => r.id !== id),
    }));
  };

  const handleDeleteDrawing = (id: string) => {
    updateCurrentPageEdit((prev) => ({
      ...prev,
      drawings: prev.drawings.filter((d) => d.id !== id),
    }));
  };

  // 11. Export & Download Modified PDF
  const handleExport = async () => {
    if (!fileBuffer || !file) return;
    setIsExporting(true);
    setError(null);

    try {
      const modifiedBytes = await applyPdfEdits(fileBuffer, edits);
      const baseName = file.name.replace(/\.pdf$/i, "");
      const outputBlob = new Blob([modifiedBytes as BlobPart], { type: "application/pdf" });
      downloadBlob(outputBlob, `${baseName}-edited.pdf`);
      setExportSuccess(true);
    } catch (err: unknown) {
      console.error("Export error:", err);
      setError(err instanceof Error ? err.message : "Failed to export edited PDF document.");
    } finally {
      setIsExporting(false);
    }
  };

  // Reset tool
  const handleReset = () => {
    setFile(null);
    setFileBuffer(null);
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
    setEdits({});
    setError(null);
    setExportSuccess(false);
  };

  const totalAnnotationsOnPage =
    currentEdit.texts.length + currentEdit.drawings.length + currentEdit.rectangles.length;

  return (
    <div className="space-y-6">
      {!file ? (
        isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Loading PDF pages and preparing editor...
            </p>
          </div>
        ) : (
          <FileDropzone
            onFilesSelected={handleFileSelect}
            acceptedTypes={["application/pdf"]}
            multiple={false}
            title="Select a PDF to Edit"
            subtitle="Add text, signatures, highlights, redactions, and rotate pages locally in your browser"
          />
        )
      ) : (
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 text-sm">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {file.name}
                </span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  ({totalPages} {totalPages === 1 ? "page" : "pages"})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export & Download PDF</span>
                  </>
                )}
              </Button>

              <Button variant="ghost" size="sm" onClick={handleReset} title="Close file">
                <RotateCcw className="h-4 w-4" />
                <span>Close</span>
              </Button>
            </div>
          </div>

          {/* Success Banner */}
          {exportSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                Your edited PDF document has been downloaded successfully with all modifications burned in!
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 text-sm">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Editing Toolbar */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tool Mode Selector */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === "text"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Type className="h-3.5 w-3.5" />
                  <span>Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("draw")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === "draw"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Draw / Sign</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("highlight")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === "highlight"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Highlighter className="h-3.5 w-3.5" />
                  <span>Highlight</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("redact")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === "redact"
                      ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Redact</span>
                </button>
              </div>

              {/* Page Navigation & Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotatePage}
                  title="Rotate current page 90 degrees clockwise"
                  className="text-xs flex items-center space-x-1"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Rotate</span>
                  {currentEdit.rotationOffset > 0 && (
                    <span className="ml-1 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1 rounded">
                      +{currentEdit.rotationOffset}°
                    </span>
                  )}
                </Button>

                <Button
                  variant={currentEdit.isDeleted ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleToggleDeletePage}
                  title={currentEdit.isDeleted ? "Restore page" : "Mark page for deletion"}
                  className="text-xs flex items-center space-x-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{currentEdit.isDeleted ? "Restore Page" : "Delete Page"}</span>
                </Button>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  title="Undo last annotation"
                  disabled={totalAnnotationsOnPage === 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPage}
                  title="Clear all annotations on current page"
                  disabled={totalAnnotationsOnPage === 0}
                >
                  <Eraser className="h-4 w-4 text-red-500" />
                </Button>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Zoom */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScale((s) => Math.max(0.8, Number((s - 0.2).toFixed(1))))}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] font-mono text-slate-500 w-9 text-center">
                    {Math.round((scale / 1.4) * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScale((s) => Math.min(2.4, Number((s + 0.2).toFixed(1))))}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sub-tool Configuration Panel */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
              {mode === "text" && (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Text:</span>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type text to place..."
                      className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1">
                    {["Approved", "Confidential", "Sign Here", new Date().toISOString().slice(0, 10)].map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTextInput(preset)}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]"
                        >
                          {preset}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Size:</span>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value={12}>12pt</option>
                      <option value={16}>16pt</option>
                      <option value={20}>20pt</option>
                      <option value={24}>24pt</option>
                      <option value={32}>32pt</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">Color:</span>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setTextColor(c.value)}
                        className={`w-5 h-5 rounded-full border ${
                          textColor === c.value
                            ? "ring-2 ring-offset-1 ring-blue-500 scale-110"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <span className="text-slate-400 italic text-[11px] ml-auto">
                    Click anywhere on the PDF page to stamp text.
                  </span>
                </>
              )}

              {mode === "draw" && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">Color:</span>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPenColor(c.value)}
                        className={`w-5 h-5 rounded-full border ${
                          penColor === c.value
                            ? "ring-2 ring-offset-1 ring-blue-500 scale-110"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Thickness:</span>
                    {[2, 4, 6].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setPenWidth(w)}
                        className={`px-2 py-0.5 rounded border text-[11px] ${
                          penWidth === w
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {w}px
                      </button>
                    ))}
                  </div>

                  <span className="text-slate-400 italic text-[11px] ml-auto">
                    Click and drag on the page to sign, circle, or draw markings.
                  </span>
                </>
              )}

              {mode === "highlight" && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">Highlight Color:</span>
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setHighlightColor(c.value)}
                        className={`w-5 h-5 rounded-full border ${
                          highlightColor === c.value
                            ? "ring-2 ring-offset-1 ring-blue-500 scale-110"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <span className="text-slate-400 italic text-[11px] ml-auto">
                    Click and drag a rectangle over text or figures to highlight them.
                  </span>
                </>
              )}

              {mode === "redact" && (
                <>
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-medium">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Redaction Mode (Permanent Blackout)</span>
                  </div>

                  <span className="text-slate-400 italic text-[11px] ml-auto">
                    Click and drag a box over sensitive information to censor it permanently.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Deleted Page Notice */}
          {currentEdit.isDeleted && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Page {currentPage} is marked for deletion.</strong> It will be removed when you export the PDF.
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={handleToggleDeletePage}>
                Restore Page
              </Button>
            </div>
          )}

          {/* Main Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Canvas Viewer Container (3 columns) */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                <CardContent className="p-0">
                  <div className="w-full bg-slate-100 dark:bg-slate-950 flex justify-center items-center overflow-auto min-h-[600px] p-6">
                    <div
                      className={`relative shadow-2xl transition-transform duration-200 ${
                        currentEdit.isDeleted ? "opacity-40 grayscale" : ""
                      }`}
                      style={{
                        transform: `rotate(${currentEdit.rotationOffset}deg)`,
                      }}
                    >
                      {/* Underlying PDF Canvas */}
                      <canvas
                        ref={baseCanvasRef}
                        className="block max-w-none bg-white rounded shadow-sm"
                      />

                      {/* Interactive Editing Overlay Canvas */}
                      <canvas
                        ref={overlayCanvasRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className={`absolute inset-0 z-10 ${
                          currentEdit.isDeleted
                            ? "cursor-not-allowed"
                            : mode === "text"
                            ? "cursor-crosshair"
                            : mode === "draw"
                            ? "cursor-pencil"
                            : "cursor-crosshair"
                        }`}
                        style={{ touchAction: "none" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar: Page Thumbnails & Active Page Annotations (1 column) */}
            <div className="space-y-4">
              {/* Page Navigator Thumbnails */}
              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Pages ({totalPages})
                  </h4>

                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pNum = i + 1;
                      const pEdit = edits[i];
                      const isCurrent = pNum === currentPage;
                      const isDel = pEdit?.isDeleted;
                      const hasNotes =
                        pEdit &&
                        (pEdit.texts.length > 0 ||
                          pEdit.drawings.length > 0 ||
                          pEdit.rectangles.length > 0 ||
                          pEdit.rotationOffset > 0);

                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setCurrentPage(pNum)}
                          className={`relative p-2.5 rounded-lg border text-xs font-medium transition-all text-center ${
                            isCurrent
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                          } ${isDel ? "line-through opacity-50 bg-red-50 dark:bg-red-950/20" : ""}`}
                        >
                          <div>Page {pNum}</div>
                          {hasNotes && !isDel && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
                          )}
                          {isDel && (
                            <span className="text-[10px] text-red-500 font-bold block">Del</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Current Page Layers / Annotations */}
              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Page {currentPage} Layers ({totalAnnotationsOnPage})
                    </h4>
                    {totalAnnotationsOnPage > 0 && (
                      <button
                        type="button"
                        onClick={handleClearPage}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {totalAnnotationsOnPage === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                      No annotations placed on this page yet. Use the tools above to add text, signatures, or highlights.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {/* Texts */}
                      {currentEdit.texts.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Type className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                              &ldquo;{t.text}&rdquo;
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteText(t.id)}
                            className="text-slate-400 hover:text-red-500 ml-2"
                            title="Delete text annotation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Drawings */}
                      {currentEdit.drawings.map((d, idx) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <PenTool className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Stroke #{idx + 1}
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-slate-300"
                              style={{ backgroundColor: d.color }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteDrawing(d.id)}
                            className="text-slate-400 hover:text-red-500 ml-2"
                            title="Delete stroke"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Rectangles */}
                      {currentEdit.rectangles.map((r, idx) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            {r.opacity === 1 ? (
                              <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            ) : (
                              <Highlighter className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            )}
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {r.opacity === 1 ? "Redaction" : "Highlight"} #{idx + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRect(r.id)}
                            className="text-slate-400 hover:text-red-500 ml-2"
                            title="Delete rectangle"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
