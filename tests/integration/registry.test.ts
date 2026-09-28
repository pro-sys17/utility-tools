import { describe, it, expect } from "vitest";
import {
  getAllTools,
  getToolBySlug,
  getToolsByCategory,
  searchTools,
} from "../../src/lib/registry/tools";
import { CATEGORIES } from "../../src/lib/registry/categories";

describe("Tool Registry Integration", () => {
  it("contains all 15 required first-phase active tools", () => {
    const requiredActiveSlugs = [
      "pdf-viewer",
      "merge-pdf",
      "split-pdf",
      "pdf-compress",
      "pdf-to-jpg",
      "jpg-to-pdf",
      "zip-creator",
      "zip-extractor",
      "json-formatter",
      "json-validator",
      "base64-converter",
      "uuid-generator",
      "text-diff",
      "word-counter",
      "image-compressor",
    ];

    const allTools = getAllTools();
    const activeTools = allTools.filter((t) => t.status === "active");
    const activeSlugs = activeTools.map((t) => t.slug);

    for (const slug of requiredActiveSlugs) {
      expect(activeSlugs).toContain(slug);
    }
  });

  it("resolves each tool uniquely by slug", () => {
    const allTools = getAllTools();
    const slugs = new Set<string>();

    for (const tool of allTools) {
      expect(slugs.has(tool.slug)).toBe(false);
      slugs.add(tool.slug);

      const found = getToolBySlug(tool.slug);
      expect(found).toBeDefined();
      expect(found?.id).toBe(tool.id);
    }
  });

  it("assigns valid categories belonging to CATEGORIES registry", () => {
    const validCategoryIds = new Set(CATEGORIES.map((c) => c.id));
    const allTools = getAllTools();

    for (const tool of allTools) {
      expect(validCategoryIds.has(tool.category)).toBe(true);
    }

    const pdfTools = getToolsByCategory("pdf");
    expect(pdfTools.length).toBeGreaterThan(0);
    expect(pdfTools.every((t) => t.category === "pdf")).toBe(true);
  });

  it("searches tools accurately by name, keyword, and category", () => {
    const pdfResults = searchTools("pdf");
    expect(pdfResults.length).toBeGreaterThanOrEqual(5);

    const jsonResults = searchTools("json");
    expect(jsonResults.some((t) => t.slug === "json-formatter")).toBe(true);

    const filteredCategory = searchTools("compress", "image");
    expect(filteredCategory.some((t) => t.slug === "image-compressor")).toBe(true);
  });
});
