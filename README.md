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

## Testing

### Frontend Tests

```bash
npm run test               # Run all frontend tests
npm run test:unit          # Run unit tests
npm run test:integration   # Run all integration tests
```

### Backend Tests

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

This creates example PDFs in `src-tauri/` demonstrating the addition of text and image annotations.

## Documentation

📚 **Complete documentation in [`docs/`](./docs/)**:

- **[SPEC.md](./docs/SPEC.md)** - Complete product specification
- **[IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)** - Detailed implementation guide

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
