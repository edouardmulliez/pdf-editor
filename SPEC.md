# PDF Editor - Product Specification

## Overview
A lightweight desktop PDF annotation application built with Tauri and React, allowing users to view PDFs, add text and image annotations, and export the results as new PDF files.

## Technical Stack

### Core Technologies
- **Framework**: Tauri (Rust backend + Web frontend)
- **Frontend**: React with TypeScript
- **Target Platforms**: macOS (Intel & Apple Silicon), Windows 10/11
- **Operation Mode**: Fully offline (no cloud dependencies)

### Key Libraries (Recommended)
- **PDF Rendering**: PDF.js (Mozilla's PDF library)
- **PDF Generation**: pdf-lib (for creating output PDFs with annotations)
- **State Management**: Zustand or React Context
- **Styling**: Tailwind CSS or CSS Modules
- **UI Components**: Radix UI or shadcn/ui (for modern minimal design)

## Core Features

### 1. PDF Viewing
- **Loading**: Open PDF files via file dialog (Tauri file system API)
- **Rendering Strategy**: Preload all pages for smooth experience
- **Display**: Canvas-based rendering with proper page spacing
- **Page Navigation**:
  - Thumbnails sidebar for visual page overview
  - Page counter display (e.g., "Page 5 of 20")
  - Jump to page functionality
  - Scroll through pages in main viewer

### 2. Annotation System

#### Text Annotations
**Interaction Model**: Toolbar + text tool
1. User clicks "Text" tool in toolbar
2. Cursor changes to text cursor
3. User clicks on PDF to place text box
4. Text input appears for typing
5. Formatting toolbar activates

**Text Formatting Options**:
- **Font Family**: Dropdown with common fonts
  - Arial
  - Times New Roman
  - Courier New
  - Helvetica
  - Georgia
  - (Extensible list)
- **Font Size**: Numeric input or dropdown (8pt - 72pt range)
- **Font Color**: Color picker (hex/RGB selection)
- **Text Styles**: Toggle buttons for:
  - Bold
  - Italic
  - Underline

#### Image Annotations
**Supported Formats**: PNG, JPEG
**Interaction Model**:
1. User clicks "Image" tool in toolbar
2. File dialog opens for image selection
3. Image appears on cursor
4. User clicks to place on PDF
5. Default size with resize handles

### 3. Annotation Editing

All placed annotations (text and images) can be:
- **Moved**: Click and drag to reposition
- **Resized**: Drag corner/edge handles to resize
- **Edited**:
  - Text: Click to re-open for content/formatting changes
  - Images: Select to replace or adjust size
- **Deleted**: Select and press Delete key or click delete button

**Selection System**:
- Click annotation to select (shows bounding box with handles)
- Selected state shows editing controls
- Click outside to deselect

### 4. Export Functionality

**Export Behavior**: Save as new file (original PDF remains untouched)

**Process**:
1. User clicks "Export" or "Save As" button
2. File save dialog opens with suggested filename (original_name_edited.pdf)
3. Application renders annotations onto PDF as static elements
4. New PDF file created with all annotations embedded
5. Success notification shown

**Technical Implementation**:
- Use pdf-lib to create new PDF
- Render original PDF pages
- Overlay annotations as embedded content
- Maintain original PDF quality and metadata

## User Interface Design

### Design Style
**Modern/Minimal Aesthetic**:
- Clean interface with flat design
- Generous whitespace
- Subtle shadows for depth
- Neutral color palette with accent colors for interactive elements
- Focus on content (PDF takes center stage)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] PDF Editor        [Open] [Export]         [- □ ×]   │ Header Bar
├──────┬──────────────────────────────────────────────────────┤
│      │  ┌────────────────────────────────────────────┐      │
│      │  │ Toolbar                                    │      │
│ Page │  │ [Text] [Image] [Select] [Delete]           │      │
│ Nav  │  │ Font: [Arial ▾] Size: [12 ▾] [B I U] [●]  │      │
│      │  └────────────────────────────────────────────┘      │
│ ┌──┐ │                                                       │
│ │1 │ │              PDF Canvas Area                         │
│ └──┘ │                                                       │
│ ┌──┐ │          (Main PDF viewing/editing area)             │
│ │2 │ │                                                       │
│ └──┘ │                                                       │
│ ┌──┐ │                                                       │
│ │3 │ │                                                       │
│ └──┘ │                                                       │
│      │                                                       │
├──────┴───────────────────────────────────────────────────────┤
│  Page 1 of 3                                        100%     │ Status Bar
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

1. **Header Bar**:
   - Application title/logo (left)
   - Primary actions: Open PDF, Export (center/right)
   - Window controls (right)

2. **Sidebar** (collapsible):
   - Page thumbnails (vertical scroll)
   - Click thumbnail to jump to page
   - Current page highlighted
   - Toggle button to show/hide

3. **Toolbar** (contextual):
   - Tool selection: Text, Image, Select
   - Text formatting controls (visible when text tool active)
   - Arranged in logical groups with separators

4. **Main Canvas**:
   - PDF pages rendered with spacing
   - Scrollable vertically
   - Annotations rendered on top of PDF
   - Selection handles when annotation selected

5. **Status Bar**:
   - Page counter (left)
   - Zoom level (right) - display only for MVP

## User Workflows

### Workflow 1: Open and Annotate PDF
1. Launch application
2. Click "Open" button
3. Select PDF file from file system
4. PDF loads and displays in main canvas
5. Browse pages using thumbnails or scroll
6. Click "Text" tool in toolbar
7. Click on PDF where text should appear
8. Type text content
9. Adjust font, size, color, and styles as needed
10. Click outside text box to confirm
11. Repeat for additional annotations
12. Click "Image" tool to add images
13. Select image file
14. Click on PDF to place
15. Resize if needed

### Workflow 2: Edit Existing Annotation
1. Click on annotation to select
2. Move by dragging
3. Resize by dragging handles
4. For text: click to re-edit content and formatting
5. To delete: select and press Delete key

### Workflow 3: Export Edited PDF
1. Click "Export" button in header
2. Choose save location and filename
3. Wait for processing (show progress indicator)
4. Confirmation message when complete
5. Option to open output folder

## Technical Implementation Notes

### Annotation Data Structure
```typescript
interface Annotation {
  id: string;
  type: 'text' | 'image';
  pageNumber: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  // Text-specific
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  fontStyles?: ('bold' | 'italic' | 'underline')[];
  // Image-specific
  imageData?: string; // base64 or path
  imageFormat?: 'png' | 'jpeg';
}
```

### State Management
- **PDF State**: Current PDF file, pages, metadata
- **Annotations State**: Array of all annotations
- **UI State**: Active tool, selected annotation, sidebar visibility
- **Editor State**: Zoom level, current page

### Tauri Commands (Rust Backend)
```rust
// File operations
open_pdf(path: String) -> Result<PdfData>
export_pdf(pdf: PdfData, annotations: Vec<Annotation>, output_path: String) -> Result<()>

// Image handling
load_image(path: String) -> Result<ImageData>
```

### Performance Considerations
- **Memory**: With "preload all pages," monitor memory usage for large PDFs
  - Consider max file size warning (e.g., 50MB or 200 pages)
- **Rendering**: Use canvas for PDF, HTML/CSS for annotations (better performance)
- **Export**: Show progress indicator as PDF generation can take time

## MVP Scope (Phase 1)

**Included**:
- ✅ Open PDF files
- ✅ View PDF with page navigation
- ✅ Add text annotations with full formatting
- ✅ Add image annotations (PNG/JPEG)
- ✅ Edit, move, resize, delete annotations
- ✅ Export as new PDF
- ✅ Modern minimal UI

**Explicitly Excluded from MVP**:
- ❌ Zoom controls (display only)
- ❌ Undo/Redo
- ❌ Drawing tools (shapes, freehand)
- ❌ Page management (add/remove/reorder pages)
- ❌ Recent files list
- ❌ Keyboard shortcuts
- ❌ Multiple PDF support
- ❌ Cloud storage integration
- ❌ Print functionality

## Future Enhancements (Post-MVP)
1. **Zoom Controls**: Zoom in/out, fit to width, fit to page
2. **Undo/Redo**: Full history management
3. **Drawing Tools**: Shapes, arrows, freehand drawing, highlighting
4. **Keyboard Shortcuts**: Hotkeys for common actions
5. **Recent Files**: Quick access to recently opened PDFs
6. **Page Management**: Add, remove, reorder, merge PDFs
7. **Auto-save**: Periodic project saves (not directly to PDF)
8. **Templates**: Saved annotation presets
9. **Multi-language Support**: i18n for UI
10. **Dark Theme**: Theme switcher

## Success Criteria
- Application launches in < 2 seconds
- PDF loads in < 3 seconds (for typical 20-page document)
- Smooth annotation placement and editing (no lag)
- Export completes in < 5 seconds for typical annotated PDF
- Application bundle size < 50MB
- No crashes or data loss during normal operation
- Annotations render correctly in exported PDF across all PDF viewers

## Development Phases

### Phase 1: Foundation (Week 1-2)
- Set up Tauri + React project
- Implement PDF rendering with PDF.js
- Basic page navigation
- File open functionality

### Phase 2: Annotation System (Week 3-4)
- Text annotation placement
- Text formatting toolbar
- Image annotation placement
- Annotation data structure and state management

### Phase 3: Editing Features (Week 5)
- Selection system
- Move and resize annotations
- Edit annotation content
- Delete annotations

### Phase 4: Export & Polish (Week 6)
- PDF export with pdf-lib
- UI polish and refinement
- Error handling
- Testing and bug fixes

## Dependencies & Tools

### npm Packages
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "pdfjs-dist": "^4.x",
  "pdf-lib": "^1.17.x",
  "@tauri-apps/api": "^1.x",
  "zustand": "^4.x",
  "tailwindcss": "^3.x"
}
```

### Rust Crates (Cargo.toml)
```toml
[dependencies]
tauri = "1.x"
serde = { version = "1.x", features = ["derive"] }
serde_json = "1.x"
```

## File Structure
```
pdf-editor/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/   # Tauri command handlers
│   │   └── utils/      # PDF processing utilities
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                # React frontend
│   ├── components/
│   │   ├── PDFViewer/
│   │   ├── Toolbar/
│   │   ├── Sidebar/
│   │   ├── AnnotationLayer/
│   │   └── UI/
│   ├── stores/         # Zustand stores
│   ├── types/          # TypeScript types
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── tsconfig.json
```

---

**Document Version**: 1.0
**Last Updated**: 2026-02-07
**Status**: Ready for Development
