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
npm run test:unit           # Run unit tests only (fast, < 1 second)
npm run test:unit:watch     # Watch mode for development
npm run test:unit:ui        # Visual UI in browser
npm run test:coverage       # Generate coverage report

# Integration tests (configured but not yet functional - see docs/INTEGRATION_TESTS_STATUS.md)
# These commands exist but tests fail due to Tauri API mocking challenges
npm run test:integration    # Would test user flows (needs work)
npm run test:integration:ui # Visual Playwright UI
npm run test:integration:debug  # Step-by-step debugger
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

## Testing Strategy

This project uses a hybrid testing approach with comprehensive coverage:

**Frontend Tests:**
- **Unit Tests**: Test stores, utilities, and core logic in isolation
  - Located in `src/**/__tests__/`
- **Integration Tests:**
  - Uses Tauri's `mockIPC` to simulate Rust backend
  - Located in `tests/integration/`

**Backend Tests:**
- **Unit Tests**: Test PDF operations in `src/pdf_ops.rs`
- **Integration Tests**: Test end-to-end workflows and validation
- Located in `src-tauri/tests/`

**When to Run Tests:**
- **During development**: Run unit tests in watch mode (`npm run test:unit:watch`)
- **Before committing**: Run all unit tests (`npm run test:unit` + `cargo test`)
- **When changing stores/utils**: Run relevant unit tests
- **When changing PDF operations**: Run backend tests
- **Before releases**: Run integration tests (`npm run test:integration`) and manual testing


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

**Always run tests after making changes:**

**Frontend tests (for UI/TypeScript changes):**
```bash
npm run test:unit           # Fast unit tests (< 1 second)
npm run test:integration    # Integration tests (3 tests, ~4 seconds)
```

**About Integration Tests:**
- Test complete user flows (PDF loading, text annotations)
- Use Tauri's `mockIPC` to simulate Rust backend
- Playwright automatically starts/stops dev server
- Run these before marking UI work complete

**Backend tests (for Rust changes):**
```bash
cd src-tauri
cargo test
```

**Run all tests (before marking work complete):**
```bash
npm run test:unit           # Frontend unit tests (< 1 second)
npm run test:integration    # Frontend integration tests (~4 seconds)
cd src-tauri && cargo test  # Backend tests (~5 seconds)
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
- [ ] All frontend unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test:integration`)
  - 3 tests should pass, 1 skipped
  - Playwright starts dev server automatically
  - Takes ~4 seconds to run
- [ ] All backend tests pass (`cargo test`)
- [ ] Manual testing completed (for UI changes, if needed)
- [ ] `docs/IMPLEMENTATION_PLAN.md` updated
- [ ] Related documentation updated if needed
- [ ] No compiler warnings introduced
