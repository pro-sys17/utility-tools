# Privacy Guarantees

## 1. Zero Server Upload Architecture
UtilityHub guarantees that your files, documents, and code are processed entirely on your device.

When you use:
- **PDF tools** (PDF Viewer, Merge PDF, Split PDF, PDF Compress, PDF to JPG, JPG to PDF)
- **Archive tools** (ZIP Creator, ZIP Extractor)
- **Text & Code tools** (JSON Formatter, JSON Validator, Text Diff, Word Counter, Base64 Converter, UUID Generator)
- **Image tools** (Image Compressor)

**Not a single byte of your file is uploaded to our servers.**

---

## 2. No Analytics on Content
- We do not run analytics trackers that inspect document content, file names, or text inputs.
- We do not use user documents for machine learning training.
- We do not retain server-side caches of user data.

---

## 3. Storage and Object URL Lifecycle
- **Memory safety:** Temporary file object URLs (`blob:http...`) created for rendering or downloads are explicitly revoked via `revokeObjectURL()` immediately after completion or on component unmount.
- **Harmless preferences only:** `localStorage` is used solely for non-sensitive UI settings:
  1. Theme mode (`light`, `dark`, `system`)
  2. Favorites list (array of tool IDs)
  3. Recently used tools (array of tool slugs)
- No user file contents are stored in persistent storage without explicit user request.

---

## 4. Air-Gapped / Offline Deployment
Because UtilityHub is a local-first application, the entire platform can be deployed within air-gapped secure corporate networks, defense environments, or local intranets without requiring internet connectivity for document transformations.
