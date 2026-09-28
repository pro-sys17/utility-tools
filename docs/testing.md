# Testing Strategy

UtilityHub utilizes a multi-tiered testing strategy powered by **Vitest** and **jsdom**.

---

## 1. Unit Tests (`tests/unit/`)
Unit tests focus on deterministic utility functions, conversion algorithms, and validation helpers:
- **`text-utils.test.ts`**: Verifies text metrics calculation (words, characters, sentences, paragraphs, reading time), Myers diff calculation, Base64 UTF-8 roundtrip encoding/decoding, and RFC 4122 UUID format conformance.
- **`json-utils.test.ts`**: Tests JSON validation, indentation, minification, and exact line/column error pointer extraction.
- **`pdf-engine.test.ts`**: Tests page range parsing (e.g. `1-3, 5, 8-10`), document creation, and page copying.
- **`file-utils.test.ts`**: Tests MIME wildcard matching, file size validation, and list item reordering.

Run unit tests:
```bash
npm test
```

---

## 2. Integration Tests (`tests/integration/`)
Integration tests verify subsystem interactions:
- **`registry.test.ts`**:
  - Verifies presence of all 15 Phase 1 active tools
  - Ensures slug uniqueness across all registered tools
  - Verifies valid category mappings
  - Tests fuzzy search and keyword resolution

---

## 3. End-to-End (E2E) Flow Validation
Core user workflows are verified through production builds and automated page prerendering:
1. Merge multiple PDF documents
2. Split PDF by page range or separate into ZIP
3. Compress PDF streams
4. Convert PDF pages to JPGs
5. Bundle multiple images to PDF
6. Create and extract ZIP archives
7. Format and validate JSON according to RFC 8259
8. Text difference comparison
9. Client-side image compression and dimension scaling
10. Command palette navigation (`Ctrl + K`)

---

## 4. Continuous Integration
All PRs and branch pushes must satisfy:
```bash
npm test              # 100% passing tests
npm run typecheck     # Strict TypeScript type safety
npm run lint          # ESLint rules
npm run build         # Next.js static generation
```
