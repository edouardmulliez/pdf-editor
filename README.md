# PDF Editor

A lightweight desktop PDF annotation application built with Tauri and React.

## Features

- 📄 View PDF documents
- ✏️ Add text annotations with full formatting (font, size, color, styles)
- 🖼️ Add image annotations (PNG, JPEG)
- 🎯 Edit, move, resize, and delete annotations
- 💾 Export edited PDFs as new files
- 🗂️ Page navigation with thumbnails

## Tech Stack

- **Tauri** - Rust-based desktop framework
- **React** + **TypeScript** - UI framework
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **PDF.js** - PDF rendering (to be integrated)
- **pdf-lib** - PDF generation (to be integrated)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Rust 1.70+
- Platform-specific dependencies for Tauri (see [Tauri Prerequisites](https://tauri.app/start/prerequisites/))

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
pdf-editor/
├── src/                     # React frontend
│   ├── components/         # UI components
│   │   ├── PDFViewer/     # PDF rendering
│   │   ├── Toolbar/       # Tool selection & formatting
│   │   ├── Sidebar/       # Page navigation
│   │   ├── AnnotationLayer/ # Annotation rendering
│   │   └── UI/            # Header, StatusBar
│   ├── stores/            # Zustand state management
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── pdf_ops.rs     # PDF operations (create, add text, extract)
│   │   └── pdf_validation.rs # PDF validation system
│   ├── tests/             # Integration tests
│   └── examples/          # Example programs
├── docs/                  # Documentation
│   ├── SPEC.md           # Product specification
│   ├── IMPLEMENTATION_PLAN.md # Implementation guide
│   ├── PHASE0_COMPLETE.md # Phase 0 report
│   └── PDF_VALIDATION.md  # Validation system docs
└── README.md              # This file
```

## Development Status

✅ **Phase 0 Complete** - Core Rust PDF capabilities validated!
- ✅ PDF creation with text
- ✅ Adding text to existing PDFs
- ✅ Text extraction and verification
- ✅ PDF validation system (catches compatibility issues)
- ✅ 18/18 tests passing

**Next Steps**: Phase 1 - PDF Rendering with PDF.js

## Testing

### Run All Tests

```bash
# Run all tests (unit + integration)
cd src-tauri
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test file
cargo test --test pdf_integration_test
cargo test --test pdf_validation_test

# Run specific test
cargo test test_end_to_end_pdf_editing -- --nocapture
```

### Test Categories

**Unit Tests** (6 tests in `src/`):
```bash
cargo test --lib
```

**Integration Tests** (12 tests in `tests/`):
```bash
cargo test --test pdf_integration_test    # 4 tests - E2E workflow
cargo test --test pdf_validation_test     # 8 tests - PDF validation
```

### Generate Test PDFs

```bash
# Generate example PDFs for manual inspection
cargo run --example generate_test_pdfs
```

This creates 6 example PDFs in `src-tauri/` demonstrating:
- Simple text
- Added text (original vs modified)
- Multiple font sizes
- Different positions
- Multiple lines with special characters

## Documentation

📚 **Complete documentation in [`docs/`](./docs/)**:

- **[SPEC.md](./docs/SPEC.md)** - Complete product specification
  - Features, UI/UX, technical stack
  - Development phases and timeline
  - Success metrics

- **[IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)** - Detailed implementation guide
  - 5 phases with 31 specific tasks
  - Technical notes and code examples
  - Risk assessment and mitigation

- **[PHASE0_COMPLETE.md](./docs/PHASE0_COMPLETE.md)** - Phase 0 completion report
  - Rust PDF capabilities validation
  - All test results and learnings
  - Known limitations

- **[PDF_VALIDATION.md](./docs/PDF_VALIDATION.md)** - PDF validation system
  - API reference and usage examples
  - How it caught Safari/Preview bug
  - 8 validation tests explained

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
