# UtilityHub Architecture

## 1. Overview
UtilityHub is an open-source, local-first web platform for utilities, converters, developer tools, and file manipulations. The core architectural directive is **privacy by design**: user files and data must remain on the client machine and be processed directly inside the browser runtime whenever technically feasible.

---

## 2. Directory Structure

```text
utility-hub/
├── .github/
│   ├── workflows/ci.yml         # Automated GitHub Actions validation
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   └── pull_request_template.md # PR checklist
├── docs/                        # Architecture and contributor guides
├── src/
│   ├── app/                     # Next.js App Router (pages, layout, styles)
│   │   ├── layout.tsx           # Global shell & font configuration
│   │   ├── page.tsx             # Homepage (Hero, Search, Categories, All Tools)
│   │   ├── tools/[slug]/        # Dynamic registry-driven tool routes
│   │   ├── categories/[slug]/   # Dynamic category pages
│   │   ├── privacy/             # Privacy policy & guarantees
│   │   ├── about/               # Mission & architecture overview
│   │   └── terms/               # Terms of service
│   ├── components/
│   │   ├── common/              # Button, Card, Badge, Input, CopyButton
│   │   ├── layout/              # Navbar, Footer, Breadcrumb, CommandPalette
│   │   ├── file/                # FileDropzone, FileList, FileItem
│   │   ├── tool/                # ToolShell, ToolHeader, ToolCard, ToolGrid
│   │   └── tools/               # Tool implementations organized by domain
│   │       ├── pdf/             # PDF Viewer, Merge, Split, Compress, etc.
│   │       ├── archive/         # ZIP Creator, ZIP Extractor
│   │       ├── text/            # JSON tools, Diff, Word Counter, UUID, Base64
│   │       └── image/           # Image Compressor
│   └── lib/
│       ├── registry/            # Tool definitions, categories, and search
│       ├── file/                # Validation and download abstractions
│       ├── storage/             # Favorites & recent tools (useSyncExternalStore)
│       ├── pdf/                 # Reusable pdf-lib and canvas rendering engine
│       ├── image/               # Canvas compression and scaling engine
│       ├── archive/             # JSZip archive creation & unpack engine
│       └── text/                # Text analysis, diff, JSON parser
└── tests/
    ├── unit/                    # Unit tests (text, json, pdf, file utils)
    └── integration/             # Integration tests (registry, category mapping)
```

---

## 3. Core Subsystems

### A. The Tool Registry (`src/lib/registry/`)
Every utility is registered with typed metadata (`ToolDefinition`):
- `id`: unique identifier
- `name`: display title
- `slug`: URL slug (`/tools/[slug]`)
- `category`: category key
- `description`: short description
- `keywords`: search tokens
- `processing`: processing model (`client` | `worker` | `server` | `hybrid`)
- `status`: `active` | `planned` | `server-required`

The registry automatically drives:
- Next.js dynamic SSG routes (`generateStaticParams`)
- SEO Open Graph metadata (`generateMetadata`)
- Homepage search and filter tabs
- Global Command Palette (`Ctrl/Cmd + K`)
- Category page indexing
- Related tools suggestions

### B. File Handling Subsystem (`src/lib/file/`)
- `FileDropzone`: Accessible drag-and-drop target with MIME validation and size limits.
- `FileList` & `FileItem`: Multi-file management, reordering controls (up/down), and deletion.
- `downloadBlob`: Safe blob download handler that creates temporary object URLs and automatically revokes them to prevent memory leaks.

### C. State Synchronization (`useSyncExternalStore`)
Local state such as user favorites and recent tool history uses React 19's `useSyncExternalStore` pattern. This guarantees:
- Zero hydration mismatch between server and client
- Zero cascading renders caused by synchronous `setState` in effects
- Instant cross-component synchronization when favorites or history change
