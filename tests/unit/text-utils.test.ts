import { describe, it, expect } from "vitest";
import {
  analyzeText,
  computeTextDiff,
  encodeBase64Text,
  decodeBase64Text,
  generateUuids,
} from "../../src/lib/text/text-utils";

describe("text-utils", () => {
  describe("analyzeText", () => {
    it("handles empty strings", () => {
      const result = analyzeText("");
      expect(result.words).toBe(0);
      expect(result.characters).toBe(0);
      expect(result.lines).toBe(0);
    });

    it("correctly counts words, characters, sentences, and paragraphs", () => {
      const text = "Hello world! This is UtilityHub.\n\nHere is a second paragraph.";
      const result = analyzeText(text);

      expect(result.words).toBe(10);
      expect(result.paragraphs).toBe(2);
      expect(result.characters).toBe(text.length);
      expect(result.sentences).toBeGreaterThanOrEqual(2);
      expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    });

    it("extracts top keyword density correctly", () => {
      const text = "apple banana apple orange apple banana grape";
      const result = analyzeText(text);

      expect(result.topWords[0].word).toBe("apple");
      expect(result.topWords[0].count).toBe(3);
    });
  });

  describe("computeTextDiff", () => {
    it("detects line additions and removals", () => {
      const oldText = "Line 1\nLine 2";
      const newText = "Line 1\nLine 2 modified\nLine 3";

      const diff = computeTextDiff(oldText, newText, "lines");
      expect(diff.additions).toBeGreaterThan(0);
      expect(diff.deletions).toBeGreaterThanOrEqual(0);
    });

    it("detects identical texts", () => {
      const text = "Exact same content";
      const diff = computeTextDiff(text, text, "lines");
      expect(diff.additions).toBe(0);
      expect(diff.deletions).toBe(0);
    });
  });

  describe("encodeBase64Text and decodeBase64Text", () => {
    it("encodes and decodes standard UTF-8 text with emojis", () => {
      const original = "Hello from UtilityHub! 🚀✨";
      const encoded = encodeBase64Text(original);
      const decoded = decodeBase64Text(encoded);

      expect(decoded).toBe(original);
    });

    it("supports URL-safe Base64 encoding", () => {
      const original = "Subject with + and / characters?";
      const encoded = encodeBase64Text(original, true);

      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(decodeBase64Text(encoded)).toBe(original);
    });
  });

  describe("generateUuids", () => {
    it("generates correct number of valid v4 UUIDs", () => {
      const uuids = generateUuids(5);
      expect(uuids.length).toBe(5);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const id of uuids) {
        expect(id).toMatch(uuidRegex);
      }
    });

    it("supports uppercase and no-hyphens options", () => {
      const uuids = generateUuids(2, { uppercase: true, hyphens: false });
      expect(uuids.length).toBe(2);

      for (const id of uuids) {
        expect(id).not.toContain("-");
        expect(id).toBe(id.toUpperCase());
        expect(id.length).toBe(32);
      }
    });

    it("generates nil UUIDs", () => {
      const uuids = generateUuids(1, { version: "nil" });
      expect(uuids[0]).toBe("00000000-0000-0000-0000-000000000000");
    });
  });
});
