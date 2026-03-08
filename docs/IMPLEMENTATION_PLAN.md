# PDF Editor - Implementation Plan

## Overview

**Project Status**: ✅ Phase 3 Complete - Annotation Editing
**Current Phase**: Ready for Phase 5 - Polish & Final Touches
**Phase 0 Completion**: 2026-02-08 - Rust PDF annotation backend (37 tests)
**Phase 1 Completion**: 2026-02-08 - Full PDF viewing capability
**Phase 2 Completion**: 2026-02-08 - Text and image annotation placement
**Phase 3 Completion**: 2026-02-08 - Annotation editing (move, resize, delete, edit text)
**Phase 4 Completion**: 2026-02-08 - PDF export with annotations (99 tests total)

---

## Phase 0: Rust PDF Capabilities ✅ COMPLETE

**Goal**: Validate and implement comprehensive PDF annotation capabilities in Rust
**Status**: ✅ Complete - All 37 tests passing

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
**Completed**: 2026-02-08
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
   - Zoom level display (live, wired to zoom state)
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

## Phase 2: Annotation System Frontend ✅ COMPLETE
**Goal**: UI for adding text and image annotations
**Completed**: 2026-02-08
**Status**: ✅ Complete - See docs/PHASE2_COMPLETE.md

### Completed Features

1. ✅ **Coordinate Conversion System**
   - Created coordinate-converter.ts utility
   - Canvas coordinates (top-left, pixels) ↔ PDF coordinates (bottom-left, points)
   - Page metadata tracking (scale, viewport dimensions)
   - Accurate positioning with no offsets

2. ✅ **Text Annotation Placement**
   - Click to add text with inline editing
   - Real-time formatting from toolbar applied
   - Enter to confirm, Escape to cancel
   - Empty annotations automatically removed
   - Text tool stays active for multiple placements

3. ✅ **Image Annotation Placement**
   - File dialog for JPEG/PNG selection
   - Base64 encoding for storage
   - Position at click location
   - Automatic aspect ratio preservation
   - 150pt default width with proportional height

4. ✅ **Per-Page AnnotationLayer**
   - AnnotationLayer component accepts pageNumber and pageMetadata
   - Renders annotations with coordinate conversion
   - Positioned absolutely over each page canvas
   - Inline text editing support

5. ✅ **Toolbar Enhancements**
   - Disabled state when no PDF loaded
   - Visual feedback for active tool
   - Crosshair cursor for annotation tools
   - Text formatting controls visible with text tool

6. ✅ **Utilities Created**
   - `src/utils/coordinate-converter.ts` - Core coordinate math
   - `src/utils/id-generator.ts` - Unique ID generation
   - `src/utils/image-loader.ts` - Image file dialog and loading

### Technical Implementation

**Store Updates:**
- `usePDFStore` - Added pageMetadata storage and getters
- `useUIStore` - Added editingAnnotationId state

**Component Updates:**
- `PDFViewer` - Click handlers, metadata storage, AnnotationLayer integration
- `AnnotationLayer` - Coordinate conversion, inline editing, per-page rendering
- `Toolbar` - Disabled state management

### User Experience
Users can now:
- Select text/image tools from toolbar
- Click to place text annotations with inline editing
- Click to place image annotations from file system
- See annotations positioned correctly on pages
- Use Enter/Escape for text editing workflow
- Experience disabled toolbar when no PDF loaded

---

## Phase 3: Annotation Editing ✅ COMPLETE
**Goal**: Edit, move, resize, delete annotations
**Completed**: 2026-02-08
**Status**: ✅ Complete

### Completed Features

1. ✅ **Selection System**
   - Click annotation to select (visual feedback with blue ring)
   - Click outside annotation to deselect
   - Selection switches when clicking different annotation
   - 4 corner resize handles appear when selected

2. ✅ **Drag-to-Move**
   - Click and drag annotation to move
   - Real-time position updates during drag
   - Constrained to page bounds (cannot drag off page)
   - Smooth interaction with proper cursor styles

3. ✅ **Resize Handles**
   - 4 corner resize handles (top-left, top-right, bottom-left, bottom-right)
   - Each handle has appropriate cursor (nw-resize, ne-resize, sw-resize, se-resize)
   - Maintains aspect ratio for images automatically
   - Enforces minimum size constraints (20pt × 20pt)
   - Handles only visible when annotation selected

4. ✅ **Edit Text Content**
   - Double-click text annotation to edit
   - Inline editing with input field
   - Enter to save, Escape to cancel
   - Empty text deletes annotation

5. ✅ **Delete Functionality**
   - Delete/Backspace key removes selected annotation
   - No confirmation (fast workflow)
   - Selection automatically cleared after deletion

### Technical Implementation

**New Utilities:**
- `src/utils/bounds-checker.ts` - Page boundary constraints (15 tests)
- `src/utils/resize-logic.ts` - Resize calculations with aspect ratio (22 tests)

**New Components:**
- `src/components/AnnotationLayer/ResizeHandle.tsx` - Corner resize handles

**Updated Components:**
- `src/components/AnnotationLayer/AnnotationLayer.tsx`
  - Drag state management
  - Resize state management
  - Mouse event handlers (mousedown, mousemove, mouseup)
  - Double-click handler for text editing
  - Coordinate conversion for drag/resize
- `src/components/PDFViewer/PDFViewer.tsx`
  - Click-outside deselection
  - Keyboard event listener for Delete/Backspace

**State Management:**
- Uses existing store methods (updateAnnotation, deleteAnnotation, selectAnnotation)
- Local component state for drag/resize operations
- Real-time updates during interactions

### Test Coverage

**Unit Tests:** 99 tests passing (67 tests + 32 new utility tests)
- bounds-checker.ts: 15 tests
- resize-logic.ts: 22 tests
- All existing tests still passing

**Manual Test Plan:** See `docs/PHASE_3_MANUAL_TEST.md`

### User Experience

Users can now:
- Select annotations by clicking them
- Deselect by clicking on the page
- Move annotations by dragging
- Resize annotations using corner handles
- Edit text content by double-clicking
- Delete annotations with Delete/Backspace keys
- Experience smooth, responsive interactions
- See visual feedback for all operations

---

## Phase 4: PDF Export with Rust Backend ✅ COMPLETE
**Goal**: Export annotated PDF using Phase 0 implementation
**Completed**: 2026-02-08
**Status**: ✅ Complete

### Completed Features

1. ✅ **Data Transformation Layer** (`src/utils/annotation-transformer.ts`)
   - Transforms frontend annotations to Rust-compatible format
   - Page numbers: 1-indexed → 0-indexed
   - Colors: Hex strings → RGB objects
   - Fonts: UI fonts + styles → Standard 14 PDF fonts
   - Images: Data URLs → Base64 strings
   - 30 comprehensive unit tests passing

2. ✅ **Tauri Export Command** (`src-tauri/src/commands.rs`)
   - Added `export_pdf` command
   - JSON deserialization to `Vec<Annotation>`
   - Calls `apply_annotations_to_file()` from Phase 0
   - Comprehensive error handling

3. ✅ **Frontend Export Handler** (`src/App.tsx`)
   - Native save dialog integration
   - Annotation collection from store
   - Transformation to Rust format
   - Tauri command invocation
   - Success/error handling

4. ✅ **UI Feedback Enhancements**
   - Added `successMessage` state to PDF store
   - Export button shows loading spinner
   - Toast notifications (success/error)
   - Auto-dismiss after 3 seconds
   - User can manually dismiss toasts

### Technical Implementation

**New Files:**
- `src/utils/annotation-transformer.ts` - Data transformation utilities
- `src/utils/__tests__/annotation-transformer.test.ts` - 30 comprehensive tests

**Modified Files:**
- `src-tauri/src/commands.rs` - Added `export_pdf` command
- `src-tauri/src/lib.rs` - Registered `export_pdf` in invoke handler
- `src/App.tsx` - Implemented export handler with save dialog
- `src/stores/usePDFStore.ts` - Added `successMessage` state
- `src/components/UI/Header.tsx` - Added loading spinner to Export button
- `src/components/UI/StatusBar.tsx` - Added success/error toast messages

**Dependencies Added:**
- `@tauri-apps/plugin-dialog` - Native save dialog support

### Font Mapping System

**Supported UI Fonts → PDF Standard 14:**
- Arial → Helvetica family
- Times New Roman → Times-Roman family
- Courier New → Courier family
- Helvetica → Helvetica family
- Georgia → Times-Roman family

**Style Support:**
- ✅ Bold, Italic, Bold+Italic
- ⚠️ Underline ignored (not supported by Standard 14 fonts)

### Test Coverage

**Frontend Tests:**
- 62 unit tests passing (32 existing + 30 new transformer tests)
- 4 integration tests passing
- TypeScript compilation successful
- Build successful

**Backend Tests:**
- 40 tests passing (25 unit + 4 integration + 8 validation + 3 doc)
- All Phase 0 functionality intact
- New export command validated

### Export Workflow

1. User clicks Export button
2. Native save dialog opens with suggested filename (`original-annotated.pdf`)
3. User selects save location
4. Loading spinner appears on Export button
5. Annotations transformed to Rust format
6. Tauri command applies annotations using Phase 0 backend
7. Success toast shows: "Exported to filename.pdf"
8. Toast auto-dismisses after 3 seconds

### Known Limitations

1. **Underline Not Supported**: PDF Standard 14 fonts don't have underline variants
2. **No Export Preview**: Users must save first, then open to verify
3. **No Progress Indicator**: Large PDFs show spinner but no percentage
4. **Font Fallback**: Unknown fonts default to Helvetica

---

## Phase 5: Polish & Refinement
**Goal**: UX improvements and bug fixes

### Tasks

1. **Keyboard Shortcuts**
   - Cmd/Ctrl+O, S, Z
   - Tool shortcuts (T, I, V)
   - Delete/ESC

2. ✅ **Zoom Controls**
   - Toolbar: −/+/fit buttons with zoom% display
   - MacOS trackpad pinch (ctrlKey + wheel, debounced 150ms)
   - Keyboard shortcuts: Cmd+= zoom in, Cmd+- zoom out, Cmd+0 fit
   - Pages re-render at `fitScale × (zoomLevel / 100)`; annotations auto-adapt via `pageMetadata.scale`

3. **Error Handling**
   - Error boundaries
   - User-friendly messages
   - Validation

4. **Performance**
   - Profile and optimize
   - React.memo for re-renders
   - Test with large PDFs

5. **UI/UX Polish**
   - Animations/transitions
   - Consistent styling
   - Icons and spacing

6. **Testing**
   - macOS and Windows
   - Various PDF types
   - Edge cases

---

## Phase 6

- ✅ implement the possibility to export only the annotations as pdf.
- ✅ Implement zoom
- ✅ add capability to change font size after it is added
- ✅ remove the blue debugging squares
- ✅ Change image UX (when user click on image tool, should open file selector first and then place image on screen. Then user can move it if he wants to.)
- change mouse pointers (normal if not over an annotation, pointer to move if on top of annotation)
- update the text bounding box to match the text inside it. Maybe avoid displaying it when in edit mode. Just display it when we
select a text to move it.
- ✅ when in text edit, do not interpret backspace as "delete the annotation".
- check exports with accents
- ✅ ensure an image can be inserted at the top of the document
- check with PDFs from Ksyusha. 

---

## Implementation Status

| Phase | Status |
|-------|--------|
| **Phase 0: Rust PDF** | ✅ **Complete** (2026-02-08) |
| **Phase 1: PDF Rendering** | ✅ **Complete** (2026-02-08) |
| **Phase 2: Annotations** | ✅ **Complete** (2026-02-08) |
| Phase 3: Editing | Planned |
| **Phase 4: Export** | ✅ **Complete** (2026-02-08) |
| Phase 5: Polish | Planned |

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



---

**Document Version**: 3.0
**Last Updated**: 2026-02-08
**Status**: Phase 0 Complete - Ready for Phase 1
