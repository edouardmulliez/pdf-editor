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

This project has comprehensive test coverage for both backend (Rust) and frontend (TypeScript).

### Frontend Tests (32 working + 4 configured)

**Run All Frontend Tests:**
```bash
npm test                    # Run unit + integration tests
```

**Unit Tests** (fast, < 1 second):
```bash
npm run test:unit           # Run once
npm run test:unit:watch     # Watch mode for development
npm run test:unit:ui        # Visual UI in browser
npm run test:coverage       # Generate coverage report
```

**Integration Tests**:
```bash
npm run test:integration        # Run all integration tests
npm run test:integration:ui     # Visual Playwright UI
npm run test:integration:debug  # Step-by-step debugger
```

> **Note**: Uses Tauri's `mockIPC` to simulate the Rust backend. See [docs/INTEGRATION_TESTS_STATUS.md](./docs/INTEGRATION_TESTS_STATUS.md) for details.

### Backend Tests (37 tests)

**Run All Backend Tests:**
```bash
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

### Generate Test PDFs

```bash
cd src-tauri
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

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
