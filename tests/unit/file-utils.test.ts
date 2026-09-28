import { describe, it, expect } from "vitest";
import { validateFile, moveItemInList, createUtilityFile } from "../../src/lib/file/file-utils";

describe("file-utils", () => {
  describe("validateFile", () => {
    it("validates file within size limits", () => {
      const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
      const result = validateFile(file, { maxSizeInBytes: 1024 * 1024 });
      expect(result.valid).toBe(true);
    });

    it("rejects files exceeding max size", () => {
      const file = new File(["dummy content larger than 5 bytes"], "big.pdf", {
        type: "application/pdf",
      });
      const result = validateFile(file, { maxSizeInBytes: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds");
    });

    it("validates MIME types and wildcards", () => {
      const file = new File(["img data"], "photo.png", { type: "image/png" });

      expect(validateFile(file, { acceptedMimeTypes: ["image/*"] }).valid).toBe(true);
      expect(validateFile(file, { acceptedMimeTypes: ["image/png"] }).valid).toBe(true);
      expect(validateFile(file, { acceptedMimeTypes: ["application/pdf"] }).valid).toBe(false);
    });
  });

  describe("moveItemInList", () => {
    const list = ["A", "B", "C", "D"];

    it("moves item up correctly", () => {
      const moved = moveItemInList(list, 2, "up");
      expect(moved).toEqual(["A", "C", "B", "D"]);
    });

    it("moves item down correctly", () => {
      const moved = moveItemInList(list, 1, "down");
      expect(moved).toEqual(["A", "C", "B", "D"]);
    });

    it("does not move past start or end bounds", () => {
      expect(moveItemInList(list, 0, "up")).toEqual(list);
      expect(moveItemInList(list, 3, "down")).toEqual(list);
    });
  });

  describe("createUtilityFile", () => {
    it("wraps a File with unique ID and size metadata", () => {
      const file = new File(["data"], "doc.txt", { type: "text/plain" });
      const utilFile = createUtilityFile(file);

      expect(utilFile.name).toBe("doc.txt");
      expect(utilFile.size).toBe(4);
      expect(utilFile.type).toBe("text/plain");
      expect(utilFile.id).toBeDefined();
    });
  });
});
