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
  textColor?: string;
  backgroundColor?: string;
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
  // Pass a cloned byte copy so the caller's original ArrayBuffer is never transferred or detached
  const clonedData =
    data instanceof Uint8Array ? data.slice() : new Uint8Array(data.slice(0));
  const loadingTask = pdfjs.getDocument({ data: clonedData });
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
 * Sample the exact text color and underlying page background color from the rendered PDF canvas
 * at the given relative coordinates (0 to 1).
 * Uses pixel contrast clustering against corner samples to accurately isolate the glyph stroke color.
 */
export function sampleColorsFromCanvas(
  canvas: HTMLCanvasElement,
  xPct: number,
  yPct: number,
  widthPct: number,
  heightPct: number
): { textColor: string; backgroundColor: string } {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return { textColor: "#000000", backgroundColor: "#ffffff" };
    }

    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // Convert percentages to pixel bounding box, with a 2px padding to sample background
    const startX = Math.max(0, Math.floor(xPct * canvasW) - 2);
    const startY = Math.max(0, Math.floor(yPct * canvasH) - 2);
    const w = Math.min(canvasW - startX, Math.ceil(widthPct * canvasW) + 4);
    const h = Math.min(canvasH - startY, Math.ceil(heightPct * canvasH) + 4);

    if (w <= 0 || h <= 0) {
      return { textColor: "#000000", backgroundColor: "#ffffff" };
    }

    const imgData = ctx.getImageData(startX, startY, w, h);
    const data = imgData.data;

    // Sample corner pixels to detect the background color
    const cornerOffsets = [
      0, // top-left
      (w - 1) * 4, // top-right
      ((h - 1) * w) * 4, // bottom-left
      ((h - 1) * w + (w - 1)) * 4, // bottom-right
    ];

    let sumBgR = 0, sumBgG = 0, sumBgB = 0;
    let countBg = 0;

    for (const offset of cornerOffsets) {
      if (offset >= 0 && offset + 3 < data.length) {
        sumBgR += data[offset];
        sumBgG += data[offset + 1];
        sumBgB += data[offset + 2];
        countBg++;
      }
    }

    let bgR = 255, bgG = 255, bgB = 255;
    if (countBg > 0) {
      bgR = Math.round(sumBgR / countBg);
      bgG = Math.round(sumBgG / countBg);
      bgB = Math.round(sumBgB / countBg);
    }

    const bgHex = rgbToHex(bgR, bgG, bgB);

    // Find pixels that contrast significantly with the sampled background (text stroke pixels)
    interface ContrastingPixel {
      r: number;
      g: number;
      b: number;
      delta: number;
    }

    const contrastingPixels: ContrastingPixel[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue; // ignore transparent pixels

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const delta = Math.sqrt(
        Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
      );

      // Distinct from background
      if (delta > 35) {
        contrastingPixels.push({ r, g, b, delta });
      }
    }

    if (contrastingPixels.length === 0) {
      // Default based on background brightness
      const luma = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
      return {
        textColor: luma > 128 ? "#000000" : "#ffffff",
        backgroundColor: bgHex,
      };
    }

    // Sort by contrast delta (descending) to avoid anti-aliased edge blend
    contrastingPixels.sort((a, b) => b.delta - a.delta);

    // Take top 25% most contrasting core pixels
    const sampleSize = Math.max(1, Math.floor(contrastingPixels.length * 0.25));
    let textR = 0, textG = 0, textB = 0;
    for (let i = 0; i < sampleSize; i++) {
      textR += contrastingPixels[i].r;
      textG += contrastingPixels[i].g;
      textB += contrastingPixels[i].b;
    }

    textR = Math.round(textR / sampleSize);
    textG = Math.round(textG / sampleSize);
    textB = Math.round(textB / sampleSize);

    return {
      textColor: rgbToHex(textR, textG, textB),
      backgroundColor: bgHex,
    };
  } catch (err) {
    console.error("Color sampling error:", err);
    return { textColor: "#000000", backgroundColor: "#ffffff" };
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

