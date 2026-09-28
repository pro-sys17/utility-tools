"use client";

export interface PdfPageProxy {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
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
