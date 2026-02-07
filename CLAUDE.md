# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lightweight desktop PDF annotation application built with Tauri (Rust backend) and React (TypeScript frontend). The application allows viewing, annotating (text and images), and exporting PDFs with a comprehensive annotation system.

## Development Commands

### Frontend (React + TypeScript)
```bash
# Install dependencies
npm install

# Run in development mode (starts both frontend and Tauri backend)
npm run tauri dev

# Build for production
npm run tauri build

# Frontend only (without Tauri)
npm run dev
npm run build
npm run preview
```

### Backend (Rust - Tauri)
```bash
cd src-tauri

# Run all tests (unit + integration + doc tests)
cargo test

# Run with output visible
cargo test -- --nocapture

# Run specific test file
cargo test --test pdf_integration_test
cargo test --test pdf_validation_test

# Run unit tests only (in src/)
cargo test --lib

# Run specific test by name
cargo test test_add_text_with_color -- --nocapture
cargo test test_end_to_end_pdf_editing -- --nocapture

# Generate example PDFs for manual inspection
cargo run --example generate_test_pdfs
```

## Architecture

### Hybrid Tauri Application

**Frontend (src/):**
- React 19 with TypeScript
- Tailwind CSS for styling
- Zustand for state management (to be integrated)
- PDF.js for rendering (to be integrated)
- pdf-lib for PDF generation (to be integrated)

**Backend (src-tauri/src/):**
- Rust-based Tauri application
- Two main modules: `pdf_ops` and `pdf_validation`
- Uses `printpdf` for PDF creation and `lopdf` for PDF manipulation

### PDF Operations Architecture (`pdf_ops.rs`)

The annotation system uses a **hybrid document/file-based API**:

**Core Layer - Document-Based API:**
- Functions work with `&mut lopdf::Document` for efficiency
- Enables batch operations without repeated I/O
- Examples: `add_text_with_style()`, `add_image_to_pdf()`, `apply_annotations()`

**Convenience Layer - File-Based Wrappers:**
- Simple wrappers for single operations
- Examples: `add_text_to_pdf()`, `apply_annotations_to_file()`

**Content Stream Appending Pattern:**
- All new content is added as separate content streams
- New streams are appended to existing page Contents arrays
- Preserves original PDF content (non-destructive)
- This pattern is critical for compatibility with Safari/Preview

### Annotation System Data Model

All annotation types are JSON-serializable (using `serde`):

```rust
// Core types
Color { r: u8, g: u8, b: u8 }           // RGB color (0-255)
Position { x: f32, y: f32 }              // PDF coordinates (points from bottom-left)
ImageFormat: Jpeg | Png                  // Image format enum

// Annotation types (tagged union)
AnnotationType::Text(TextAnnotation {
    content: String,
    font_family: String,  // Standard 14 fonts only
    font_size: f32,
    color: Color,
})

AnnotationType::Image(ImageAnnotation {
    image_data: Vec<u8>,  // Base64-encoded in JSON
    format: ImageFormat,
    width: f32,
    height: f32,
})

// Complete annotation
Annotation {
    page: usize,
    position: Position,
    content: AnnotationType,  // Flattened in JSON with "type" tag
}
```

**Standard 14 Fonts** (guaranteed in all PDF viewers):
- Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique
- Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic
- Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique
- Symbol, ZapfDingbats

### PDF Validation System (`pdf_validation.rs`)

Comprehensive validation that catches compatibility issues:
- Missing font references
- Invalid object references
- Malformed content streams
- Empty/corrupt content

Critical for ensuring PDFs work across Safari, Preview, Chrome, and Acrobat.

### Batch Operations

Annotations are grouped by page for efficiency:
```rust
// Groups annotations by page automatically
// Creates single content stream per page
apply_annotations(&mut doc, &annotations)?;
```

## Important Implementation Details

### PDF Coordinate System
- Origin is **bottom-left** (not top-left)
- Units are in **points** (72 points = 1 inch)
- Y increases upward, X increases rightward

### Image Handling
- **JPEG**: Uses raw data with DCTDecode filter (no re-compression)
- **PNG**: Decodes to RGB8, compresses with zlib/FlateDecode
- Both use DeviceRGB color space for simplicity

### Resource Management
- Fonts must be added to page Resources/Font dictionary
- Images must be added to page Resources/XObject dictionary
- Helper functions `ensure_font_in_resources()` and `add_image_to_page_resources()` handle this automatically

### Import Disambiguation
When importing, use explicit crate paths to avoid conflicts:
```rust
use ::lopdf::{...}     // Not lopdf (conflicts with printpdf re-export)
use ::image::{...}     // Not image (conflicts with printpdf module)
```

## Testing Strategy

**Test Categories:**
- Unit tests in `src/pdf_ops.rs` (22 tests)
- Integration tests in `tests/pdf_integration_test.rs` (4 tests)
- Validation tests in `tests/pdf_validation_test.rs` (8 tests)
- Doc tests in module documentation (3 tests)

**Test PDFs Location:** Generated in `src-tauri/` directory

**Manual Verification:** Generated PDFs should be opened in:
- Preview (macOS)
- Adobe Acrobat
- Chrome PDF viewer
- Safari (historically problematic - requires content stream appending)

## Key Files

**Backend (Rust):**
- `src-tauri/src/pdf_ops.rs` - Main PDF operations and annotation system (~1800 lines)
- `src-tauri/src/pdf_validation.rs` - PDF validation utilities
- `src-tauri/examples/generate_test_pdfs.rs` - Example usage and test PDF generation

**Tests:**
- `src-tauri/tests/pdf_integration_test.rs` - E2E workflow tests
- `src-tauri/tests/pdf_validation_test.rs` - Validation tests

**Documentation:**
- `ANNOTATION_SYSTEM.md` - Complete annotation system implementation details
- `docs/PHASE0_COMPLETE.md` - Phase 0 completion report
- `docs/PDF_VALIDATION.md` - Validation system documentation

## Documentation Guidelines

**New documentation should be placed in the `docs/` folder**, not in the project root. The root should only contain essential files like README.md and CLAUDE.md.

When creating new documentation:
- Implementation reports → `docs/`
- Technical specifications → `docs/`
- Phase completion reports → `docs/`
- API documentation → `docs/`
