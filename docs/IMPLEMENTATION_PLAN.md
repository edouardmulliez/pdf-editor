# PDF Editor - Implementation Plan

## Overview

**Project Status**: ✅ Phase 1 Complete - PDF Rendering & File Operations
**Current Phase**: Ready for Phase 2 - Annotation System Frontend
**Phase 0 Completion**: 2026-02-08 - See PHASE0_COMPLETE.md
**Phase 1 Completion**: 2026-02-08 - Full PDF viewing capability

---

## Phase 0: Rust PDF Capabilities ✅ COMPLETE

**Goal**: Validate and implement comprehensive PDF annotation capabilities in Rust
**Status**: ✅ Complete - All 37 tests passing
**Duration**: 3 days

### Implemented Features

**Core Operations:**
- ✅ PDF creation and manipulation (printpdf + lopdf)
- ✅ Text extraction and verification
- ✅ Content stream appending (Safari/Preview compatible)

**Annotation System:**
- ✅ Text annotations (Standard 14 fonts, RGB colors, custom sizes)
- ✅ Image annotations (JPEG with DCTDecode, PNG with SMask transparency)
- ✅ Batch annotation processing with page grouping
- ✅ JSON-serializable data structures (serde)

**Quality:**
- ✅ 37 tests passing (22 unit + 4 integration + 8 validation + 3 doc)
- ✅ PDF validation system (detects missing fonts, invalid references)
- ✅ Comprehensive error handling

### Code Structure

```
src-tauri/
├── src/
│   ├── pdf_ops.rs (~1800 lines)
│   │   ├── Data structures: Color, Position, Annotation, etc.
│   │   ├── Text ops: add_text_with_style, validate_font_family
│   │   ├── Image ops: add_image_to_pdf, create_*_xobject
│   │   └── Batch ops: apply_annotations
│   └── pdf_validation.rs
├── tests/
│   ├── pdf_integration_test.rs
│   └── pdf_validation_test.rs
└── examples/
    ├── generate_test_pdfs.rs
    ├── input/ (test PDFs and images)
    └── output/ (annotated PDFs)
```

### Key Capabilities

**Document-Based API:**
```rust
let mut doc = Document::load("input.pdf")?;
add_text_with_style(&mut doc, page, text, pos, font, size, color)?;
add_image_to_pdf(&mut doc, page, data, format, pos, w, h)?;
doc.save("output.pdf")?;
```

**Batch Annotations:**
```rust
let annotations = vec![
    Annotation { page, position, content: Text(...) },
    Annotation { page, position, content: Image(...) },
];
apply_annotations_to_file("in.pdf", "out.pdf", &annotations)?;
```

### Dependencies Added
- `image = "0.25"` - Image decoding/encoding
- `flate2 = "1.0"` - Zlib compression
- `base64 = "0.22"` - Base64 encoding for JSON

---

## Phase 1: PDF Rendering & File Operations ✅ COMPLETE
**Goal**: Enable users to open and view PDF files
**Duration**: 1 day (2026-02-08)
**Status**: ✅ Complete

### Completed Features

1. ✅ **PDF.js Worker Configuration**
   - Configured vite-plugin-static-copy to bundle worker locally
   - Worker setup for both dev and production modes
   - Offline-ready PDF.js integration

2. ✅ **Tauri File Dialog Command**
   - Added tauri-plugin-dialog dependency
   - Implemented file_ops.rs with PDF validation (magic bytes)
   - Created open_pdf_dialog command
   - Returns file name, path, and raw bytes
   - 3 new unit tests passing

3. ✅ **PDF.js Document Loading**
   - Created pdf-loader.ts utility
   - Updated usePDFStore with PDFDocumentProxy types
   - Integrated file opening in App.tsx
   - Error handling for invalid PDFs

4. ✅ **Single Page Canvas Rendering**
   - Created pdf-renderer.ts with retina display support
   - Implemented renderPageToCanvas utility
   - calculateFitScale for responsive sizing
   - Updated PDFViewer component

5. ✅ **Multi-Page Scrolling**
   - Renders all pages vertically with smooth scrolling
   - Scroll-based current page tracking
   - Optimized rendering with preloaded canvases
   - Professional spacing and layout

6. ✅ **Page Thumbnails Sidebar**
   - Created thumbnail-generator.ts utility
   - Generates 120px width thumbnails for all pages
   - Click to navigate functionality
   - Current page highlighting and auto-scroll
   - Sidebar toggle button in header

7. ✅ **Status Bar Updates**
   - Displays document filename
   - Current page / total pages indicator
   - Zoom level display (placeholder)
   - Responsive layout

### Technical Implementation

**New Backend Files:**
- `src-tauri/src/file_ops.rs` - PDF file reading with validation
- `src-tauri/src/commands.rs` - Tauri command handlers

**New Frontend Files:**
- `src/utils/pdfjs-config.ts` - Worker configuration
- `src/utils/pdf-loader.ts` - PDF loading utilities
- `src/utils/pdf-renderer.ts` - Canvas rendering
- `src/utils/thumbnail-generator.ts` - Thumbnail generation

**Modified Files:**
- `vite.config.ts` - Added static copy plugin
- `src/stores/usePDFStore.ts` - PDF.js types and state
- `src/stores/useUIStore.ts` - Sidebar toggle
- `src/App.tsx` - File opening logic
- `src/components/PDFViewer/PDFViewer.tsx` - Multi-page rendering
- `src/components/Sidebar/Sidebar.tsx` - Thumbnail navigation
- `src/components/UI/Header.tsx` - Sidebar toggle button
- `src/components/UI/StatusBar.tsx` - Document info display

### Tests
- ✅ All 40 Rust tests passing (37 existing + 3 new file_ops tests)
- ✅ TypeScript compilation successful
- ✅ Production build verified

### User Experience
Users can now:
- Open PDF files via native file dialog
- View all pages with smooth scrolling
- Navigate using page thumbnails in sidebar
- See current page and document information
- Toggle sidebar visibility
- Experience crisp rendering on retina displays

---

## Phase 2: Annotation System Frontend
**Goal**: UI for adding text and image annotations
**Duration Estimate**: 1-2 weeks

### Tasks

1. **Text Annotation Placement** (4-5 hours)
   - Click to add text
   - Apply formatting from toolbar
   - Convert canvas ↔ PDF coordinates

2. **Image Annotation Placement** (3-4 hours)
   - Image file dialog
   - Base64 conversion
   - Position image on click

3. **Annotation Rendering Layer** (3-4 hours)
   - Overlay annotations on canvas
   - Handle scaling with zoom
   - Render per-page annotations

4. **Toolbar Active States** (1-2 hours)
   - Visual feedback for active tool
   - Disable when no PDF loaded
   - Tool-specific cursors

---

## Phase 3: Annotation Editing
**Goal**: Edit, move, resize, delete annotations
**Duration Estimate**: 1 week

### Tasks

1. **Selection** (3-4 hours)
   - Click to select annotation
   - Visual selection feedback
   - Deselect on outside click

2. **Drag-to-Move** (4-5 hours)
   - Implement drag handlers
   - Constrain to page bounds
   - Update position in real-time

3. **Resize Handles** (5-6 hours)
   - 8 resize handles (corners + edges)
   - Maintain aspect ratio for images
   - Minimum size constraints

4. **Edit Text Content** (2-3 hours)
   - Double-click to edit
   - Update content on save

5. **Delete** (1-2 hours)
   - Delete button + keyboard shortcut
   - Remove from store

---

## Phase 4: PDF Export with Rust Backend
**Goal**: Export annotated PDF using Phase 0 implementation
**Duration Estimate**: 3-5 days (accelerated by Phase 0)

### Tasks

1. **Tauri Export Command** (2-3 hours)
   - Create `export_pdf` command
   - Accept annotations from frontend
   - Use Phase 0 functions

2. **Frontend Integration** (3-4 hours)
   - Collect annotations from store
   - Convert to Rust format
   - Transform coordinates

3. **Save Dialog** (2-3 hours)
   - Tauri save dialog
   - Write PDF bytes to file
   - Return saved path

4. **Export UI Flow** (2 hours)
   - Wire Export button
   - Progress indicator
   - Success/error handling

---

## Phase 5: Polish & Refinement
**Goal**: UX improvements and bug fixes
**Duration Estimate**: 1 week

### Tasks

1. **Keyboard Shortcuts** (2-3 hours)
   - Cmd/Ctrl+O, S, Z
   - Tool shortcuts (T, I, V)
   - Delete/ESC

2. **Zoom Display** (1-2 hours)
   - Show current zoom percentage
   - Update on resize

3. **Error Handling** (3-4 hours)
   - Error boundaries
   - User-friendly messages
   - Validation

4. **Performance** (4-6 hours)
   - Profile and optimize
   - React.memo for re-renders
   - Test with large PDFs

5. **UI/UX Polish** (3-4 hours)
   - Animations/transitions
   - Consistent styling
   - Icons and spacing

6. **Testing** (1-2 days)
   - macOS and Windows
   - Various PDF types
   - Edge cases

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| **Phase 0: Rust PDF** | ✅ **3 days** | **3 days** |
| Phase 1: PDF Rendering | 1-2 weeks | 2.5 weeks |
| Phase 2: Annotations | 1-2 weeks | 4.5 weeks |
| Phase 3: Editing | 1 week | 5.5 weeks |
| Phase 4: Export | 3-5 days | 6 weeks |
| Phase 5: Polish | 1 week | 7 weeks |

**Total**: 6-7 weeks for MVP

---

## Success Criteria

### Phase 0 ✅ Complete
- ✅ All 37 tests passing
- ✅ Text with fonts, sizes, colors
- ✅ Images (JPEG/PNG) with transparency
- ✅ Batch annotations with JSON
- ✅ PDF validation system

### Phase 1 (PDF Rendering)
- Can open any valid PDF
- All pages render correctly
- Smooth navigation
- Load time < 3s for 20-page PDF

### Phase 2 (Annotations)
- Add text with formatting
- Add images (PNG/JPEG)
- Correct page placement

### Phase 3 (Editing)
- Move, resize, edit, delete
- Smooth interactions
- Changes persist

### Phase 4 (Export)
- All annotations in exported PDF
- Correct positioning
- Export < 5s
- Works in all PDF viewers

### Phase 5 (Polish)
- No critical bugs
- Professional UI
- Responsive interactions

---

## Risk Mitigation

**Mitigated by Phase 0:**
- ✅ Export quality validated with tests
- ✅ Rust PDF library capabilities confirmed
- ✅ Coordinate transformations proven

**Remaining Risks:**
- **PDF.js Integration**: Mitigate with early testing
- **Performance**: Mitigate with profiling
- **Cross-platform**: Test on both platforms regularly

---

**Document Version**: 3.0
**Last Updated**: 2026-02-08
**Status**: Phase 0 Complete - Ready for Phase 1
