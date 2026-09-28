import { describe, it, expect } from "vitest";
import { parsePageRanges } from "../../src/lib/pdf/pdf-engine";
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
