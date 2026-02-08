# Phase 3: Annotation Editing - Manual Test Plan

## Overview
This document describes how to manually test all Phase 3 features.

## Prerequisites
1. Start the application: `npm run tauri dev`
2. Open a PDF document
3. Add at least 2 annotations (1 text, 1 image)

## Test Cases

### 1. Selection System ✅

**Test: Click to Select**
1. Click on a text annotation
   - Expected: Blue selection ring appears (ring-2 ring-primary-500)
   - Expected: 4 corner resize handles appear

2. Click on an image annotation
   - Expected: Blue selection ring appears
   - Expected: 4 corner resize handles appear

**Test: Click Outside to Deselect**
1. Select an annotation (click it)
2. Click on the page background (empty area)
   - Expected: Selection ring disappears
   - Expected: Resize handles disappear

**Test: Switch Selection**
1. Select first annotation
2. Click on second annotation
   - Expected: First annotation deselected
   - Expected: Second annotation selected with ring and handles

### 2. Delete Functionality ✅

**Test: Delete with Delete Key**
1. Select an annotation
2. Press the `Delete` key
   - Expected: Annotation immediately removed
   - Expected: No confirmation dialog

**Test: Delete with Backspace Key**
1. Select an annotation
2. Press the `Backspace` key
   - Expected: Annotation immediately removed
   - Expected: No confirmation dialog

**Test: Delete Does Nothing Without Selection**
1. Deselect all (click on page)
2. Press `Delete` or `Backspace`
   - Expected: Nothing happens (no errors)

### 3. Drag-to-Move ✅

**Test: Basic Drag**
1. Click and hold on annotation
2. Drag mouse to new position
3. Release mouse
   - Expected: Annotation moves smoothly during drag
   - Expected: Final position saved when released
   - Expected: Annotation stays selected after move

**Test: Bounds Constraint**
1. Drag annotation towards page edge
   - Expected: Annotation cannot be dragged outside page bounds
   - Expected: Movement stops at page boundary

**Test: Cursor Style**
1. Hover over text annotation (not editing)
   - Expected: Cursor changes to `text` cursor
2. Hover over image annotation
   - Expected: Cursor changes to `move` cursor

### 4. Resize with Handles ✅

**Test: Resize from Bottom-Right Handle**
1. Select annotation
2. Hover over bottom-right corner handle
   - Expected: Cursor changes to `se-resize`
3. Drag handle outward
   - Expected: Annotation grows
4. Drag handle inward
   - Expected: Annotation shrinks (minimum 20pt × 20pt)

**Test: Resize from Each Corner**
1. Select annotation
2. Try each corner handle (tl, tr, bl, br)
   - Expected: Annotation resizes appropriately
   - Expected: Opposite corner stays anchored

**Test: Minimum Size Constraint**
1. Select annotation
2. Try to resize very small (drag handle toward center)
   - Expected: Cannot resize smaller than 20pt × 20pt
   - Expected: Handle stops moving at minimum size

**Test: Image Aspect Ratio**
1. Add an image annotation
2. Select it and resize from any corner
   - Expected: Width and height change proportionally
   - Expected: Image never stretches or distorts

**Test: Text Free Resize**
1. Add a text annotation
2. Select it and resize
   - Expected: Can resize to any aspect ratio
   - Expected: Text reflows or stays within bounds

**Test: Resize Handle Visibility**
1. Deselect annotation
   - Expected: Resize handles not visible
2. Select annotation
   - Expected: Exactly 4 resize handles appear at corners

### 5. Edit Text Content ✅

**Test: Double-Click to Edit**
1. Double-click a text annotation
   - Expected: Input field appears
   - Expected: Current text is shown and selected
   - Expected: Input is auto-focused

**Test: Save Edit with Enter**
1. Double-click text annotation
2. Change the text
3. Press `Enter`
   - Expected: Input field disappears
   - Expected: New text is displayed
   - Expected: Annotation stays selected

**Test: Cancel Edit with Escape**
1. Double-click text annotation
2. Change the text
3. Press `Escape`
   - Expected: Input field disappears
   - Expected: Annotation is deleted (current behavior)
   - Note: This matches Phase 2 behavior for new annotations

**Test: Empty Text Deletes Annotation**
1. Double-click text annotation
2. Delete all text (empty)
3. Press `Enter` or click outside
   - Expected: Annotation is deleted

**Test: Cursor Style on Text**
1. Hover over text annotation (not selected)
   - Expected: Cursor changes to `text` cursor
2. Hover over selected text annotation
   - Expected: Cursor still shows `text` cursor

### 6. Integration Test ✅

**Test: Complete Edit Workflow**
1. Open PDF
2. Add text annotation → "First draft"
3. Add image annotation
4. Move text annotation to new position
5. Resize text annotation to be smaller
6. Double-click text, edit to "Final version", press Enter
7. Select image, resize it larger
8. Move image to new position
9. Delete text annotation (Delete key)
10. Export PDF
11. Open exported PDF in external viewer
    - Expected: Image at final position and size
    - Expected: Text annotation deleted (not present)

**Test: Multi-Annotation Management**
1. Add 5 annotations (mix of text and images)
2. Select each one by one
   - Expected: Selection switches correctly
3. Move 2 of them
4. Resize 2 of them
5. Edit text content of 1
6. Delete 1
7. Export and verify all changes applied correctly

### 7. Edge Cases ✅

**Test: Rapid Selection Changes**
1. Click annotation 1
2. Immediately click annotation 2
3. Immediately click annotation 3
   - Expected: No visual glitches
   - Expected: Selection always shows correctly

**Test: Drag While Resizing**
1. Start resizing from a handle
2. Don't let go, move annotation
   - Expected: Only resize happens (no drag)
   - Expected: No unexpected behavior

**Test: Fast Mouse Movement**
1. Click and drag annotation very fast
   - Expected: Annotation follows cursor
   - Expected: No visual lag or jittering

**Test: Mouse Leaves Window During Drag**
1. Start dragging annotation
2. Move mouse outside window while holding button
3. Release mouse button outside window
   - Expected: Drag ends cleanly
   - Expected: Annotation position is saved

**Test: Keyboard Shortcuts While Editing**
1. Double-click to edit text
2. Press `Delete` key
   - Expected: Deletes character in input (not annotation)
3. Press `Escape`
   - Expected: Cancels edit (deletes annotation per Phase 2 behavior)

## Success Criteria

All tests pass with expected behavior:
- ✅ Selection works (visual feedback)
- ✅ Deselection works (click outside)
- ✅ Delete keys remove annotations
- ✅ Drag moves annotations smoothly
- ✅ Bounds checking prevents off-page movement
- ✅ Resize handles appear when selected
- ✅ Resize works from all 4 corners
- ✅ Minimum size enforced (20pt × 20pt)
- ✅ Images maintain aspect ratio
- ✅ Double-click edits text
- ✅ Text edit saves with Enter
- ✅ Integration workflow completes successfully
- ✅ No console errors during any interaction
- ✅ Export produces correct PDF with all edits

## Performance Criteria

- Drag interaction feels smooth (< 100ms response)
- Resize interaction feels smooth (< 100ms response)
- Selection changes instantly (< 50ms)
- No lag with 10+ annotations on page
- Export completes in < 2 seconds

## Notes

- Phase 3 does not include undo/redo (planned for Phase 5)
- Escaping text edit deletes annotation (matches Phase 2 behavior for new annotations)
- No confirmation on delete (fast workflow, undo/redo in Phase 5)
- Images always maintain aspect ratio (no modifier keys needed)
