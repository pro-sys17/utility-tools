import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface PdfSplitResult {
  filename: string;
  data: Uint8Array;
  pageCount: number;
}

/**
 * Parse human page ranges like "1-3, 5, 7-10" into 1-based unique sorted page numbers.
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    // If empty, return all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.add(i);
    }
    return Array.from(pages);
  }

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pages.add(i);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Merge multiple PDF documents into one single PDF.
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (pdfBuffers.length === 0) {
    throw new Error("No PDF files provided to merge.");
  }

  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  return await mergedDoc.save();
}

/**
 * Split a PDF into either individual pages or a custom subset of pages.
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  pageRangeStr: string,
  mode: "extract-range" | "separate-all" = "extract-range"
): Promise<PdfSplitResult[]> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error("The PDF document contains no pages.");
  }

  if (mode === "separate-all") {
    const results: PdfSplitResult[] = [];
    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copiedPage);
      const data = await singleDoc.save();
      results.push({
        filename: `page-${i + 1}.pdf`,
        data,
        pageCount: 1,
      });
    }
    return results;
  }

  // Extract selected pages into one new PDF document
  const selectedPages = parsePageRanges(pageRangeStr, totalPages);
  if (selectedPages.length === 0) {
    throw new Error(`No valid pages selected within document range (1 - ${totalPages}).`);
  }

  const destDoc = await PDFDocument.create();
  // 0-based indices for pdf-lib
  const indices = selectedPages.map((p) => p - 1);
  const copiedPages = await destDoc.copyPages(srcDoc, indices);
  for (const page of copiedPages) {
    destDoc.addPage(page);
  }

  const data = await destDoc.save();
  return [
    {
      filename: `extracted-pages-${selectedPages[0]}-to-${selectedPages[selectedPages.length - 1]}.pdf`,
      data,
      pageCount: selectedPages.length,
    },
  ];
}

/**
 * Compress PDF by stripping unnecessary metadata and rebuilding objects.
 */
export async function compressPdf(pdfBuffer: ArrayBuffer): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  // Clean metadata
  srcDoc.setTitle("");
  srcDoc.setAuthor("");
  srcDoc.setSubject("");
  srcDoc.setKeywords([]);
  srcDoc.setProducer("UtilityHub Local PDF Engine");
  srcDoc.setCreator("UtilityHub");

  // Re-save with object stream compression
  return await srcDoc.save({ useObjectStreams: true });
}

/**
 * Inspect page count and dimensions of a PDF.
 */
export async function getPdfInfo(pdfBuffer: ArrayBuffer): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  dimensions: { width: number; height: number }[];
}> {
  const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  const dimensions: { width: number; height: number }[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    dimensions.push({ width: Math.round(width), height: Math.round(height) });
  }

  return {
    pageCount,
    title: doc.getTitle(),
    author: doc.getAuthor(),
    dimensions,
  };
}

/**
 * Convert multiple image files into a single PDF document.
 */
export async function imagesToPdf(
  images: { buffer: ArrayBuffer; type: "image/jpeg" | "image/png" | string }[],
  options?: {
    pageSize?: "fit-image" | "a4";
    margin?: number;
  }
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error("No images provided to convert.");
  }

  const pdfDoc = await PDFDocument.create();
  const margin = options?.margin ?? 20;

  for (const img of images) {
    let embeddedImage;
    if (img.type === "image/png") {
      embeddedImage = await pdfDoc.embedPng(img.buffer);
    } else {
      // Default to JPEG
      embeddedImage = await pdfDoc.embedJpg(img.buffer);
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    if (options?.pageSize === "a4") {
      // Standard A4: 595.28 x 841.89 points
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
    } else {
      // Fit page to image size + margins
      const pageWidth = imgWidth + margin * 2;
      const pageHeight = imgHeight + margin * 2;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      page.drawImage(embeddedImage, {
        x: margin,
        y: margin,
        width: imgWidth,
        height: imgHeight,
      });
    }
  }

  return await pdfDoc.save();
}

export interface TextAnnotation {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  fontSize: number;
  color: string;
}

export interface DrawingStroke {
  id: string;
  points: { xPct: number; yPct: number }[];
  color: string;
  width: number;
}

export interface RectangleAnnotation {
  id: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  color: string;
  opacity: number;
}

export type PdfFontFamily = "helvetica" | "times" | "courier";

export function resolveStandardFont(
  family?: PdfFontFamily,
  isBold?: boolean,
  isItalic?: boolean
): StandardFonts {
  if (family === "times") {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (family === "courier") {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

/**
 * Sanitize Unicode text for PDF StandardFonts (WinAnsi encoding).
 * Automatically converts currency symbols (e.g. ₹ -> Rs.), typographical punctuation,
 * and replaces unencodable characters with safe fallbacks so export never crashes.
 */
export function sanitizeTextForFont(
  text: string,
  font?: { encodeText: (text: string) => unknown }
): string {
  if (!text) return "";

  // 1. Common Unicode replacements & transliterations
  const cleaned = text
    .replace(/\u20B9/g, "Rs. ") // Indian Rupee (₹)
    .replace(/\u20BD/g, "RUB ") // Russian Ruble (₽)
    .replace(/\u20BA/g, "TRY ") // Turkish Lira (₺)
    .replace(/\u20B4/g, "UAH ") // Ukrainian Hryvnia (₴)
    .replace(/\u20BF/g, "BTC ") // Bitcoin (₿)
    .replace(/\u20AB/g, "VND ") // Vietnamese Dong (₫)
    .replace(/\u20A9/g, "KRW ") // Korean Won (₩)
    .replace(/\u20AA/g, "ILS ") // Israeli Shekel (₪)
    .replace(/\u20B5/g, "GHS ") // Ghanaian Cedi (₵)
    .replace(/\u20B8/g, "KZT ") // Kazakhstani Tenge (₸)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Single quotes & apostrophes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Double quotes
    .replace(/[\u2013\u2014\u2015]/g, "-") // En/em dashes
    .replace(/\u2026/g, "...") // Ellipsis
    .replace(/[\u2022\u25E6\u2023\u2043]/g, "*") // Bullets
    .replace(/\u2032/g, "'") // Prime
    .replace(/\u2033/g, '"') // Double prime
    .replace(/\u2122/g, "(TM)") // Trademark
    .replace(/\u2116/g, "No.") // Numero sign
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " "); // Spaces

  if (!font || typeof font.encodeText !== "function") {
    return cleaned;
  }

  // 2. Character-by-character encode validation against the specific embedded font
  let result = "";
  for (const char of cleaned) {
    try {
      font.encodeText(char);
      result += char;
    } catch {
      // If a character cannot be encoded in WinAnsi, fallback to '?'
      result += "?";
    }
  }

  return result;
}

export interface TextReplacement {
  id: string;
  originalText: string;
  newText: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  fontSize: number;
  color: string;
  backgroundColor: string;
  fontFamily?: PdfFontFamily;
  isBold?: boolean;
  isItalic?: boolean;
  detectedFontName?: string;
}

export interface PageEditState {
  pageIndex: number;
  rotationOffset: number;
  isDeleted: boolean;
  texts: TextAnnotation[];
  drawings: DrawingStroke[];
  rectangles: RectangleAnnotation[];
  replacements?: TextReplacement[];
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Apply in-browser PDF modifications including text annotations, drawing strokes,
 * highlights/redactions, page rotations, and page removals.
 */
export async function applyPdfEdits(
  pdfBuffer: ArrayBuffer | Uint8Array,
  edits: Record<number, PageEditState>
): Promise<Uint8Array> {
  const safeBytes =
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.slice()
      : new Uint8Array(pdfBuffer.slice(0));
  const doc = await PDFDocument.load(safeBytes, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  // Dynamic font embedding cache
  type EmbeddedFontType = Awaited<ReturnType<typeof doc.embedFont>>;
  const fontCache = new Map<StandardFonts, EmbeddedFontType>();
  const getFont = async (standardFont: StandardFonts): Promise<EmbeddedFontType> => {
    let f = fontCache.get(standardFont);
    if (!f) {
      f = await doc.embedFont(standardFont);
      fontCache.set(standardFont, f);
    }
    return f;
  };

  const deletedIndices: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    const edit = edits[i];
    if (!edit) continue;

    if (edit.isDeleted) {
      deletedIndices.push(i);
      continue;
    }

    const page = doc.getPage(i);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // 1. Rotation
    if (edit.rotationOffset && edit.rotationOffset % 360 !== 0) {
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + edit.rotationOffset) % 360));
    }

    // 2. Text Replacements (Whiteout original & render replacement with matched font)
    if (edit.replacements) {
      for (const rep of edit.replacements) {
        if (!rep.newText && !rep.originalText) continue;

        const bg = parseHexColor(rep.backgroundColor || "#ffffff");
        const x = rep.xPct * pageWidth;
        const y = pageHeight - (rep.yPct * pageHeight) - (rep.heightPct * pageHeight);
        const width = rep.widthPct * pageWidth;
        const height = rep.heightPct * pageHeight;

        // Opaque background to conceal original text
        page.drawRectangle({
          x: Math.max(0, x - 1),
          y: Math.max(0, y - 1),
          width: Math.min(pageWidth, width + 3),
          height: Math.min(pageHeight, height + 3),
          color: rgb(bg.r, bg.g, bg.b),
          opacity: 1.0,
        });

        // Draw new replacement text using the matched font
        if (rep.newText.trim()) {
          const fg = parseHexColor(rep.color || "#000000");
          const textY = pageHeight - (rep.yPct * pageHeight) - rep.fontSize;
          const targetFontEnum = resolveStandardFont(rep.fontFamily, rep.isBold, rep.isItalic);
          const matchedFont = await getFont(targetFontEnum);
          const safeText = sanitizeTextForFont(rep.newText, matchedFont);

          page.drawText(safeText, {
            x: Math.max(0, x),
            y: Math.max(0, textY),
            size: rep.fontSize,
            font: matchedFont,
            color: rgb(fg.r, fg.g, fg.b),
          });
        }
      }
    }

    // 3. Rectangles / Highlights / Redactions
    for (const rect of edit.rectangles) {
      const c = parseHexColor(rect.color);
      const x = rect.xPct * pageWidth;
      const y = pageHeight - (rect.yPct * pageHeight) - (rect.heightPct * pageHeight);
      const width = rect.widthPct * pageWidth;
      const height = rect.heightPct * pageHeight;

      page.drawRectangle({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.min(pageWidth, width),
        height: Math.min(pageHeight, height),
        color: rgb(c.r, c.g, c.b),
        opacity: rect.opacity,
      });
    }

    // 3. Freehand Drawings / Signatures
    for (const stroke of edit.drawings) {
      const c = parseHexColor(stroke.color);
      if (stroke.points.length < 2) continue;

      for (let p = 0; p < stroke.points.length - 1; p++) {
        const p1 = stroke.points[p];
        const p2 = stroke.points[p + 1];

        const x1 = p1.xPct * pageWidth;
        const y1 = pageHeight - (p1.yPct * pageHeight);
        const x2 = p2.xPct * pageWidth;
        const y2 = pageHeight - (p2.yPct * pageHeight);

        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: stroke.width,
          color: rgb(c.r, c.g, c.b),
        });
      }
    }

    // 4. Texts
    const defaultFont = await getFont(StandardFonts.Helvetica);
    for (const textItem of edit.texts) {
      if (!textItem.text.trim()) continue;
      const c = parseHexColor(textItem.color);
      const x = textItem.xPct * pageWidth;
      const y = pageHeight - (textItem.yPct * pageHeight) - textItem.fontSize;
      const safeText = sanitizeTextForFont(textItem.text, defaultFont);

      page.drawText(safeText, {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: textItem.fontSize,
        font: defaultFont,
        color: rgb(c.r, c.g, c.b),
      });
    }
  }

  // Remove deleted pages in descending order
  if (deletedIndices.length >= totalPages) {
    throw new Error("Cannot delete all pages in the PDF document.");
  }

  for (const idx of deletedIndices.sort((a, b) => b - a)) {
    doc.removePage(idx);
  }

  return await doc.save();
}

