export interface ExtractedTextItem {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  fontSize: number;
  fontName?: string;
  fontFamily: "helvetica" | "times" | "courier";
  isBold: boolean;
  isItalic: boolean;
  detectedFontName: string;
  cssFontFamily: string;
}

export interface PdfPageProxy {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
  getTextContent: () => Promise<{
    items: Array<{
      str?: string;
      transform?: number[];
      width?: number;
      height?: number;
      fontName?: string;
    }>;
    styles?: Record<string, { fontFamily?: string; ascent?: number; descent?: number }>;
  }>;
}

export interface PdfDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
}

interface PdfJsModule {
  GlobalWorkerOptions: { workerSrc: string };
  version?: string;
  getDocument: (options: { data: ArrayBuffer | Uint8Array }) => {
    promise: Promise<PdfDocumentProxy>;
  };
}

let pdfjsLib: PdfJsModule | null = null;

async function getPdfjs(): Promise<PdfJsModule> {
  if (typeof window === "undefined") {
    throw new Error("PDF rendering is only supported in browser environments.");
  }
  if (!pdfjsLib) {
    const imported = (await import("pdfjs-dist")) as unknown as PdfJsModule;
    pdfjsLib = imported;
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
    }
  }
  return pdfjsLib;
}

export interface RenderPageOptions {
  scale?: number;
  canvas: HTMLCanvasElement;
}

export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<PdfDocumentProxy> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ data });
  return await loadingTask.promise;
}

export async function renderPdfPageToCanvas(
  pdfDoc: PdfDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to get 2D canvas context.");
  }

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}

export async function convertPdfPageToImage(
  pdfDoc: PdfDocumentProxy,
  pageNumber: number,
  format: "image/jpeg" | "image/png" = "image/jpeg",
  quality: number = 0.92,
  scale: number = 2.0
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  await renderPdfPageToCanvas(pdfDoc, pageNumber, canvas, scale);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to convert page ${pageNumber} to image.`));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Classify a font name and CSS font style into standard font family (Helvetica, Times, Courier),
 * bold/italic attributes, and human-readable detected font description.
 */
export function detectFontProperties(
  fontName?: string,
  styleObject?: { fontFamily?: string }
): {
  family: "helvetica" | "times" | "courier";
  isBold: boolean;
  isItalic: boolean;
  detectedName: string;
  cssFontFamily: string;
} {
  const combined = `${fontName || ""} ${styleObject?.fontFamily || ""}`.toLowerCase();

  const isBold =
    combined.includes("bold") ||
    combined.includes("black") ||
    combined.includes("heavy") ||
    combined.includes("bolder") ||
    combined.includes("semibold") ||
    combined.includes("w700") ||
    combined.includes("w800") ||
    combined.includes("w900");

  const isItalic =
    combined.includes("italic") ||
    combined.includes("oblique") ||
    combined.includes("slanted");

  const isSans =
    combined.includes("sans") ||
    combined.includes("arial") ||
    combined.includes("helvetica") ||
    combined.includes("calibri") ||
    combined.includes("roboto") ||
    combined.includes("verdana") ||
    combined.includes("tahoma") ||
    combined.includes("trebuchet") ||
    combined.includes("inter") ||
    combined.includes("gothic");

  const isSerif =
    !isSans &&
    (combined.includes("times") ||
      combined.includes("serif") ||
      combined.includes("georgia") ||
      combined.includes("garamond") ||
      combined.includes("palatino") ||
      combined.includes("cambria") ||
      combined.includes("roman") ||
      combined.includes("baskerville") ||
      combined.includes("minion"));

  const isMonospace =
    combined.includes("courier") ||
    combined.includes("mono") ||
    combined.includes("consolas") ||
    combined.includes("monaco") ||
    combined.includes("menlo") ||
    combined.includes("typewriter");

  const styleLabel =
    isBold && isItalic ? "Bold Italic" : isBold ? "Bold" : isItalic ? "Italic" : "Regular";

  if (isMonospace) {
    return {
      family: "courier",
      isBold,
      isItalic,
      detectedName: `Courier / Monospace (${styleLabel})`,
      cssFontFamily: '"Courier New", Courier, monospace',
    };
  }

  if (isSerif) {
    return {
      family: "times",
      isBold,
      isItalic,
      detectedName: `Times New Roman / Serif (${styleLabel})`,
      cssFontFamily: '"Times New Roman", Times, Georgia, serif',
    };
  }

  return {
    family: "helvetica",
    isBold,
    isItalic,
    detectedName: `Helvetica / Sans-serif (${styleLabel})`,
    cssFontFamily: 'Helvetica, Arial, -apple-system, sans-serif',
  };
}

/**
 * Extract all text items from a PDF page with normalized relative coordinates (0-1),
 * line-grouping, and font metrics to allow interactive in-place text editing.
 */
export async function extractPageTextItems(
  pdfDoc: PdfDocumentProxy,
  pageNumber: number
): Promise<ExtractedTextItem[]> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.0 });
  const textContent = await page.getTextContent();
  const styles = textContent.styles || {};

  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  interface RawItem {
    str: string;
    tx: number;
    ty: number;
    width: number;
    height: number;
    fontSize: number;
    fontName?: string;
    style?: { fontFamily?: string };
  }

  const rawItems: RawItem[] = [];

  for (const item of textContent.items) {
    if (!item || typeof item.str !== "string" || !item.str.trim()) continue;
    if (!item.transform || !Array.isArray(item.transform)) continue;

    const tx = item.transform[4];
    const ty = item.transform[5];
    const fontSize = Math.round(
      Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 12
    );
    const width = item.width || fontSize * item.str.length * 0.6;
    const height = item.height || fontSize;
    const itemStyle = item.fontName ? styles[item.fontName] : undefined;

    rawItems.push({
      str: item.str,
      tx,
      ty,
      width,
      height,
      fontSize,
      fontName: item.fontName,
      style: itemStyle,
    });
  }

  // Sort top-to-bottom, left-to-right
  rawItems.sort((a, b) => {
    const yDiff = b.ty - a.ty;
    if (Math.abs(yDiff) > 3) {
      return yDiff;
    }
    return a.tx - b.tx;
  });

  const grouped: RawItem[] = [];
  for (const item of rawItems) {
    const prev = grouped[grouped.length - 1];
    if (
      prev &&
      Math.abs(prev.ty - item.ty) < 3.5 &&
      item.tx >= prev.tx &&
      item.tx - (prev.tx + prev.width) < item.fontSize * 1.5
    ) {
      const needsSpace =
        !prev.str.endsWith(" ") && !item.str.startsWith(" ") && item.tx > prev.tx + prev.width + 1;
      prev.str += (needsSpace ? " " : "") + item.str;
      prev.width = item.tx + item.width - prev.tx;
      prev.fontSize = Math.max(prev.fontSize, item.fontSize);
    } else {
      grouped.push({ ...item });
    }
  }

  return grouped.map((item, idx) => {
    const top = pageHeight - item.ty - item.fontSize;
    const left = item.tx;
    const fontProp = detectFontProperties(item.fontName, item.style);

    return {
      id: `text_${pageNumber}_${idx}`,
      text: item.str.trim(),
      xPct: Math.max(0, Math.min(1, left / pageWidth)),
      yPct: Math.max(0, Math.min(1, top / pageHeight)),
      widthPct: Math.max(0.01, Math.min(1, item.width / pageWidth)),
      heightPct: Math.max(0.01, Math.min(1, (item.fontSize * 1.3) / pageHeight)),
      fontSize: item.fontSize,
      fontName: item.fontName,
      fontFamily: fontProp.family,
      isBold: fontProp.isBold,
      isItalic: fontProp.isItalic,
      detectedFontName: fontProp.detectedName,
      cssFontFamily: fontProp.cssFontFamily,
    };
  });
}

