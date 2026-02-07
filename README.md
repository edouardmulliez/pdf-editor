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
├── src/                    # React frontend
│   ├── components/        # UI components
│   │   ├── PDFViewer/    # PDF rendering
│   │   ├── Toolbar/      # Tool selection & formatting
│   │   ├── Sidebar/      # Page navigation
│   │   ├── AnnotationLayer/ # Annotation rendering
│   │   └── UI/           # Header, StatusBar
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── src-tauri/            # Rust backend
└── SPEC.md               # Full specification
```

## Development Status

🚧 **In Development** - Basic project structure is set up. Next steps:
- Implement PDF.js integration for rendering
- Implement Tauri commands for file operations
- Implement annotation editing (drag, resize)
- Implement PDF export with pdf-lib

See [SPEC.md](./SPEC.md) for the complete specification.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
