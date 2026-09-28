# Processing Model

UtilityHub classifies every utility into one of four processing models:

```text
┌─────────────────┐       ┌─────────────────┐
│     Client      │       │     Worker      │
│  Main thread    │       │ Off-main-thread │
│  fast APIs      │       │ CPU intensive   │
└─────────────────┘       └─────────────────┘
         ▲                         ▲
         │                         │
┌─────────────────┐       ┌─────────────────┐
│     Hybrid      │       │     Server      │
│ Client prep +   │       │ Network-bound   │
│ server finish   │       │ restricted APIs │
└─────────────────┘       └─────────────────┘
```

---

## 1. Client (`processing: "client"`)
Lightweight operations that execute synchronously or asynchronously on the browser's main JavaScript thread without causing noticeable frame drops (under 50ms):
- **Examples:**
  - PDF merging & page reordering (`pdf-lib`)
  - Canvas image resizing & compression (`canvas.toBlob`)
  - JSON formatting & minifying
  - Text diffing (`diffLines`, `diffWords`)
  - UUID generation (`crypto.randomUUID()`)
  - Base64 encoding and decoding (`btoa`, `atob`, `TextEncoder`)
- **Indication:** Displayed as `"Processed locally in your browser"` with a green shield badge.

---

## 2. Worker (`processing: "worker"`)
CPU-heavy operations that could block the main UI thread:
- **Examples:**
  - Large PDF page OCR
  - Multi-megabyte ZIP archive compression with Deflate level 9
  - Client-side FFmpeg WebAssembly audio/video transcoding
- **Architecture:** Communicates via structured cloned `postMessage` requests and typed responses (`PROGRESS`, `SUCCESS`, `ERROR`).
- **Indication:** Displayed as `"Processed locally via Web Worker"` with a purple CPU badge.

---

## 3. Server (`processing: "server"`)
Operations that are technically impossible in the browser due to security or protocol constraints:
- **Examples:**
  - Raw DNS UDP query lookups
  - WHOIS queries over port 43
  - SSL certificate chain inspection blocked by CORS
- **Rule:** Never fake functionality. If a tool requires server execution, clearly mark it as `"Requires server processing"`.
- **Indication:** Displayed as an amber server badge. Files are never sent unless explicitly intended for a server tool.

---

## 4. Hybrid (`processing: "hybrid"`)
Operations where initial data validation, hashing, or metadata extraction happens client-side, and only minimal sanitized payload is sent to an external service with explicit user consent.
