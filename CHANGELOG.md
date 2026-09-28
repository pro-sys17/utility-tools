# Changelog

All notable changes to **UtilityHub** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-28

### Added
- **Core Architecture:**
  - Centralized, typed Tool Registry with automatic routing and metadata indexing
  - Reusable file handling system (`FileDropzone`, `FileList`, `FileItem`, MIME validation, object URL cleanup)
  - Processing model categorization (Client, Worker, Server, Hybrid)
  - Dark / Light / System theme toggling with zero hydration mismatch
  - Global Command Palette (`Ctrl/Cmd + K`) with instant tool search
  - Local favorites and recent tools history using React 19 `useSyncExternalStore`
- **Initial 15 Production Tools:**
  - **PDF Utilities:** PDF Viewer, Merge PDF, Split PDF, PDF Compress, PDF to JPG, JPG to PDF
  - **Archive Utilities:** ZIP Creator, ZIP Extractor
  - **Developer Utilities:** JSON Formatter, JSON Validator (RFC 8259), Base64 Converter, UUID Generator
  - **Text Utilities:** Text Diff Checker, Word & Character Counter
  - **Image Utilities:** Image Compressor with Canvas optimization
- **Documentation & CI:**
  - Comprehensive architectural guide, adding a tool tutorial, processing model spec, privacy documentation, and testing guide
  - GitHub Actions CI workflow covering lint, typecheck, unit tests, and production build
  - Complete unit and integration test suite with Vitest
