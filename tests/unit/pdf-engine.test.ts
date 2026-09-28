import { describe, it, expect } from "vitest";
import { parsePageRanges, parseHexColor, applyPdfEdits, PageEditState } from "../../src/lib/pdf/pdf-engine";
import { PDFDocument } from "pdf-lib";

describe("pdf-engine", () => {
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

