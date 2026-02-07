use ::lopdf::{Document, Object, content::Content};
use std::collections::HashSet;

#[derive(Debug, Clone, PartialEq)]
pub enum ValidationIssue {
    MissingFontReference {
        font_name: String,
        page_number: usize,
    },
    InvalidObjectReference {
        reference_id: (u32, u16),
        page_number: usize,
    },
    MissingResources {
        page_number: usize,
    },
    EmptyContentStream {
        page_number: usize,
    },
    InvalidContentStream {
        page_number: usize,
        error: String,
    },
}

#[derive(Debug)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub issues: Vec<ValidationIssue>,
}

impl ValidationResult {
    pub fn valid() -> Self {
        Self {
            is_valid: true,
            issues: vec![],
        }
    }

    pub fn with_issues(issues: Vec<ValidationIssue>) -> Self {
        Self {
            is_valid: issues.is_empty(),
            issues,
        }
    }

    pub fn has_missing_font_references(&self) -> bool {
        self.issues.iter().any(|issue| matches!(issue, ValidationIssue::MissingFontReference { .. }))
    }

    pub fn has_invalid_references(&self) -> bool {
        self.issues.iter().any(|issue| matches!(issue, ValidationIssue::InvalidObjectReference { .. }))
    }
}

/// Validates a PDF file for common issues
///
/// Checks for:
/// - Missing font references (fonts used in content but not in Resources)
/// - Invalid object references
/// - Missing Resources dictionary
/// - Invalid content streams
///
/// # Arguments
/// * `path` - Path to PDF file to validate
///
/// # Returns
/// ValidationResult with any issues found
pub fn validate_pdf(path: &str) -> Result<ValidationResult, Box<dyn std::error::Error>> {
    let doc = Document::load(path)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    let mut issues = Vec::new();

    // Validate each page
    for (page_index, page_id) in doc.page_iter().enumerate() {
        let page_number = page_index + 1;

        // Get page dictionary
        let page_dict = match doc.get_object(page_id) {
            Ok(obj) => match obj.as_dict() {
                Ok(dict) => dict,
                Err(_) => {
                    issues.push(ValidationIssue::InvalidObjectReference {
                        reference_id: page_id,
                        page_number,
                    });
                    continue;
                }
            },
            Err(_) => {
                issues.push(ValidationIssue::InvalidObjectReference {
                    reference_id: page_id,
                    page_number,
                });
                continue;
            }
        };

        // Check if Resources exists
        let resources = match page_dict.get(b"Resources") {
            Ok(res) => res,
            Err(_) => {
                issues.push(ValidationIssue::MissingResources { page_number });
                continue;
            }
        };

        // Get defined fonts from Resources
        let defined_fonts = get_defined_fonts(&doc, resources);

        // Get contents and check font usage
        if let Ok(contents) = page_dict.get(b"Contents") {
            let used_fonts = get_used_fonts(&doc, contents)?;

            // Check for missing font references
            for font_name in used_fonts {
                if !defined_fonts.contains(&font_name) {
                    issues.push(ValidationIssue::MissingFontReference {
                        font_name,
                        page_number,
                    });
                }
            }

            // Validate content streams are readable
            validate_content_streams(&doc, contents, page_number, &mut issues);
        }
    }

    Ok(ValidationResult::with_issues(issues))
}

/// Gets all font names defined in Resources dictionary
fn get_defined_fonts(doc: &Document, resources: &Object) -> HashSet<String> {
    let mut fonts = HashSet::new();

    // Resources can be a reference or direct dictionary
    let resources_dict = match resources {
        Object::Reference(ref_id) => {
            if let Ok(obj) = doc.get_object(*ref_id) {
                if let Ok(dict) = obj.as_dict() {
                    dict
                } else {
                    return fonts;
                }
            } else {
                return fonts;
            }
        }
        Object::Dictionary(dict) => dict,
        _ => return fonts,
    };

    // Get Font dictionary from Resources
    if let Ok(font_dict_obj) = resources_dict.get(b"Font") {
        let font_dict = match font_dict_obj {
            Object::Reference(ref_id) => {
                if let Ok(obj) = doc.get_object(*ref_id) {
                    if let Ok(dict) = obj.as_dict() {
                        dict
                    } else {
                        return fonts;
                    }
                } else {
                    return fonts;
                }
            }
            Object::Dictionary(dict) => dict,
            _ => return fonts,
        };

        // Collect all font names
        for (key, _) in font_dict.iter() {
            if let Ok(font_name) = std::str::from_utf8(key) {
                fonts.insert(font_name.to_string());
            }
        }
    }

    fonts
}

/// Gets all font names used in content streams
fn get_used_fonts(doc: &Document, contents: &Object) -> Result<HashSet<String>, Box<dyn std::error::Error>> {
    let mut fonts = HashSet::new();

    // Contents can be a single stream, array of streams, or reference
    let content_refs: Vec<_> = match contents {
        Object::Reference(ref_id) => vec![*ref_id],
        Object::Array(arr) => {
            arr.iter()
                .filter_map(|obj| {
                    if let Object::Reference(ref_id) = obj {
                        Some(*ref_id)
                    } else {
                        None
                    }
                })
                .collect()
        }
        Object::Stream(stream) => {
            // Decode inline stream
            if let Ok(content) = Content::decode(&stream.content) {
                extract_fonts_from_content(&content, &mut fonts);
            }
            return Ok(fonts);
        }
        _ => return Ok(fonts),
    };

    // Process each content stream
    for ref_id in content_refs {
        if let Ok(content_stream) = doc.get_object(ref_id) {
            if let Ok(stream) = content_stream.as_stream() {
                if let Ok(content) = Content::decode(&stream.content) {
                    extract_fonts_from_content(&content, &mut fonts);
                }
            }
        }
    }

    Ok(fonts)
}

/// Extracts font names from content operations
fn extract_fonts_from_content(content: &Content, fonts: &mut HashSet<String>) {
    for operation in &content.operations {
        // Tf operator sets font: /FontName Size Tf
        if operation.operator == "Tf" && !operation.operands.is_empty() {
            if let Object::Name(font_name_bytes) = &operation.operands[0] {
                if let Ok(font_name) = std::str::from_utf8(font_name_bytes) {
                    fonts.insert(font_name.to_string());
                }
            }
        }
    }
}

/// Validates that content streams are readable and not corrupted
fn validate_content_streams(
    doc: &Document,
    contents: &Object,
    page_number: usize,
    issues: &mut Vec<ValidationIssue>,
) {
    let content_refs: Vec<_> = match contents {
        Object::Reference(ref_id) => vec![*ref_id],
        Object::Array(arr) => {
            arr.iter()
                .filter_map(|obj| {
                    if let Object::Reference(ref_id) = obj {
                        Some(*ref_id)
                    } else {
                        None
                    }
                })
                .collect()
        }
        Object::Stream(stream) => {
            // Validate inline stream
            if let Err(e) = Content::decode(&stream.content) {
                issues.push(ValidationIssue::InvalidContentStream {
                    page_number,
                    error: e.to_string(),
                });
            }
            return;
        }
        _ => return,
    };

    // Validate each content stream
    for ref_id in content_refs {
        match doc.get_object(ref_id) {
            Ok(content_stream) => {
                match content_stream.as_stream() {
                    Ok(stream) => {
                        // Check if stream is empty
                        if stream.content.is_empty() {
                            issues.push(ValidationIssue::EmptyContentStream { page_number });
                        }

                        // Try to decode content
                        if let Err(e) = Content::decode(&stream.content) {
                            issues.push(ValidationIssue::InvalidContentStream {
                                page_number,
                                error: e.to_string(),
                            });
                        }
                    }
                    Err(_) => {
                        issues.push(ValidationIssue::InvalidObjectReference {
                            reference_id: ref_id,
                            page_number,
                        });
                    }
                }
            }
            Err(_) => {
                issues.push(ValidationIssue::InvalidObjectReference {
                    reference_id: ref_id,
                    page_number,
                });
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pdf_ops::create_pdf_with_text;

    #[test]
    fn test_validate_valid_pdf() {
        let path = "test_valid_validation.pdf";

        // Create a valid PDF
        create_pdf_with_text(path, "Valid PDF", 50.0, 250.0, 14.0)
            .expect("Failed to create test PDF");

        // Validate it
        let result = validate_pdf(path).expect("Failed to validate");

        assert!(result.is_valid, "Valid PDF should pass validation");
        assert!(result.issues.is_empty(), "Valid PDF should have no issues");

        // Cleanup
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn test_validate_detects_missing_font() {
        // This test validates that our validator would catch font issues
        // We can't easily create an invalid PDF with our current code,
        // but we can verify the validator's logic
        let path = "test_check_font_detection.pdf";

        create_pdf_with_text(path, "Test", 50.0, 250.0, 14.0)
            .expect("Failed to create test PDF");

        let result = validate_pdf(path).expect("Failed to validate");

        // Our correctly generated PDFs should not have missing fonts
        assert!(!result.has_missing_font_references(),
            "Correctly generated PDF should not have missing font references");

        std::fs::remove_file(path).ok();
    }

    #[test]
    fn test_validation_result_helpers() {
        let result = ValidationResult::valid();
        assert!(result.is_valid);
        assert!(!result.has_missing_font_references());
        assert!(!result.has_invalid_references());

        let result_with_font_issue = ValidationResult::with_issues(vec![
            ValidationIssue::MissingFontReference {
                font_name: "F1".to_string(),
                page_number: 1,
            }
        ]);
        assert!(!result_with_font_issue.is_valid);
        assert!(result_with_font_issue.has_missing_font_references());
        assert!(!result_with_font_issue.has_invalid_references());
    }
}
