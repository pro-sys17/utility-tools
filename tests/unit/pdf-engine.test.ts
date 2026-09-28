import { describe, it, expect } from "vitest";
import {
  parsePageRanges,
  parseHexColor,
  applyPdfEdits,
  PageEditState,
  resolveStandardFont,
  sanitizeTextForFont,
} from "../../src/lib/pdf/pdf-engine";
import { detectFontProperties, sampleColorsFromCanvas } from "../../src/lib/pdf/pdf-render";
import { PDFDocument, StandardFonts } from "pdf-lib";

describe("pdf-engine", () => {
  describe("sanitizeTextForFont", () => {
    it("converts Indian Rupee symbol (₹) to Rs. so WinAnsi doesn't fail", async () => {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const text = "Total Due: ₹ 2,500.00";
      const sanitized = sanitizeTextForFont(text, font);
      expect(sanitized).toBe("Total Due: Rs.  2,500.00");
      expect(() => font.encodeText(sanitized)).not.toThrow();
    });

    it("sanitizes smart quotes, em dashes, and ellipses", async () => {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const text = "“Hello”—it’s 2026…";
      const sanitized = sanitizeTextForFont(text, font);
      expect(() => font.encodeText(sanitized)).not.toThrow();
    });
  });

  describe("parsePageRanges", () => {
    it("parses single page", () => {
      expect(parsePageRanges("3", 10)).toEqual([3]);
    });

    it("parses page ranges like 1-4", () => {
      expect(parsePageRanges("1-4", 10)).toEqual([1, 2, 3, 4]);
    });

    it("parses combined ranges e.g. 1-3, 5, 8-10", () => {
      expect(parsePageRanges("1-3, 5, 8-10", 10)).toEqual([1, 2, 3, 5, 8, 9, 10]);
    });

    it("clamps ranges within total pages", () => {
      expect(parsePageRanges("8-15", 10)).toEqual([8, 9, 10]);
    });

    it("returns all pages if input is empty", () => {
      expect(parsePageRanges("", 4)).toEqual([1, 2, 3, 4]);
    });
  });

  describe("resolveStandardFont", () => {
    it("correctly maps font family and styles to StandardFonts", () => {
      expect(resolveStandardFont("times", false, false)).toBe(StandardFonts.TimesRoman);
      expect(resolveStandardFont("times", true, false)).toBe(StandardFonts.TimesRomanBold);
      expect(resolveStandardFont("times", false, true)).toBe(StandardFonts.TimesRomanItalic);
      expect(resolveStandardFont("times", true, true)).toBe(StandardFonts.TimesRomanBoldItalic);

      expect(resolveStandardFont("courier", false, false)).toBe(StandardFonts.Courier);
      expect(resolveStandardFont("courier", true, false)).toBe(StandardFonts.CourierBold);
      expect(resolveStandardFont("courier", false, true)).toBe(StandardFonts.CourierOblique);
      expect(resolveStandardFont("courier", true, true)).toBe(StandardFonts.CourierBoldOblique);

      expect(resolveStandardFont("helvetica", false, false)).toBe(StandardFonts.Helvetica);
      expect(resolveStandardFont("helvetica", true, false)).toBe(StandardFonts.HelveticaBold);
      expect(resolveStandardFont("helvetica", false, true)).toBe(StandardFonts.HelveticaOblique);
      expect(resolveStandardFont("helvetica", true, true)).toBe(StandardFonts.HelveticaBoldOblique);
    });
  });

  describe("detectFontProperties", () => {
    it("detects Serif / Times New Roman fonts with styles", () => {
      const res = detectFontProperties("TimesNewRomanPS-BoldItalicMT");
      expect(res.family).toBe("times");
      expect(res.isBold).toBe(true);
      expect(res.isItalic).toBe(true);
      expect(res.detectedName).toContain("Times New Roman / Serif");
    });

    it("detects Monospace / Courier fonts", () => {
      const res = detectFontProperties("Courier-Bold");
      expect(res.family).toBe("courier");
      expect(res.isBold).toBe(true);
      expect(res.isItalic).toBe(false);
      expect(res.detectedName).toContain("Courier / Monospace");
    });

    it("defaults to Sans-serif / Helvetica for standard modern fonts", () => {
      const res = detectFontProperties("ArialMT", { fontFamily: "sans-serif" });
      expect(res.family).toBe("helvetica");
      expect(res.isBold).toBe(false);
      expect(res.isItalic).toBe(false);
      expect(res.detectedName).toContain("Helvetica / Sans-serif");
    });
  });

  describe("parseHexColor", () => {
    it("correctly parses 6-digit hex colors", () => {
      expect(parseHexColor("#ff0000")).toEqual({ r: 1, g: 0, b: 0 });
      expect(parseHexColor("#00ff00")).toEqual({ r: 0, g: 1, b: 0 });
      expect(parseHexColor("#0000ff")).toEqual({ r: 0, g: 0, b: 1 });
    });

    it("correctly parses 3-digit hex colors", () => {
      expect(parseHexColor("#fff")).toEqual({ r: 1, g: 1, b: 1 });
      expect(parseHexColor("#000")).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe("applyPdfEdits", () => {
    it("applies text, rectangles, drawings, rotations, and page deletions", async () => {
      // Create a test 3-page PDF
      const doc = await PDFDocument.create();
      doc.addPage([500, 700]);
      doc.addPage([500, 700]);
      doc.addPage([500, 700]);
      const initialBytes = await doc.save();

      const edits: Record<number, PageEditState> = {
        0: {
          pageIndex: 0,
          rotationOffset: 0,
          isDeleted: false,
          texts: [
            {
              id: "t1",
              text: "Hello World",
              xPct: 0.1,
              yPct: 0.1,
              fontSize: 18,
              color: "#000000",
            },
          ],
          drawings: [
            {
              id: "d1",
              color: "#ff0000",
              width: 3,
              points: [
                { xPct: 0.2, yPct: 0.2 },
                { xPct: 0.3, yPct: 0.3 },
              ],
            },
          ],
          rectangles: [
            {
              id: "r1",
              xPct: 0.1,
              yPct: 0.4,
              widthPct: 0.5,
              heightPct: 0.1,
              color: "#ffff00",
              opacity: 0.5,
            },
          ],
        },
        1: {
          pageIndex: 1,
          rotationOffset: 90,
          isDeleted: false,
          texts: [],
          drawings: [],
          rectangles: [],
        },
        2: {
          pageIndex: 2,
          rotationOffset: 0,
          isDeleted: true, // Delete 3rd page
          texts: [],
          drawings: [],
          rectangles: [],
        },
      };

      const editedBytes = await applyPdfEdits(initialBytes.buffer as ArrayBuffer, edits);
      expect(editedBytes.length).toBeGreaterThan(0);

      const modifiedDoc = await PDFDocument.load(editedBytes);
      // Originally 3 pages, 1 deleted -> 2 pages
      expect(modifiedDoc.getPageCount()).toBe(2);

      // Verify rotation on page 1
      const page1 = modifiedDoc.getPage(1);
      expect(page1.getRotation().angle).toBe(90);
    });

    it("applies in-place text replacements by concealing old text and rendering new text", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([500, 700]);
      const initialBytes = await doc.save();

      const edits: Record<number, PageEditState> = {
        0: {
          pageIndex: 0,
          rotationOffset: 0,
          isDeleted: false,
          texts: [],
          drawings: [],
          rectangles: [],
          replacements: [
            {
              id: "rep1",
              originalText: "Old Invoice Total: $100",
              newText: "New Invoice Total: $250",
              xPct: 0.1,
              yPct: 0.2,
              widthPct: 0.4,
              heightPct: 0.05,
              fontSize: 16,
              color: "#000000",
              backgroundColor: "#ffffff",
            },
          ],
        },
      };

      const editedBytes = await applyPdfEdits(initialBytes.buffer as ArrayBuffer, edits);
      expect(editedBytes.length).toBeGreaterThan(0);

      // Verify it also accepts Uint8Array directly
      const editedFromUint8 = await applyPdfEdits(initialBytes, edits);
      expect(editedFromUint8.length).toBeGreaterThan(0);

      const modifiedDoc = await PDFDocument.load(editedBytes);
      expect(modifiedDoc.getPageCount()).toBe(1);
    });

    it("successfully encodes Indian Rupee symbol (₹) in text replacements during export", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([500, 700]);
      const bytes = await doc.save();

      const edits: Record<number, PageEditState> = {
        0: {
          pageIndex: 0,
          rotationOffset: 0,
          isDeleted: false,
          texts: [],
          drawings: [],
          rectangles: [],
          replacements: [
            {
              id: "rep-rupee",
              originalText: "$100",
              newText: "₹ 7,500.00",
              xPct: 0.1,
              yPct: 0.2,
              widthPct: 0.3,
              heightPct: 0.05,
              fontSize: 16,
              color: "#000000",
              backgroundColor: "#ffffff",
            },
          ],
        },
      };

      // This used to fail with: WinAnsi cannot encode "₹" (0x20b9)
      const result = await applyPdfEdits(bytes, edits);
      expect(result.length).toBeGreaterThan(0);
    });

    it("applies text replacements with custom text color and background tint during export", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([500, 700]);
      const bytes = await doc.save();

      const edits: Record<number, PageEditState> = {
        0: {
          pageIndex: 0,
          rotationOffset: 0,
          isDeleted: false,
          texts: [],
          drawings: [],
          rectangles: [],
          replacements: [
            {
              id: "rep-custom-color",
              originalText: "Original Headline",
              newText: "Updated Premium Headline",
              xPct: 0.1,
              yPct: 0.15,
              widthPct: 0.5,
              heightPct: 0.05,
              fontSize: 18,
              color: "#1d4ed8", // Deep blue
              backgroundColor: "#fef3c7", // Warm parchment tint
              fontFamily: "times",
              isBold: true,
              isItalic: false,
            },
          ],
        },
      };

      const result = await applyPdfEdits(bytes, edits);
      expect(result.length).toBeGreaterThan(0);
    });

    it("sampleColorsFromCanvas extracts high-contrast stroke color and corner background color", () => {
      const mockCanvas = {
        width: 100,
        height: 100,
        getContext: () => ({
          getImageData: (_x: number, _y: number, w: number, h: number) => {
            const data = new Uint8ClampedArray(w * h * 4);
            // Default background: white (255, 255, 255, 255)
            for (let i = 0; i < w * h; i++) {
              data[i * 4] = 255;
              data[i * 4 + 1] = 255;
              data[i * 4 + 2] = 255;
              data[i * 4 + 3] = 255;
            }
            // Text glyph stroke in center: blue (29, 78, 216, 255)
            for (let cy = Math.floor(h * 0.3); cy <= Math.floor(h * 0.7); cy++) {
              for (let cx = Math.floor(w * 0.3); cx <= Math.floor(w * 0.7); cx++) {
                const idx = (cy * w + cx) * 4;
                data[idx] = 29;
                data[idx + 1] = 78;
                data[idx + 2] = 216;
                data[idx + 3] = 255;
              }
            }
            return { data, width: w, height: h };
          },
        }),
      } as unknown as HTMLCanvasElement;

      const sampled = sampleColorsFromCanvas(mockCanvas, 0.1, 0.1, 0.2, 0.1);
      expect(sampled.backgroundColor.toLowerCase()).toBe("#ffffff");
      expect(sampled.textColor.toLowerCase()).toBe("#1d4ed8");
    });

    it("throws an error when trying to delete all pages", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([500, 700]);
      const bytes = await doc.save();

      const edits: Record<number, PageEditState> = {
        0: {
          pageIndex: 0,
          rotationOffset: 0,
          isDeleted: true,
          texts: [],
          drawings: [],
          rectangles: [],
        },
      };

      await expect(
        applyPdfEdits(bytes.buffer as ArrayBuffer, edits)
      ).rejects.toThrow("Cannot delete all pages in the PDF document.");
    });
  });

  describe("PDFDocument generation", () => {
    it("creates a valid blank PDF document and adds pages", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([600, 400]);
      doc.addPage([600, 400]);

      expect(doc.getPageCount()).toBe(2);

      const bytes = await doc.save();
      expect(bytes.length).toBeGreaterThan(0);
    });
  });
});

