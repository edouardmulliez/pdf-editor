use printpdf::*;
use std::fs::File;
use std::io::BufWriter;

// Use explicit crate path to avoid ambiguity with printpdf's re-export
use ::lopdf::{Document, Object, Stream, Dictionary, content::{Content, Operation}};

/// Creates a new PDF with text at specified coordinates
///
/// # Arguments
/// * `path` - Output file path
/// * `text` - Text to add
/// * `x` - X coordinate in millimeters
/// * `y` - Y coordinate in millimeters
/// * `font_size` - Font size in points
pub fn create_pdf_with_text(
    path: &str,
    text: &str,
    x: f32,
    y: f32,
    font_size: f32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Create PDF document (A4 size)
    let (doc, page1, layer1) = PdfDocument::new(
        "PDF Editor Test",
        Mm(210.0), // A4 width
        Mm(297.0), // A4 height
        "Layer 1"
    );

    // Load built-in font
    let font = doc.add_builtin_font(BuiltinFont::Helvetica)?;

    // Get current page and layer
    let current_page = doc.get_page(page1);
    let current_layer = current_page.get_layer(layer1);

    // Write text
    current_layer.use_text(text, font_size, Mm(x), Mm(y), &font);

    // Save document
    doc.save(&mut BufWriter::new(File::create(path)?))?;

    println!("✅ Created PDF: {}", path);
    Ok(())
}

/// Adds text to an existing PDF at specified coordinates
///
/// # Arguments
/// * `input_path` - Path to existing PDF
/// * `output_path` - Path for output PDF
/// * `page_num` - Page number (0-indexed)
/// * `text` - Text to add
/// * `x` - X coordinate in points (72 points = 1 inch)
/// * `y` - Y coordinate in points (from bottom-left)
/// * `font_size` - Font size in points
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
    let mut doc = Document::load(input_path)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    // Get page ID
    let pages: Vec<_> = doc.page_iter().collect();
    if page_num >= pages.len() {
        return Err(format!("Page {} not found (PDF has {} pages)", page_num, pages.len()).into());
    }
    let page_id = pages[page_num];

    // Font resource name that printpdf uses (must match existing Resources dictionary)
    let font_name = "Helvetica";

    // Create NEW content stream with just our text operations
    // This is more compatible than trying to decode/merge existing streams
    let mut content = Content { operations: vec![] };

    // Add text operations to new content stream
    // BT = Begin Text, Tf = Set font and size, Td = Move position, Tj = Show text, ET = End Text
    content.operations.push(Operation::new("BT", vec![]));
    content.operations.push(Operation::new("Tf", vec![
        font_name.into(),
        font_size.into(),
    ]));
    content.operations.push(Operation::new("Td", vec![
        x.into(),
        y.into(),
    ]));
    content.operations.push(Operation::new("Tj", vec![
        Object::String(text.as_bytes().to_vec(), ::lopdf::StringFormat::Literal)
    ]));
    content.operations.push(Operation::new("ET", vec![]));

    // Encode and compress our new content stream
    let encoded_content = content.encode()
        .map_err(|e| format!("Failed to encode content: {}", e))?;

    let mut new_stream = Stream::new(Dictionary::new(), encoded_content);
    new_stream.compress()
        .map_err(|e| format!("Failed to compress stream: {}", e))?;

    // Add our new stream as an object
    let new_content_id = doc.add_object(new_stream);

    // Get the existing Contents reference
    let page_dict = doc.get_object(page_id)
        .map_err(|e| format!("Failed to get page: {}", e))?
        .as_dict()
        .map_err(|e| format!("Page is not a dictionary: {}", e))?;

    let existing_contents = page_dict.get(b"Contents")
        .map_err(|e| format!("No existing Contents: {}", e))?;

    // Create array of content streams: [original, new]
    // This is the correct way to add content - Safari/Preview require this
    let contents_array = match existing_contents {
        Object::Reference(ref_id) => {
            // Single existing stream - create array with both
            vec![Object::Reference(*ref_id), Object::Reference(new_content_id)]
        }
        Object::Array(arr) => {
            // Already an array - append our new stream
            let mut new_arr = arr.clone();
            new_arr.push(Object::Reference(new_content_id));
            new_arr
        }
        _ => {
            // Fallback - just use our new content
            vec![Object::Reference(new_content_id)]
        }
    };

    // Update page with content array
    let page_dict = doc.get_object_mut(page_id)?
        .as_dict_mut()
        .map_err(|e| format!("Failed to get mutable page dict: {}", e))?;

    page_dict.set("Contents", Object::Array(contents_array));

    // Save modified document
    doc.save(output_path)
        .map_err(|e| format!("Failed to save PDF: {}", e))?;

    println!("✅ Added text to PDF: {} -> {}", input_path, output_path);
    Ok(())
}

/// Extracts all text from a PDF file
///
/// # Arguments
/// * `path` - Path to PDF file
///
/// # Returns
/// Vector of text strings found in the PDF
pub fn extract_text_from_pdf(path: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let doc = Document::load(path)?;
    let mut texts = Vec::new();

    // Iterate through all pages
    for page_id in doc.page_iter() {
        // Get page content
        let page_dict = doc.get_object(page_id)?.as_dict()?;

        if let Ok(contents) = page_dict.get(b"Contents") {
            // Contents can be a single stream or an array of streams
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
                Object::Stream(_) => {
                    // Embedded stream - handle directly
                    if let Ok(stream) = contents.as_stream() {
                        if let Ok(content) = Content::decode(&stream.content) {
                            for operation in &content.operations {
                                if let "Tj" | "TJ" = operation.operator.as_ref() {
                                    for operand in &operation.operands {
                                        if let Ok(text) = extract_text_from_operand(operand) {
                                            texts.push(text);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    continue;
                }
                _ => continue,
            };

            // Process each content stream
            for ref_id in content_refs {
                if let Ok(content_stream) = doc.get_object(ref_id) {
                    if let Ok(stream) = content_stream.as_stream() {
                        if let Ok(content) = Content::decode(&stream.content) {
                            // Extract text from operations
                            for operation in &content.operations {
                                match operation.operator.as_ref() {
                                    "Tj" | "TJ" => {
                                        // Text showing operators
                                        for operand in &operation.operands {
                                            if let Ok(text) = extract_text_from_operand(operand) {
                                                texts.push(text);
                                            }
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    println!("✅ Extracted {} text segments from: {}", texts.len(), path);
    Ok(texts)
}

/// Helper function to extract text from PDF operand
fn extract_text_from_operand(operand: &Object) -> Result<String, Box<dyn std::error::Error>> {
    match operand {
        Object::String(bytes, _) => {
            Ok(String::from_utf8_lossy(bytes).to_string())
        }
        Object::Array(array) => {
            let mut result = String::new();
            for item in array {
                if let Object::String(bytes, _) = item {
                    result.push_str(&String::from_utf8_lossy(bytes));
                }
            }
            Ok(result)
        }
        _ => Err("Not a text operand".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn test_create_pdf() {
        let path = "test_create.pdf";
        let result = create_pdf_with_text(path, "Test PDF", 50.0, 250.0, 14.0);

        assert!(result.is_ok(), "Failed to create PDF: {:?}", result.err());
        assert!(Path::new(path).exists(), "PDF file was not created");

        // Cleanup
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn test_add_text() {
        let initial_pdf = "test_initial_for_add.pdf";
        let output_pdf = "test_with_added_text.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial text", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Add text
        let result = add_text_to_pdf(
            initial_pdf,
            output_pdf,
            0,
            "Added text",
            100.0,
            200.0,
            14.0
        );

        assert!(result.is_ok(), "Failed to add text: {:?}", result.err());
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_extract_text() {
        let path = "test_extract.pdf";
        let test_text = "Extract me!";

        // Create PDF with text
        create_pdf_with_text(path, test_text, 50.0, 250.0, 14.0)
            .expect("Failed to create PDF");

        // Extract text
        let result = extract_text_from_pdf(path);

        assert!(result.is_ok(), "Failed to extract text: {:?}", result.err());

        let texts = result.unwrap();
        assert!(!texts.is_empty(), "No text extracted");

        let all_text = texts.join(" ");
        assert!(all_text.contains(test_text),
            "Expected '{}' not found in extracted text: '{}'", test_text, all_text);

        // Cleanup
        std::fs::remove_file(path).ok();
    }
}
