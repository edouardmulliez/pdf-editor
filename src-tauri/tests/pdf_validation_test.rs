use pdf_editor_temp_lib::pdf_ops::{create_pdf_with_text, add_text_to_pdf};
use pdf_editor_temp_lib::pdf_validation::{validate_pdf, ValidationIssue};
use ::lopdf::{Document, Object, Dictionary, Stream, content::{Content, Operation}};

/// Test that validator correctly identifies valid PDFs
#[test]
fn test_validator_accepts_valid_pdfs() {
    let path = "test_valid_for_validator.pdf";

    // Create a valid PDF
    create_pdf_with_text(path, "Valid content", 50.0, 250.0, 14.0)
        .expect("Failed to create PDF");

    // Validate
    let result = validate_pdf(path).expect("Validation failed");

    assert!(result.is_valid, "Valid PDF should pass validation");
    assert_eq!(result.issues.len(), 0, "Valid PDF should have no issues");

    std::fs::remove_file(path).ok();
}

/// Test that validator correctly identifies PDFs with added text
#[test]
fn test_validator_accepts_modified_pdfs() {
    let original = "test_orig_for_validator.pdf";
    let modified = "test_modified_for_validator.pdf";

    // Create and modify PDF
    create_pdf_with_text(original, "Original", 50.0, 250.0, 14.0)
        .expect("Failed to create original");

    add_text_to_pdf(original, modified, 0, "Added", 50.0, 200.0, 14.0)
        .expect("Failed to add text");

    // Validate modified PDF
    let result = validate_pdf(modified).expect("Validation failed");

    assert!(result.is_valid, "Modified PDF should pass validation");
    assert!(!result.has_missing_font_references(),
        "Modified PDF should not have missing fonts");

    std::fs::remove_file(original).ok();
    std::fs::remove_file(modified).ok();
}

/// Test that validator detects missing font references
#[test]
fn test_validator_detects_missing_font_reference() {
    let path = "test_missing_font.pdf";

    // Create a PDF with correct structure first
    create_pdf_with_text(path, "Test", 50.0, 250.0, 14.0)
        .expect("Failed to create PDF");

    // Now manually corrupt it by adding a content stream with undefined font
    let mut doc = Document::load(path).expect("Failed to load");

    // Get first page
    let pages: Vec<_> = doc.page_iter().collect();
    let page_id = pages[0];

    // Create content with UNDEFINED font reference
    let mut content = Content { operations: vec![] };
    content.operations.push(Operation::new("BT", vec![]));
    content.operations.push(Operation::new("Tf", vec![
        "UndefinedFont".into(),  // This font doesn't exist!
        14.0.into(),
    ]));
    content.operations.push(Operation::new("Td", vec![50.0.into(), 200.0.into()]));
    content.operations.push(Operation::new("Tj", vec![
        Object::String(b"Bad text".to_vec(), ::lopdf::StringFormat::Literal)
    ]));
    content.operations.push(Operation::new("ET", vec![]));

    // Encode and add as new stream
    let encoded = content.encode().expect("Failed to encode");
    let mut stream = Stream::new(Dictionary::new(), encoded);
    stream.compress().ok();

    let new_stream_id = doc.add_object(stream);

    // Get existing contents and make array
    let page_dict = doc.get_object(page_id).unwrap().as_dict().unwrap();
    let existing = page_dict.get(b"Contents").unwrap();

    let contents_array = if let Object::Reference(ref_id) = existing {
        vec![Object::Reference(*ref_id), Object::Reference(new_stream_id)]
    } else {
        vec![Object::Reference(new_stream_id)]
    };

    // Update page
    let page_dict = doc.get_object_mut(page_id).unwrap().as_dict_mut().unwrap();
    page_dict.set("Contents", Object::Array(contents_array));

    // Save corrupted PDF
    doc.save(path).expect("Failed to save corrupted PDF");

    // Now validate - should detect missing font
    let result = validate_pdf(path).expect("Validation failed");

    assert!(!result.is_valid, "PDF with missing font should fail validation");
    assert!(result.has_missing_font_references(),
        "Should detect missing font reference");

    // Check that the specific font is identified
    let has_undefined_font = result.issues.iter().any(|issue| {
        matches!(issue, ValidationIssue::MissingFontReference { font_name, .. }
            if font_name == "UndefinedFont")
    });

    assert!(has_undefined_font,
        "Should specifically identify UndefinedFont as missing. Issues: {:?}",
        result.issues);

    std::fs::remove_file(path).ok();
}

/// Test that validator detects invalid object references
#[test]
fn test_validator_detects_invalid_references() {
    let path = "test_invalid_ref.pdf";

    // Create a valid PDF first
    create_pdf_with_text(path, "Test", 50.0, 250.0, 14.0)
        .expect("Failed to create PDF");

    // Corrupt it by adding reference to non-existent object
    let mut doc = Document::load(path).expect("Failed to load");

    let pages: Vec<_> = doc.page_iter().collect();
    let page_id = pages[0];

    // Add reference to non-existent object (9999, 0) in Contents array
    let page_dict = doc.get_object(page_id).unwrap().as_dict().unwrap();
    let existing = page_dict.get(b"Contents").unwrap();

    let contents_array = if let Object::Reference(ref_id) = existing {
        vec![
            Object::Reference(*ref_id),
            Object::Reference((9999, 0))  // This object doesn't exist!
        ]
    } else {
        vec![Object::Reference((9999, 0))]
    };

    let page_dict = doc.get_object_mut(page_id).unwrap().as_dict_mut().unwrap();
    page_dict.set("Contents", Object::Array(contents_array));

    doc.save(path).expect("Failed to save");

    // Validate - should detect invalid reference
    let result = validate_pdf(path).expect("Validation failed");

    assert!(!result.is_valid, "PDF with invalid reference should fail validation");
    assert!(result.has_invalid_references(),
        "Should detect invalid object reference");

    std::fs::remove_file(path).ok();
}

/// Test validator with multiple issues
#[test]
fn test_validator_detects_multiple_issues() {
    let path = "test_multiple_issues.pdf";

    // Create base PDF
    create_pdf_with_text(path, "Test", 50.0, 250.0, 14.0)
        .expect("Failed to create PDF");

    // Add multiple problems
    let mut doc = Document::load(path).expect("Failed to load");
    let pages: Vec<_> = doc.page_iter().collect();
    let page_id = pages[0];

    // Problem 1: Content with undefined font
    let mut bad_content = Content { operations: vec![] };
    bad_content.operations.push(Operation::new("BT", vec![]));
    bad_content.operations.push(Operation::new("Tf", vec![
        "BadFont1".into(),
        14.0.into(),
    ]));
    bad_content.operations.push(Operation::new("ET", vec![]));

    let encoded = bad_content.encode().unwrap();
    let mut stream1 = Stream::new(Dictionary::new(), encoded);
    stream1.compress().ok();
    let stream1_id = doc.add_object(stream1);

    // Problem 2: Reference to non-existent object
    let invalid_ref = (8888, 0);

    // Update page contents
    let page_dict = doc.get_object(page_id).unwrap().as_dict().unwrap();
    let existing = page_dict.get(b"Contents").unwrap();

    let contents_array = if let Object::Reference(ref_id) = existing {
        vec![
            Object::Reference(*ref_id),
            Object::Reference(stream1_id),
            Object::Reference(invalid_ref),
        ]
    } else {
        vec![
            Object::Reference(stream1_id),
            Object::Reference(invalid_ref),
        ]
    };

    let page_dict = doc.get_object_mut(page_id).unwrap().as_dict_mut().unwrap();
    page_dict.set("Contents", Object::Array(contents_array));

    doc.save(path).unwrap();

    // Validate - should find both issues
    let result = validate_pdf(path).expect("Validation failed");

    assert!(!result.is_valid, "PDF with multiple issues should fail");
    assert!(result.issues.len() >= 2,
        "Should detect at least 2 issues, found: {}", result.issues.len());
    assert!(result.has_missing_font_references(), "Should detect missing font");
    assert!(result.has_invalid_references(), "Should detect invalid reference");

    std::fs::remove_file(path).ok();
}

/// Test that validator handles empty PDFs
#[test]
fn test_validator_handles_empty_content() {
    let path = "test_empty_validation.pdf";

    // Create PDF with empty content
    create_pdf_with_text(path, "", 50.0, 250.0, 14.0)
        .expect("Failed to create PDF");

    let result = validate_pdf(path).expect("Validation failed");

    // Empty content is valid (just no text)
    assert!(result.is_valid, "Empty content should be valid");

    std::fs::remove_file(path).ok();
}

/// Test validator performance with multiple pages
#[test]
fn test_validator_multi_page() {
    let path1 = "test_multipage_1.pdf";
    let path2 = "test_multipage_2.pdf";
    let path3 = "test_multipage_3.pdf";

    // Create multiple single-page PDFs (our create function doesn't support multi-page)
    // This tests that validator handles multiple validation checks
    create_pdf_with_text(path1, "Page 1", 50.0, 250.0, 14.0).unwrap();
    create_pdf_with_text(path2, "Page 2", 50.0, 250.0, 14.0).unwrap();
    create_pdf_with_text(path3, "Page 3", 50.0, 250.0, 14.0).unwrap();

    // Validate each
    for path in [path1, path2, path3] {
        let result = validate_pdf(path).expect("Validation failed");
        assert!(result.is_valid, "{} should be valid", path);
        std::fs::remove_file(path).ok();
    }
}

/// Test that validator reports correct page numbers for issues
#[test]
fn test_validator_reports_correct_page_numbers() {
    let path = "test_page_numbers.pdf";

    // Create PDF with issue
    create_pdf_with_text(path, "Test", 50.0, 250.0, 14.0).unwrap();

    // Add bad font reference
    let mut doc = Document::load(path).unwrap();
    let pages: Vec<_> = doc.page_iter().collect();
    let page_id = pages[0];

    let mut content = Content { operations: vec![] };
    content.operations.push(Operation::new("Tf", vec!["MissingFont".into(), 12.0.into()]));

    let encoded = content.encode().unwrap();
    let mut stream = Stream::new(Dictionary::new(), encoded);
    stream.compress().ok();
    let stream_id = doc.add_object(stream);

    let page_dict = doc.get_object(page_id).unwrap().as_dict().unwrap();
    let existing = page_dict.get(b"Contents").unwrap();
    let contents_array = if let Object::Reference(ref_id) = existing {
        vec![Object::Reference(*ref_id), Object::Reference(stream_id)]
    } else {
        vec![Object::Reference(stream_id)]
    };

    let page_dict = doc.get_object_mut(page_id).unwrap().as_dict_mut().unwrap();
    page_dict.set("Contents", Object::Array(contents_array));
    doc.save(path).unwrap();

    // Validate
    let result = validate_pdf(path).unwrap();

    // Check page number is reported
    let has_page_1_issue = result.issues.iter().any(|issue| {
        match issue {
            ValidationIssue::MissingFontReference { page_number, .. } => *page_number == 1,
            _ => false,
        }
    });

    assert!(has_page_1_issue, "Should report issue on page 1");

    std::fs::remove_file(path).ok();
}
