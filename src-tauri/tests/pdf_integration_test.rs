use pdf_editor_temp_lib::pdf_ops::{create_pdf_with_text, add_text_to_pdf, extract_text_from_pdf};
use pdf_editor_temp_lib::pdf_validation::validate_pdf;
use std::path::Path;

/// End-to-end integration test for PDF editing capabilities
///
/// This test validates the complete workflow:
/// 1. Create a new PDF with text
/// 2. Add additional text to that PDF
/// 3. Extract and verify all text content is present
#[test]
fn test_end_to_end_pdf_editing() {
    // Test file paths
    let initial_pdf = "test_initial.pdf";
    let final_pdf = "test_final.pdf";

    // Cleanup any existing test files
    std::fs::remove_file(initial_pdf).ok();
    std::fs::remove_file(final_pdf).ok();

    // ========================================
    // Step 1: Create initial PDF with text
    // ========================================
    println!("\n📝 Step 1: Creating initial PDF...");

    let initial_text = "Hello, World!";
    let create_result = create_pdf_with_text(
        initial_pdf,
        initial_text,
        50.0,  // x coordinate (mm)
        250.0, // y coordinate (mm)
        14.0   // font size
    );

    assert!(
        create_result.is_ok(),
        "❌ Failed to create initial PDF: {:?}",
        create_result.err()
    );

    assert!(
        Path::new(initial_pdf).exists(),
        "❌ Initial PDF file was not created at: {}",
        initial_pdf
    );

    println!("✅ Initial PDF created successfully");

    // ========================================
    // Step 2: Add text to existing PDF
    // ========================================
    println!("\n📝 Step 2: Adding text to existing PDF...");

    let added_text = "Additional text added!";
    let add_result = add_text_to_pdf(
        initial_pdf,
        final_pdf,
        0,       // page number (0-indexed)
        added_text,
        100.0,   // x coordinate (points, 72 points = 1 inch)
        200.0,   // y coordinate (points, from bottom)
        14.0     // font size
    );

    assert!(
        add_result.is_ok(),
        "❌ Failed to add text to PDF: {:?}",
        add_result.err()
    );

    assert!(
        Path::new(final_pdf).exists(),
        "❌ Final PDF file was not created at: {}",
        final_pdf
    );

    println!("✅ Text added to PDF successfully");

    // ========================================
    // Step 3: Extract and verify all text
    // ========================================
    println!("\n📝 Step 3: Extracting and verifying text...");

    let extract_result = extract_text_from_pdf(final_pdf);

    assert!(
        extract_result.is_ok(),
        "❌ Failed to extract text from PDF: {:?}",
        extract_result.err()
    );

    let extracted_texts = extract_result.unwrap();

    assert!(
        !extracted_texts.is_empty(),
        "❌ No text was extracted from the final PDF"
    );

    // Combine all extracted text segments
    let all_text = extracted_texts.join(" ");

    println!("📄 Extracted text: '{}'", all_text);

    // Verify both original and added text are present
    assert!(
        all_text.contains(initial_text),
        "❌ Initial text '{}' not found in final PDF. Extracted: '{}'",
        initial_text,
        all_text
    );

    assert!(
        all_text.contains(added_text),
        "❌ Added text '{}' not found in final PDF. Extracted: '{}'",
        added_text,
        all_text
    );

    println!("✅ Both texts verified successfully!");

    // ========================================
    // Step 4: Validate PDF structure
    // ========================================
    println!("\n📝 Step 4: Validating PDF structure...");

    // Validate initial PDF
    let initial_validation = validate_pdf(initial_pdf)
        .expect("Failed to validate initial PDF");

    assert!(
        initial_validation.is_valid,
        "❌ Initial PDF failed validation: {:?}",
        initial_validation.issues
    );

    assert!(
        !initial_validation.has_missing_font_references(),
        "❌ Initial PDF has missing font references: {:?}",
        initial_validation.issues
    );

    println!("✅ Initial PDF structure valid (no missing fonts, no broken references)");

    // Validate final PDF
    let final_validation = validate_pdf(final_pdf)
        .expect("Failed to validate final PDF");

    assert!(
        final_validation.is_valid,
        "❌ Final PDF failed validation: {:?}",
        final_validation.issues
    );

    assert!(
        !final_validation.has_missing_font_references(),
        "❌ Final PDF has missing font references: {:?}",
        final_validation.issues
    );

    assert!(
        !final_validation.has_invalid_references(),
        "❌ Final PDF has invalid object references: {:?}",
        final_validation.issues
    );

    println!("✅ Final PDF structure valid (all fonts defined, all references valid)");

    // ========================================
    // Cleanup
    // ========================================
    println!("\n🧹 Cleaning up test files...");
    std::fs::remove_file(initial_pdf).ok();
    std::fs::remove_file(final_pdf).ok();

    println!("\n🎉 ✅ END-TO-END PDF EDITING TEST PASSED! 🎉\n");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("Phase 0 Validation Complete:");
    println!("  ✓ Can create PDFs with text");
    println!("  ✓ Can add text to existing PDFs");
    println!("  ✓ Can extract and verify text content");
    println!("  ✓ No data loss or corruption");
    println!("  ✓ PDF structure validation passes");
    println!("  ✓ No missing font references");
    println!("  ✓ No invalid object references");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/// Test creating PDF with special characters
#[test]
fn test_special_characters() {
    let path = "test_special_chars.pdf";
    std::fs::remove_file(path).ok();

    let special_text = "Hello! @#$%^&*()";
    let result = create_pdf_with_text(path, special_text, 50.0, 250.0, 14.0);

    assert!(result.is_ok(), "Failed with special characters: {:?}", result.err());

    let extracted = extract_text_from_pdf(path).unwrap();
    let all_text = extracted.join(" ");

    // Note: Some special characters might not extract perfectly
    assert!(all_text.contains("Hello"), "Basic text should extract");

    std::fs::remove_file(path).ok();
}

/// Test adding text to multiple pages (if PDF has multiple pages)
#[test]
fn test_error_handling_invalid_page() {
    let initial_pdf = "test_single_page.pdf";
    let output_pdf = "test_invalid_page.pdf";

    std::fs::remove_file(initial_pdf).ok();
    std::fs::remove_file(output_pdf).ok();

    // Create single-page PDF
    create_pdf_with_text(initial_pdf, "Page 1", 50.0, 250.0, 14.0)
        .expect("Failed to create test PDF");

    // Try to add text to page 5 (doesn't exist)
    let result = add_text_to_pdf(
        initial_pdf,
        output_pdf,
        5, // Invalid page number
        "This should fail",
        50.0,
        200.0,
        14.0
    );

    assert!(result.is_err(), "Should fail when accessing invalid page");
    assert!(result.unwrap_err().to_string().contains("not found"),
        "Error message should mention page not found");

    std::fs::remove_file(initial_pdf).ok();
    std::fs::remove_file(output_pdf).ok();
}

/// Test with different coordinate systems and positions
#[test]
fn test_coordinate_positions() {
    let path = "test_coordinates.pdf";
    std::fs::remove_file(path).ok();

    // Test various positions
    let positions = vec![
        (10.0, 10.0, "Bottom-Left"),
        (100.0, 150.0, "Middle"),
        (50.0, 280.0, "Top"),
    ];

    for (x, y, label) in positions {
        let test_path = format!("test_coord_{}_{}.pdf", x as i32, y as i32);
        let result = create_pdf_with_text(&test_path, label, x, y, 12.0);

        assert!(result.is_ok(), "Failed at position ({}, {})", x, y);

        let extracted = extract_text_from_pdf(&test_path).unwrap();
        let all_text = extracted.join(" ");
        assert!(all_text.contains(label), "Text not found at ({}, {})", x, y);

        std::fs::remove_file(test_path).ok();
    }
}
