# UtilityHub

> **Powerful everyday tools. Fast, private, and simple.**

[![CI](https://github.com/utility-hub/utility-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/utility-hub/utility-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8)](https://tailwindcss.com/)

**UtilityHub** is a production-quality, open-source web application providing a comprehensive collection of developer, file, PDF, image, and text utilities.

Unlike traditional online conversion websites that upload your confidential documents to third-party servers, **UtilityHub processes data 100% locally in your browser** using modern Web APIs, Web Workers, Canvas, and WebAssembly.

---

## 🔒 Primary Principles

1. **Local-First & Private:** All file manipulations execute directly in your browser. No files are uploaded to any server.
2. **Modular Architecture:** Adding a tool takes four simple steps via a centralized registry.
3. **Reusable Engine Abstractions:** Unified PDF, Image, Archive, File Dropzone, and Download systems.
4. **Performance:** Lightweight initial bundles, static prerendering, and memory-safe URL lifecycle management.
5. **Universal Accessibility:** Semantic HTML, keyboard shortcuts (`Ctrl/Cmd + K`), and dark/light modes.

---

## 🛠️ Phase 1 Active Tools (15 Implemented Utilities)

| # | Utility | Slug | Category | Processing | Description |
|---|---------|------|----------|------------|-------------|
| 1 | **PDF Viewer** | `/tools/pdf-viewer` | PDF | `client` | In-browser PDF reader with zoom, page navigation, and metadata inspection. |
| 2 | **Merge PDF** | `/tools/merge-pdf` | PDF | `client` | Combine multiple PDF files into one in custom order. |
| 3 | **Split PDF** | `/tools/split-pdf` | PDF | `client` | Extract custom page ranges or separate all pages into a ZIP archive. |
| 4 | **PDF Compress** | `/tools/pdf-compress` | PDF | `client` | Re-serialize PDF streams and strip redundant metadata to optimize size. |
| 5 | **PDF to JPG** | `/tools/pdf-to-jpg` | PDF | `client` | Convert PDF pages to high-resolution JPEG or PNG images and export as ZIP. |
| 6 | **JPG to PDF** | `/tools/jpg-to-pdf` | PDF | `client` | Bundle multiple JPG, PNG, and WebP images into a single formatted PDF. |
| 7 | **ZIP Creator** | `/tools/zip-creator` | Archive | `client` | Pack multiple files into a compressed ZIP archive with live progress. |
| 8 | **ZIP Extractor** | `/tools/zip-extractor` | Archive | `client` | Browse file entries and extract individual files from ZIP archives in-browser. |
| 9 | **JSON Formatter** | `/tools/json-formatter` | Developer | `client` | Beautify, indent (2/4 spaces, tabs), and minify JSON data. |
| 10 | **JSON Validator** | `/tools/json-validator` | Developer | `client` | RFC 8259 syntax checker with pinpoint line and column error indicators. |
| 11 | **Base64 Converter** | `/tools/base64-converter` | Developer | `client` | Encode and decode text or files to and from standard or URL-safe Base64. |
| 12 | **UUID Generator** | `/tools/uuid-generator` | Developer | `client` | Batch generate cryptographically secure RFC 4122 v4 UUIDs via Web Crypto. |
| 13 | **Text Diff Checker** | `/tools/text-diff` | Text | `client` | Visual side-by-side or line/word comparison highlighting additions and deletions. |
| 14 | **Word Counter** | `/tools/word-counter` | Text | `client` | Real-time words, characters, sentences, paragraphs, reading and speaking time. |
| 15 | **Image Compressor** | `/tools/image-compressor` | Image | `client` | Compress JPEG, PNG, and WebP images with quality sliders and dimension scaling. |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20 or higher
- **npm** / **pnpm** / **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/utility-hub/utility-hub.git
cd utility-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation

UtilityHub enforces strict code quality, type safety, and test coverage:

```bash
# Run unit and integration tests (Vitest)
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint check
npm run lint

# Build production bundle with static prerendering
npm run build
```

---

## 📁 Project Architecture

```text
src/
├── app/                  # Next.js App Router (pages, layout, styles)
│   ├── layout.tsx        # Global shell & font configuration
│   ├── page.tsx          # Homepage (Hero, Search, Categories, All Tools)
│   ├── tools/[slug]/     # Dynamic registry-driven tool routes
│   └── categories/[slug]/# Category pages
├── components/
│   ├── common/           # Button, Card, Badge, Input, CopyButton
│   ├── layout/           # Navbar, Footer, Breadcrumb, CommandPalette
│   ├── file/             # FileDropzone, FileList, FileItem
│   ├── tool/             # ToolShell, ToolHeader, ToolCard, ToolGrid
│   └── tools/            # Tool implementations organized by category
└── lib/
    ├── registry/         # Tool definitions, categories, and search
    ├── file/             # Validation and download abstractions
    ├── storage/          # Favorites & recent tools (useSyncExternalStore)
    ├── pdf/              # Reusable pdf-lib and canvas rendering engine
    ├── image/            # Canvas compression and scaling engine
    ├── archive/          # JSZip archive creation & unpack engine
    └── text/             # Text analysis, diff, JSON parser
```

---

## ➕ Adding a New Tool

1. **Implement engine logic** in `src/lib/<domain>/`.
2. **Build the tool component** in `src/components/tools/<domain>/`.
3. **Register the tool** in `src/lib/registry/tools.ts` and `src/components/tools/ToolDispatcher.tsx`.
4. **Add unit tests** in `tests/unit/`.

Read [docs/adding-a-tool.md](docs/adding-a-tool.md) for full instructions.

---

## 📖 Documentation

- [Architecture Guide](docs/architecture.md)
- [Adding a New Tool](docs/adding-a-tool.md)
- [Processing Model (Client, Worker, Server, Hybrid)](docs/processing-model.md)
- [Privacy Guarantees](docs/privacy.md)
- [Testing Strategy](docs/testing.md)

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
