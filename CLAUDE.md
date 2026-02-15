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

# Run frontend tests
npm test                    # Run all frontend tests (unit + integration) 
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
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


See [E2E_TESTING_IMPLEMENTATION.md](./docs/E2E_TESTING_IMPLEMENTATION.md) and [INTEGRATION_TESTS_FIXED.md](./docs/INTEGRATION_TESTS_FIXED.md) for detailed documentation.

## Documentation Guidelines

**New documentation should be placed in the `docs/` folder**, not in the project root. The root should only contain essential files like README.md and CLAUDE.md.

When creating new documentation:
- Implementation reports → `docs/`
- Technical specifications → `docs/`
- Phase completion reports → `docs/`
- API documentation → `docs/`

## Development Workflow

### After Completing Changes

**Run all tests (before marking work complete):**
```bash
npm run test:unit
npm run test:integration
cd src-tauri && cargo test
```

If tests fail, fix the issues before proceeding.

### Update Implementation Plan

**After completing a task or feature, update `docs/IMPLEMENTATION_PLAN.md`:**
- Mark completed tasks with ✅
- Update phase status if phase is complete
- Add any new tasks discovered during implementation

Example:
```markdown
## Phase 1: PDF Rendering ✅ COMPLETE
- ✅ PDF.js Integration
- ✅ Canvas Rendering
- ✅ Multi-Page Scrolling
```

### Verification Checklist

Before marking work as complete:
- [ ] frontend build succeeds (`npm run build`)
- [ ] All frontend tests pass (`npm run test`)
- [ ] All backend tests pass (`cargo test`)
- [ ] Manual testing completed (for UI changes, if needed)
- [ ] `docs/IMPLEMENTATION_PLAN.md` updated
- [ ] Related documentation updated if needed
- [ ] No compiler warnings introduced
