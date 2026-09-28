import { describe, it, expect } from "vitest";
import { formatJson, minifyJson, validateJson } from "../../src/lib/text/json-utils";

describe("json-utils", () => {
  const validJson = '{"name":"UtilityHub","fast":true,"tools":[1,2,3]}';
  const invalidJson = '{"name":"UtilityHub", trailingComma: true,}';

  describe("validateJson", () => {
    it("validates correct JSON syntax", () => {
      const result = validateJson(validJson);
      expect(result.isValid).toBe(true);
      expect(result.keyCount).toBe(3);
      expect(result.byteSize).toBeGreaterThan(0);
    });

    it("catches syntax errors and provides line/column diagnostics", () => {
      const result = validateJson(invalidJson);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.line).toBeGreaterThanOrEqual(1);
    });

    it("handles empty input", () => {
      const result = validateJson("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("empty");
    });
  });

  describe("formatJson", () => {
    it("formats with 2 spaces", () => {
      const result = formatJson(validJson, 2);
      expect(result.success).toBe(true);
      expect(result.result).toContain('  "name": "UtilityHub"');
    });

    it("formats with 4 spaces", () => {
      const result = formatJson(validJson, 4);
      expect(result.success).toBe(true);
      expect(result.result).toContain('    "name": "UtilityHub"');
    });

    it("returns error on invalid json", () => {
      const result = formatJson(invalidJson);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("minifyJson", () => {
    it("removes whitespace and newlines", () => {
      const pretty = '{\n  "key": "value"\n}';
      const result = minifyJson(pretty);
      expect(result.success).toBe(true);
      expect(result.result).toBe('{"key":"value"}');
    });
  });
});
