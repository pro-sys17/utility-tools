import { PDFDocument } from "pdf-lib";

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
