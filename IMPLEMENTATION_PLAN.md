# PDF Editor - Implementation Plan

## Overview
This document outlines the implementation plan for the PDF Editor application, breaking down the work into phases and specific tasks.

**Project Status**: ✅ Phase 0 Complete - All Tests Passing!
**Current Phase**: Ready for Phase 1 - PDF Rendering
**Phase 0 Completion**: 2026-02-07 - See PHASE0_COMPLETE.md

---

## Phase 0: Rust PDF Capabilities (DERISKING)
**Goal**: Validate PDF creation and editing capabilities in Rust before building UI
**Duration Estimate**: 2-3 days
**Priority**: CRITICAL - Must complete before UI work

### Task 0.1: Research and Select Rust PDF Libraries
**Priority**: CRITICAL
**Dependencies**: None
**Estimated Time**: 1-2 hours

- [ ] Research Rust PDF creation libraries (`printpdf`, `pdf-writer`)
- [ ] Research Rust PDF manipulation libraries (`lopdf`, `pdf`)
- [ ] Evaluate library maturity and documentation
- [ ] Test basic functionality of selected libraries
- [ ] Document library choice and rationale

**Recommended Libraries**:
- **Creation**: `printpdf` (mature, well-documented)
- **Manipulation**: `lopdf` (low-level but powerful)
- **Alternative**: `pdf` crate for reading

**Technical Notes**:
```toml
# Add to src-tauri/Cargo.toml
[dependencies]
printpdf = "0.7"
lopdf = "0.32"
```

**Acceptance Criteria**:
- Libraries compile successfully
- Documentation sufficient for task
- Can create basic PDF
- Can read existing PDF

---

### Task 0.2: Create Basic PDF Generation in Rust
**Priority**: CRITICAL
**Dependencies**: Task 0.1
**Estimated Time**: 3-4 hours

- [ ] Create `src-tauri/src/pdf_ops.rs` module
- [ ] Implement function to create new PDF with text
- [ ] Add text at specific coordinates
- [ ] Support font size and family
- [ ] Save PDF to file system
- [ ] Add proper error handling

**Technical Notes**:
```rust
// src-tauri/src/pdf_ops.rs
use printpdf::*;
use std::fs::File;
use std::io::BufWriter;

pub fn create_pdf_with_text(
    path: &str,
    text: &str,
    x: f32,
    y: f32,
    font_size: f32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Create PDF document
    let (doc, page1, layer1) = PdfDocument::new(
        "Test PDF",
        Mm(210.0), // A4 width
        Mm(297.0), // A4 height
        "Layer 1"
    );

    // Load font
    let font = doc.add_builtin_font(BuiltinFont::Helvetica)?;

    // Get current page
    let current_page = doc.get_page(page1);
    let current_layer = current_page.get_layer(layer1);

    // Write text
    current_layer.use_text(text, font_size, Mm(x), Mm(y), &font);

    // Save
    doc.save(&mut BufWriter::new(File::create(path)?))?;
    Ok(())
}
```

**Acceptance Criteria**:
- Can create PDF with A4 dimensions
- Text appears at specified coordinates
- Font size applies correctly
- PDF saves successfully
- Can open result in PDF viewer

---

### Task 0.3: Implement PDF Text Addition (Core Feature)
**Priority**: CRITICAL
**Dependencies**: Task 0.2
**Estimated Time**: 4-6 hours

- [ ] Implement function to load existing PDF
- [ ] Parse PDF structure with `lopdf`
- [ ] Add new text content to existing page
- [ ] Preserve all original content
- [ ] Handle coordinate system transformations
- [ ] Save modified PDF to new file

**Technical Notes**:
```rust
use lopdf::{Document, Object, Stream, Dictionary};
use lopdf::content::{Content, Operation};

pub fn add_text_to_pdf(
    input_path: &str,
    output_path: &str,
    page_num: usize,
    text: &str,
    x: f32,
    y: f32,
    font_size: f32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Load existing PDF
    let mut doc = Document::load(input_path)?;

    // Get page
    let page_id = *doc.page_iter().nth(page_num).ok_or("Page not found")?;

    // Get page content stream
    let content_stream = /* ... extract and modify content stream ... */;

    // Add text operations to content stream
    let text_ops = format!(
        "BT /F1 {} Tf {} {} Td ({}) Tj ET",
        font_size, x, y, text
    );

    // Update page content
    // ...

    // Save modified document
    doc.save(output_path)?;
    Ok(())
}
```

**Important Notes**:
- PDF coordinate system: origin at bottom-left
- May need to embed fonts or use standard PDF fonts
- Content streams are compressed, need to decompress/recompress
- Text positioning requires understanding PDF text operators

**Acceptance Criteria**:
- Can load any valid PDF
- Original content preserved
- New text appears at correct position
- Modified PDF opens in any PDF viewer
- No corruption of original PDF structure

---

### Task 0.4: Implement PDF Text Extraction for Verification
**Priority**: CRITICAL
**Dependencies**: Task 0.3
**Estimated Time**: 2-3 hours

- [ ] Implement function to extract all text from PDF
- [ ] Parse content streams
- [ ] Decode text operations
- [ ] Return all text found in PDF
- [ ] Handle multiple pages

**Technical Notes**:
```rust
use lopdf::content::Content;

pub fn extract_text_from_pdf(
    path: &str,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let doc = Document::load(path)?;
    let mut texts = Vec::new();

    // Iterate through pages
    for page_id in doc.page_iter() {
        let content = doc.get_page_content(*page_id)?;
        let content = Content::decode(&content)?;

        // Extract text from operations
        for operation in &content.operations {
            if let Some(text) = extract_text_from_operation(operation) {
                texts.push(text);
            }
        }
    }

    Ok(texts)
}
```

**Acceptance Criteria**:
- Can extract text from any PDF
- Returns all text content
- Works with multi-page PDFs
- Handles encoded text properly

---

### Task 0.5: Write Comprehensive End-to-End Rust Test
**Priority**: CRITICAL
**Dependencies**: Task 0.2, Task 0.3, Task 0.4
**Estimated Time**: 2-3 hours

- [ ] Create integration test in `src-tauri/tests/`
- [ ] Test 1: Create initial PDF with text
- [ ] Test 2: Add additional text to that PDF
- [ ] Test 3: Extract and verify all text content
- [ ] Clean up temporary files
- [ ] Add assertions for success criteria

**Technical Notes**:
```rust
// src-tauri/tests/pdf_integration_test.rs
#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_end_to_end_pdf_editing() {
        // Step 1: Create initial PDF
        let initial_pdf = "test_initial.pdf";
        let initial_text = "Hello, World!";

        create_pdf_with_text(
            initial_pdf,
            initial_text,
            50.0,
            250.0,
            14.0
        ).expect("Failed to create initial PDF");

        assert!(std::path::Path::new(initial_pdf).exists());

        // Step 2: Add text to existing PDF
        let final_pdf = "test_final.pdf";
        let added_text = "Additional text added!";

        add_text_to_pdf(
            initial_pdf,
            final_pdf,
            0,
            added_text,
            50.0,
            200.0,
            14.0
        ).expect("Failed to add text to PDF");

        assert!(std::path::Path::new(final_pdf).exists());

        // Step 3: Extract and verify all text
        let extracted_texts = extract_text_from_pdf(final_pdf)
            .expect("Failed to extract text");

        // Verify both texts are present
        let all_text = extracted_texts.join(" ");
        assert!(all_text.contains(initial_text),
            "Initial text not found in final PDF");
        assert!(all_text.contains(added_text),
            "Added text not found in final PDF");

        // Cleanup
        fs::remove_file(initial_pdf).ok();
        fs::remove_file(final_pdf).ok();

        println!("✅ End-to-end PDF editing test passed!");
    }
}
```

**Acceptance Criteria**:
- Test creates PDF successfully
- Test adds text to PDF successfully
- Test extracts and finds both texts
- Test passes without errors
- Temporary files cleaned up
- Test is reproducible

---

### Task 0.6: Document Rust PDF Capabilities and Limitations
**Priority**: HIGH
**Dependencies**: Task 0.5
**Estimated Time**: 1 hour

- [ ] Document what works and what doesn't
- [ ] List any limitations discovered
- [ ] Document coordinate system quirks
- [ ] Note any font handling issues
- [ ] Create examples for common operations
- [ ] Update implementation plan if needed

**Acceptance Criteria**:
- Clear documentation of capabilities
- Known limitations documented
- Examples provided
- Team understands constraints

---

## Phase 1: PDF Rendering & File Operations
**Goal**: Enable users to open and view PDF files
**Duration Estimate**: 1-2 weeks

### Task 1.1: Set up PDF.js Integration
**Priority**: HIGH
**Dependencies**: None
**Estimated Time**: 2-3 hours

- [ ] Install PDF.js worker file to public directory
- [ ] Create PDF.js utility wrapper in `src/utils/pdfUtils.ts`
- [ ] Configure PDF.js worker path for Vite
- [ ] Test basic PDF loading from ArrayBuffer

**Technical Notes**:
```typescript
// src/utils/pdfUtils.ts
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const loadPDF = async (data: ArrayBuffer) => {
  return await pdfjsLib.getDocument({ data }).promise;
};
```

**Acceptance Criteria**:
- PDF.js worker loads without errors
- Can load PDF from ArrayBuffer
- No console warnings about worker path

---

### Task 1.2: Implement Tauri File Dialog
**Priority**: HIGH
**Dependencies**: None
**Estimated Time**: 2-3 hours

- [ ] Add `@tauri-apps/plugin-dialog` dependency
- [ ] Create Tauri command for opening file dialog
- [ ] Implement file reading in Rust backend
- [ ] Add file validation (check if PDF)
- [ ] Wire up "Open PDF" button to file dialog

**Technical Notes**:
```rust
// src-tauri/src/commands/file.rs
#[tauri::command]
pub async fn open_pdf_dialog() -> Result<Vec<u8>, String> {
    // Use Tauri dialog API
    // Read file as bytes
    // Return to frontend
}
```

**Acceptance Criteria**:
- File dialog opens when clicking "Open PDF"
- Can select .pdf files
- File data is read and returned to frontend
- Error handling for cancelled dialog

---

### Task 1.3: Render PDF Pages to Canvas
**Priority**: HIGH
**Dependencies**: Task 1.1
**Estimated Time**: 4-6 hours

- [ ] Update `PDFViewer.tsx` to use PDF.js
- [ ] Implement canvas rendering for single page
- [ ] Add page rendering logic with proper scaling
- [ ] Handle canvas cleanup on page change
- [ ] Add loading states during rendering

**Technical Notes**:
- Use `canvas.getContext('2d')`
- Scale canvas for retina displays (devicePixelRatio)
- Render at appropriate scale (1.5x recommended)
- Clear canvas before re-rendering

**Acceptance Criteria**:
- PDF renders clearly on canvas
- Pages scale properly with window size
- No memory leaks when switching pages
- Loading indicator shows during render

---

### Task 1.4: Implement Multi-Page Scrolling
**Priority**: MEDIUM
**Dependencies**: Task 1.3
**Estimated Time**: 3-4 hours

- [ ] Create container for multiple canvas elements
- [ ] Implement page preloading (all pages)
- [ ] Add vertical scrolling with proper spacing
- [ ] Update current page based on scroll position
- [ ] Add page separators/shadows for visual clarity

**Technical Notes**:
- Use IntersectionObserver to track visible page
- Render all pages on mount (as per spec: preload all)
- Add 20px spacing between pages
- Update `currentPage` in store based on scroll

**Acceptance Criteria**:
- All pages load and render in sequence
- Smooth scrolling between pages
- Current page indicator updates correctly
- Memory usage acceptable for typical PDFs (< 50 pages)

---

### Task 1.5: Implement Page Thumbnails
**Priority**: MEDIUM
**Dependencies**: Task 1.3
**Estimated Time**: 3-4 hours

- [ ] Render thumbnails at low resolution (0.3x scale)
- [ ] Update `Sidebar.tsx` to show actual thumbnails
- [ ] Add thumbnail click navigation
- [ ] Highlight current page thumbnail
- [ ] Add thumbnail loading states

**Technical Notes**:
- Render thumbnails to small canvases (150px wide)
- Cache thumbnail renders
- Use requestAnimationFrame for smooth updates

**Acceptance Criteria**:
- Thumbnails render for all pages
- Clicking thumbnail scrolls to that page
- Current page highlighted in sidebar
- Thumbnails load reasonably fast

---

### Task 1.6: Wire Up File Loading Flow
**Priority**: HIGH
**Dependencies**: Task 1.2, Task 1.3
**Estimated Time**: 2 hours

- [ ] Connect file dialog to PDF loading
- [ ] Update `usePDFStore` with loaded PDF data
- [ ] Show loading state during file open
- [ ] Handle errors gracefully (corrupt PDF, etc.)
- [ ] Clear previous PDF when opening new one

**Acceptance Criteria**:
- Complete flow: Open button → Dialog → Load → Render
- Error messages show for invalid files
- Loading indicator during file processing
- Can open multiple PDFs in sequence

---

## Phase 2: Annotation System
**Goal**: Enable adding text and image annotations
**Duration Estimate**: 1-2 weeks

### Task 2.1: Implement Text Annotation Placement
**Priority**: HIGH
**Dependencies**: Phase 1 complete
**Estimated Time**: 4-5 hours

- [ ] Add click handler to PDF canvas for text tool
- [ ] Create text input overlay at click position
- [ ] Calculate coordinates relative to PDF page
- [ ] Apply current text formatting settings
- [ ] Save annotation to store on blur/Enter

**Technical Notes**:
```typescript
// Convert canvas coordinates to PDF coordinates
const getPDFCoordinates = (
  canvasX: number,
  canvasY: number,
  page: PDFPageProxy,
  canvas: HTMLCanvasElement
) => {
  const viewport = page.getViewport({ scale: 1 });
  const scaleX = viewport.width / canvas.width;
  const scaleY = viewport.height / canvas.height;
  return {
    x: canvasX * scaleX,
    y: canvasY * scaleY,
  };
};
```

**Acceptance Criteria**:
- Clicking with text tool shows input field
- Text appears at correct position
- Formatting from toolbar applies correctly
- Annotation persists in store

---

### Task 2.2: Implement Image Annotation Placement
**Priority**: HIGH
**Dependencies**: Phase 1 complete
**Estimated Time**: 3-4 hours

- [ ] Add image file dialog when image tool selected
- [ ] Convert image to base64 for storage
- [ ] Show image preview on cursor
- [ ] Place image at click position
- [ ] Set default size (200x150px)

**Technical Notes**:
- Use FileReader for base64 conversion
- Validate image format (PNG/JPEG only)
- Add max file size check (5MB)

**Acceptance Criteria**:
- Image dialog opens with image tool
- Only PNG/JPEG files accepted
- Image appears at click position
- Image stored with base64 data

---

### Task 2.3: Implement Annotation Rendering Layer
**Priority**: HIGH
**Dependencies**: Task 2.1, Task 2.2
**Estimated Time**: 3-4 hours

- [ ] Position annotation layer over canvas
- [ ] Render annotations for current page
- [ ] Handle z-index and layering
- [ ] Ensure annotations scale with canvas
- [ ] Add pointer-events handling

**Technical Notes**:
- Use absolute positioning overlay
- Transform annotation coordinates back to screen space
- Render only annotations for visible pages

**Acceptance Criteria**:
- Annotations appear on correct pages
- Annotations scale with zoom/window resize
- No performance issues with 50+ annotations
- Annotations don't interfere with scrolling

---

### Task 2.4: Update Toolbar with Active States
**Priority**: LOW
**Dependencies**: Task 2.1, Task 2.2
**Estimated Time**: 1-2 hours

- [ ] Show active tool with visual indicator
- [ ] Disable tools when no PDF loaded
- [ ] Update cursor style based on active tool
- [ ] Show formatting options only for text tool
- [ ] Add tool tooltips

**Acceptance Criteria**:
- Clear visual feedback for active tool
- Tools disabled appropriately
- Cursor changes to indicate tool mode
- User understands current tool state

---

## Phase 3: Annotation Editing
**Goal**: Enable editing, moving, resizing, and deleting annotations
**Duration Estimate**: 1 week

### Task 3.1: Implement Annotation Selection
**Priority**: HIGH
**Dependencies**: Phase 2 complete
**Estimated Time**: 3-4 hours

- [ ] Add click handler to annotations
- [ ] Show selection border when selected
- [ ] Update `selectedAnnotationId` in store
- [ ] Deselect when clicking outside
- [ ] Show resize handles on selection

**Technical Notes**:
```typescript
// Selection state styling
const selectionStyle = isSelected ? {
  outline: '2px solid #0ea5e9',
  outlineOffset: '2px'
} : {};
```

**Acceptance Criteria**:
- Clicking annotation selects it
- Visual feedback for selection
- Clicking outside deselects
- Only one annotation selected at a time

---

### Task 3.2: Implement Drag-to-Move
**Priority**: HIGH
**Dependencies**: Task 3.1
**Estimated Time**: 4-5 hours

- [ ] Add mousedown handler to start drag
- [ ] Track mouse movement during drag
- [ ] Update annotation position in real-time
- [ ] Constrain to page boundaries
- [ ] Update store on drag end

**Technical Notes**:
- Use `onMouseDown`, `onMouseMove`, `onMouseUp`
- Calculate delta from initial position
- Add visual feedback during drag (cursor, opacity)
- Prevent text selection during drag

**Acceptance Criteria**:
- Can drag annotations smoothly
- Annotation doesn't leave page bounds
- Position updates persist
- No lag during drag

---

### Task 3.3: Implement Resize Handles
**Priority**: HIGH
**Dependencies**: Task 3.1
**Estimated Time**: 5-6 hours

- [ ] Show 8 resize handles when selected (corners + edges)
- [ ] Implement corner resize (maintain aspect ratio for images)
- [ ] Implement edge resize (width or height only)
- [ ] Update annotation size in real-time
- [ ] Set minimum size constraints (20x20px)

**Technical Notes**:
```typescript
// Handle positions: nw, n, ne, e, se, s, sw, w
const handleSize = 8; // 8px squares
const minSize = { width: 20, height: 20 };
```

**Acceptance Criteria**:
- 8 handles visible on selected annotation
- Corner resize maintains proportions (images)
- Edge resize changes one dimension
- Minimum size enforced
- Smooth resize performance

---

### Task 3.4: Implement Edit Text Content
**Priority**: MEDIUM
**Dependencies**: Task 3.1
**Estimated Time**: 2-3 hours

- [ ] Double-click text annotation to edit
- [ ] Show input field with current content
- [ ] Update content on blur or Enter
- [ ] Allow changing formatting while editing
- [ ] Cancel edit on Escape

**Acceptance Criteria**:
- Double-click enters edit mode
- Can modify text content
- Formatting changes apply
- ESC cancels, Enter saves

---

### Task 3.5: Implement Delete Annotation
**Priority**: MEDIUM
**Dependencies**: Task 3.1
**Estimated Time**: 1-2 hours

- [ ] Wire up Delete button in toolbar
- [ ] Add keyboard shortcut (Delete/Backspace)
- [ ] Remove annotation from store
- [ ] Add confirmation for accidental deletes
- [ ] Update UI immediately

**Acceptance Criteria**:
- Delete button removes selected annotation
- Delete key works
- Optional: Confirmation dialog
- No orphaned data in store

---

## Phase 4: PDF Export (Using Rust Backend)
**Goal**: Export annotated PDF as new file using validated Rust capabilities
**Duration Estimate**: 3-5 days
**Note**: Much faster due to Phase 0 derisking

### Task 4.1: Create Tauri Command for PDF Export
**Priority**: HIGH
**Dependencies**: Phase 0 complete
**Estimated Time**: 2-3 hours

- [ ] Create `export_pdf` Tauri command in `src-tauri/src/commands/export.rs`
- [ ] Accept original PDF bytes and annotation data from frontend
- [ ] Call Rust PDF manipulation functions from Phase 0
- [ ] Return exported PDF bytes or error
- [ ] Add proper error handling and logging

**Technical Notes**:
```rust
// src-tauri/src/commands/export.rs
use crate::pdf_ops::{add_text_to_pdf, add_image_to_pdf};

#[derive(serde::Deserialize)]
pub struct AnnotationData {
    annotation_type: String,
    page_number: usize,
    x: f32,
    y: f32,
    // ... other fields
}

#[tauri::command]
pub async fn export_pdf_with_annotations(
    original_pdf_path: String,
    annotations: Vec<AnnotationData>,
) -> Result<Vec<u8>, String> {
    // Use proven Rust functions from Phase 0
    // Process each annotation
    // Return final PDF bytes
}
```

**Acceptance Criteria**:
- Tauri command compiles and registers
- Can receive PDF and annotations from frontend
- Returns valid PDF bytes
- Proper error messages

---

### Task 4.2: Extend Rust PDF Functions for All Annotation Types
**Priority**: HIGH
**Dependencies**: Task 4.1, Phase 0
**Estimated Time**: 4-5 hours

- [ ] Extend `add_text_to_pdf` to support font family, size, color
- [ ] Add support for text styles (bold, italic, underline)
- [ ] Implement `add_image_to_pdf` function for image annotations
- [ ] Support PNG and JPEG image formats
- [ ] Handle coordinate transformations from frontend
- [ ] Batch process multiple annotations

**Technical Notes**:
```rust
pub fn add_text_annotation(
    doc: &mut Document,
    page_num: usize,
    text: &str,
    x: f32,
    y: f32,
    font_family: &str,
    font_size: f32,
    color: (u8, u8, u8),
    styles: &[TextStyle],
) -> Result<(), Box<dyn std::error::Error>> {
    // Build on Phase 0 work
    // Add formatting support
    // Handle styles (bold/italic/underline)
}

pub fn add_image_annotation(
    doc: &mut Document,
    page_num: usize,
    image_bytes: &[u8],
    image_format: ImageFormat,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Decode image
    // Embed in PDF
    // Place at coordinates
}
```

**Acceptance Criteria**:
- All text formatting options supported
- Images (PNG/JPEG) can be embedded
- Coordinates transform correctly
- Multiple annotations processed successfully

---

### Task 4.3: Implement Tauri Save Dialog & File Writing
**Priority**: HIGH
**Dependencies**: Task 4.2
**Estimated Time**: 2-3 hours

- [ ] Create Tauri command for save file dialog
- [ ] Use Tauri dialog API to prompt for save location
- [ ] Suggest filename (original_edited.pdf)
- [ ] Write exported PDF bytes to file
- [ ] Handle file write errors
- [ ] Return saved file path

**Technical Notes**:
```rust
use tauri::api::dialog::FileDialogBuilder;

#[tauri::command]
pub async fn save_pdf_dialog(
    pdf_bytes: Vec<u8>,
    suggested_name: String,
) -> Result<String, String> {
    // Open save dialog with suggested name
    // Write bytes to selected path
    // Return saved path or error
    std::fs::write(&path, pdf_bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(path)
}
```

**Acceptance Criteria**:
- Save dialog opens with suggested name
- PDF bytes written successfully
- Returns path to saved file
- Errors handled with clear messages

---

### Task 4.4: Frontend Export Integration
**Priority**: HIGH
**Dependencies**: Task 4.1, Task 4.3
**Estimated Time**: 3-4 hours

- [ ] Create export utility in frontend (`src/utils/exportUtils.ts`)
- [ ] Collect all annotations from store
- [ ] Convert annotations to format expected by Rust
- [ ] Call `export_pdf_with_annotations` Tauri command
- [ ] Get original PDF data from store
- [ ] Handle temporary file creation if needed
- [ ] Transform frontend coordinates to PDF coordinates

**Technical Notes**:
```typescript
// src/utils/exportUtils.ts
import { invoke } from '@tauri-apps/api/core';
import { usePDFStore } from '../stores/usePDFStore';
import { useAnnotationStore } from '../stores/useAnnotationStore';

export const exportAnnotatedPDF = async () => {
  const { document: pdfDoc } = usePDFStore.getState();
  const { annotations } = useAnnotationStore.getState();

  // Convert annotations to Rust format
  const rustAnnotations = annotations.map(convertToRustFormat);

  // Call Rust command
  const pdfBytes = await invoke('export_pdf_with_annotations', {
    originalPdfPath: pdfDoc.filePath,
    annotations: rustAnnotations,
  });

  // Save using dialog
  const savedPath = await invoke('save_pdf_dialog', {
    pdfBytes,
    suggestedName: `${pdfDoc.fileName}_edited.pdf`,
  });

  return savedPath;
};
```

**Acceptance Criteria**:
- All annotations collected correctly
- Coordinates transformed properly
- Tauri commands invoked successfully
- Error handling in place

---

### Task 4.5: Wire Up Export UI Flow
**Priority**: HIGH
**Dependencies**: Task 4.4
**Estimated Time**: 2 hours

- [ ] Connect Export button to export logic
- [ ] Show progress indicator during export
- [ ] Disable UI during export process
- [ ] Show success message with file path
- [ ] Handle and display export errors
- [ ] Optional: Open exported file in default viewer

**Technical Notes**:
```typescript
const handleExport = async () => {
  try {
    setExporting(true);
    const savedPath = await exportAnnotatedPDF();
    showSuccessToast(`PDF saved to: ${savedPath}`);
    // Optional: open file
    // await invoke('open_file', { path: savedPath });
  } catch (error) {
    showErrorToast(`Export failed: ${error}`);
  } finally {
    setExporting(false);
  }
};
```

**Acceptance Criteria**:
- Export button triggers full flow
- Loading indicator shows during export
- UI disabled during export
- Success message displays file path
- Errors shown clearly to user
- Smooth user experience

---

## Phase 5: Polish & Refinement
**Goal**: Improve UX, add enhancements, fix bugs
**Duration Estimate**: 1 week

### Task 5.1: Add Keyboard Shortcuts
**Priority**: MEDIUM
**Dependencies**: All core features complete
**Estimated Time**: 2-3 hours

- [ ] Cmd/Ctrl+O: Open PDF
- [ ] Cmd/Ctrl+S: Export PDF
- [ ] Cmd/Ctrl+Z: Undo (if implemented)
- [ ] Delete/Backspace: Delete selected
- [ ] ESC: Deselect
- [ ] T: Text tool, I: Image tool, V: Select tool

**Acceptance Criteria**:
- All shortcuts work as expected
- No conflicts with browser shortcuts
- Shortcuts documented in UI (tooltips)

---

### Task 5.2: Add Zoom Controls (Display Only)
**Priority**: LOW
**Dependencies**: Phase 1 complete
**Estimated Time**: 1-2 hours

- [ ] Add zoom display in status bar
- [ ] Show current zoom percentage
- [ ] Update when window resizes
- [ ] (Future: Add zoom in/out buttons)

**Acceptance Criteria**:
- Zoom level displays correctly
- Updates on window resize
- Accurate percentage shown

---

### Task 5.3: Error Handling & Validation
**Priority**: HIGH
**Dependencies**: All core features
**Estimated Time**: 3-4 hours

- [ ] Add error boundaries in React
- [ ] Validate all user inputs
- [ ] Handle PDF loading failures gracefully
- [ ] Handle export failures
- [ ] Add user-friendly error messages
- [ ] Log errors for debugging

**Acceptance Criteria**:
- No uncaught exceptions
- All errors show friendly messages
- App doesn't crash on errors
- Users understand what went wrong

---

### Task 5.4: Performance Optimization
**Priority**: MEDIUM
**Dependencies**: All core features
**Estimated Time**: 4-6 hours

- [ ] Profile render performance
- [ ] Optimize re-renders with React.memo
- [ ] Debounce expensive operations
- [ ] Lazy load thumbnails
- [ ] Optimize annotation rendering
- [ ] Test with large PDFs (100+ pages)

**Acceptance Criteria**:
- Smooth scrolling with 50+ pages
- No frame drops during annotation drag
- Memory usage reasonable
- Renders efficiently

---

### Task 5.5: UI/UX Polish
**Priority**: MEDIUM
**Dependencies**: All core features
**Estimated Time**: 3-4 hours

- [ ] Add animations/transitions
- [ ] Improve button hover states
- [ ] Add loading skeletons
- [ ] Improve spacing and alignment
- [ ] Add icons where appropriate
- [ ] Ensure consistent styling

**Acceptance Criteria**:
- UI feels smooth and polished
- Consistent design language
- Professional appearance
- Good visual feedback

---

### Task 5.6: Testing & Bug Fixes
**Priority**: HIGH
**Dependencies**: All features complete
**Estimated Time**: 1-2 days

- [ ] Test on macOS (Intel & Apple Silicon)
- [ ] Test on Windows 10 & 11
- [ ] Test with various PDF types
- [ ] Test edge cases (empty PDF, huge PDF, etc.)
- [ ] Fix discovered bugs
- [ ] Create bug tracking list

**Acceptance Criteria**:
- Works on all target platforms
- No critical bugs
- All core features functional
- Known issues documented

---

## Optional Enhancements (Post-MVP)

### Enhancement 1: Undo/Redo System
**Priority**: NICE-TO-HAVE
**Estimated Time**: 6-8 hours

- [ ] Implement command pattern for actions
- [ ] Create undo/redo stack in store
- [ ] Add undo/redo buttons to toolbar
- [ ] Keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- [ ] Limit history to last 50 actions

---

### Enhancement 2: Annotation Templates
**Priority**: NICE-TO-HAVE
**Estimated Time**: 4-5 hours

- [ ] Save current text formatting as template
- [ ] Quick-apply saved templates
- [ ] Manage templates (add/remove/edit)
- [ ] Persist templates to local storage

---

### Enhancement 3: Multiple Page Selection
**Priority**: NICE-TO-HAVE
**Estimated Time**: 3-4 hours

- [ ] Show page range selector
- [ ] Jump to specific page
- [ ] Keyboard navigation (arrow keys)

---

## Success Metrics

### Phase 0 (Rust PDF Capabilities - CRITICAL)
- [ ] ✅ End-to-end Rust test passes
- [ ] ✅ Can create PDF with text programmatically
- [ ] ✅ Can add text to existing PDF
- [ ] ✅ Can extract text from PDF for verification
- [ ] ✅ All three operations work in sequence
- [ ] ✅ No data loss or PDF corruption
- [ ] 📝 Limitations documented

**Exit Criteria**: All Phase 0 tests must pass before proceeding to UI work

### Phase 1 (PDF Rendering)
- [ ] Can open any valid PDF file
- [ ] All pages render correctly
- [ ] Page navigation works smoothly
- [ ] Load time < 3 seconds for 20-page PDF

### Phase 2 (Annotations)
- [ ] Can add text with all formatting options
- [ ] Can add images (PNG/JPEG)
- [ ] Annotations appear on correct pages
- [ ] No annotation placement errors

### Phase 3 (Editing)
- [ ] Can move, resize, edit, delete annotations
- [ ] All actions feel smooth (no lag)
- [ ] Changes persist correctly

### Phase 4 (Export)
- [ ] Exported PDF contains all annotations (validated by Phase 0)
- [ ] Annotations positioned correctly
- [ ] Export completes in < 5 seconds for typical PDF
- [ ] Output readable in all PDF viewers
- [ ] Frontend-to-Rust integration works seamlessly

### Phase 5 (Polish)
- [ ] No crashes or critical bugs
- [ ] Professional UI appearance
- [ ] Responsive and smooth interactions
- [ ] App bundle size < 50MB

---

## Development Guidelines

### Before Starting Each Task:
1. Read the task description and acceptance criteria
2. Review related code and dependencies
3. Create a branch for the task (e.g., `feat/pdf-rendering`)
4. Break down into smaller sub-tasks if needed

### While Working:
1. Commit frequently with clear messages
2. Test each piece as you build it
3. Keep the app in a runnable state
4. Document complex logic with comments

### After Completing Each Task:
1. Test all acceptance criteria
2. Update this plan with ✅ checkmarks
3. Commit and push changes
4. Create PR or merge to main
5. Update README if needed

---

## Risk Assessment

### High Risk Areas (MITIGATED BY PHASE 0):
1. ~~**Export Quality**: Annotations might not render correctly~~
   - ✅ **DERISKED**: Phase 0 validates Rust PDF capabilities with tests
   - Mitigation: Proven in Rust before UI work begins
2. **PDF.js Integration**: Complex library, potential memory issues
   - Mitigation: Start early, test with various PDFs
3. **Coordinate Transformations**: Easy to get wrong (frontend ↔ PDF space)
   - Mitigation: Create utility functions, validate in Phase 0, test thoroughly

### Medium Risk Areas:
1. **Performance**: Large PDFs may cause issues
   - Mitigation: Profile early, optimize as needed
2. **Cross-Platform**: macOS vs Windows differences
   - Mitigation: Test on both platforms regularly
3. **Rust PDF Library Limitations**: May not support all features
   - ✅ **DERISKED**: Phase 0 identifies limitations early

### Low Risk (Thanks to Phase 0):
1. **PDF Export Implementation**: Validated before UI work
2. **Text/Image Embedding**: Proven with end-to-end tests

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| **Phase 0: Rust PDF (Derisking)** | **2-3 days** | **3 days** |
| Phase 1: PDF Rendering | 1-2 weeks | 2.5 weeks |
| Phase 2: Annotations | 1-2 weeks | 4.5 weeks |
| Phase 3: Editing | 1 week | 5.5 weeks |
| Phase 4: Export (Faster!) | 3-5 days | 6 weeks |
| Phase 5: Polish | 1 week | 7 weeks |

**Total Estimated Time**: 6-7 weeks for full MVP

**Key Benefits of Phase 0**:
- Critical risks identified and mitigated early
- Phase 4 reduced from 1 week to 3-5 days
- Higher confidence in export functionality
- Clear understanding of PDF library limitations

---

## Getting Started

**Current Status**: ✅ Ready to begin Phase 0 (DERISKING)

**Next Immediate Steps**:
1. **Start with Task 0.1**: Research Rust PDF libraries
2. **Complete Task 0.2**: Create basic PDF generation
3. **Complete Task 0.3**: Implement PDF text addition (CRITICAL)
4. **Complete Task 0.5**: Write end-to-end test (VALIDATION)

**To Begin Development**:
```bash
# Add Rust dependencies
cd src-tauri
cargo add printpdf lopdf

# Create PDF operations module
touch src/pdf_ops.rs

# Create test directory
mkdir -p tests
touch tests/pdf_integration_test.rs

# Run tests
cargo test

# When Phase 0 complete, start UI work
cd ..
npm run tauri dev
git checkout -b feat/rust-pdf-capabilities
```

---

**Document Version**: 2.0
**Last Updated**: 2026-02-07
**Status**: Ready for Phase 0 Implementation (DERISKING PHASE)
