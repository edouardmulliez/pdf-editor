use pdf_editor_temp_lib::pdf_ops::{
    create_pdf_with_text, add_text_to_pdf, add_text_with_style, add_image_to_pdf,
    apply_annotations_to_file, Annotation, AnnotationType, TextAnnotation, ImageAnnotation,
    Color, Position, ImageFormat,
};
use ::lopdf::Document;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🎨 Generating test PDFs for manual inspection...\n");

    // Example 1: Simple PDF with one text
    println!("📄 Creating example_1_simple.pdf");
    create_pdf_with_text(
        "example_1_simple.pdf",
        "Hello from Rust PDF Editor!",
        50.0,  // x: 50mm from left
        250.0, // y: 250mm from bottom (near top of A4)
        16.0   // 16pt font
    )?;
    println!("   ✅ Created with single text at top\n");

    // Example 2: PDF with multiple text positions
    println!("📄 Creating example_2_original.pdf");
    create_pdf_with_text(
        "example_2_original.pdf",
        "Original Text - This was here first",
        50.0,
        250.0,
        14.0
    )?;
    println!("   ✅ Created original PDF\n");

    println!("📝 Adding text to create example_2_modified.pdf");
    add_text_to_pdf(
        "example_2_original.pdf",
        "example_2_modified.pdf",
        0, // page 0
        "Added Text - This was added later!",
        50.0,
        200.0, // Lower position
        14.0
    )?;
    println!("   ✅ Created modified version with additional text\n");

    // Example 3: Different font sizes
    println!("📄 Creating example_3_font_sizes.pdf");
    create_pdf_with_text(
        "example_3_font_sizes.pdf",
        "Large Text (24pt)",
        50.0,
        260.0,
        24.0
    )?;

    add_text_to_pdf(
        "example_3_font_sizes.pdf",
        "example_3_font_sizes.pdf",
        0,
        "Medium Text (16pt)",
        50.0,
        220.0,
        16.0
    )?;

    add_text_to_pdf(
        "example_3_font_sizes.pdf",
        "example_3_font_sizes.pdf",
        0,
        "Small Text (10pt)",
        50.0,
        190.0,
        10.0
    )?;
    println!("   ✅ Created with multiple font sizes\n");

    // Example 4: Different positions
    println!("📄 Creating example_4_positions.pdf");
    create_pdf_with_text(
        "example_4_positions.pdf",
        "Top Left",
        20.0,
        270.0,
        12.0
    )?;

    add_text_to_pdf(
        "example_4_positions.pdf",
        "example_4_positions.pdf",
        0,
        "Middle",
        90.0,
        150.0,
        12.0
    )?;

    add_text_to_pdf(
        "example_4_positions.pdf",
        "example_4_positions.pdf",
        0,
        "Bottom Right",
        140.0,
        30.0,
        12.0
    )?;
    println!("   ✅ Created with different positions\n");

    // Example 5: Longer text
    println!("📄 Creating example_5_long_text.pdf");
    create_pdf_with_text(
        "example_5_long_text.pdf",
        "This is a longer piece of text to test how it renders in the PDF viewer.",
        20.0,
        250.0,
        14.0
    )?;

    add_text_to_pdf(
        "example_5_long_text.pdf",
        "example_5_long_text.pdf",
        0,
        "Line 2: The quick brown fox jumps over the lazy dog.",
        20.0,
        230.0,
        14.0
    )?;

    add_text_to_pdf(
        "example_5_long_text.pdf",
        "example_5_long_text.pdf",
        0,
        "Line 3: Testing special characters: @#$%^&*()_+-={}[]|",
        20.0,
        210.0,
        14.0
    )?;
    println!("   ✅ Created with multiple lines of text\n");

    // Example 6: Colored text with different fonts (NEW!)
    println!("📄 Creating example_6_colors_and_fonts.pdf");
    create_pdf_with_text(
        "example_6_colors_and_fonts.pdf",
        "Original (Helvetica Black)",
        50.0,
        250.0,
        14.0
    )?;

    let mut doc = Document::load("example_6_colors_and_fonts.pdf")?;

    add_text_with_style(
        &mut doc,
        0,
        "Red Text in Helvetica-Bold",
        Position { x: 50.0, y: 220.0 },
        "Helvetica-Bold",
        16.0,
        Color::RED,
    )?;

    add_text_with_style(
        &mut doc,
        0,
        "Blue Text in Times-Italic",
        Position { x: 50.0, y: 190.0 },
        "Times-Italic",
        14.0,
        Color::BLUE,
    )?;

    add_text_with_style(
        &mut doc,
        0,
        "Green Text in Courier-Bold",
        Position { x: 50.0, y: 160.0 },
        "Courier-Bold",
        12.0,
        Color::GREEN,
    )?;

    add_text_with_style(
        &mut doc,
        0,
        "Custom Purple (128, 0, 128) in Times-Roman",
        Position { x: 50.0, y: 130.0 },
        "Times-Roman",
        12.0,
        Color { r: 128, g: 0, b: 128 },
    )?;

    doc.save("example_6_colors_and_fonts.pdf")?;
    println!("   ✅ Created with colored text and various fonts\n");

    // Example 7: Images (NEW!)
    println!("📄 Creating example_7_images.pdf");
    create_pdf_with_text(
        "example_7_images.pdf",
        "PDF with Images",
        50.0,
        550.0,
        20.0
    )?;

    let mut doc = Document::load("example_7_images.pdf")?;

    // Add JPEG image (fox)
    let jpeg_data = std::fs::read("examples/fox.jpg")?;
    add_image_to_pdf(
        &mut doc,
        0,
        &jpeg_data,
        ImageFormat::Jpeg,
        Position { x: 50.0, y: 300.0 },
        200.0,
        200.0,
    )?;

    add_text_with_style(
        &mut doc,
        0,
        "JPEG Image (Fox)",
        Position { x: 50.0, y: 280.0 },
        "Helvetica",
        10.0,
        Color::BLACK,
    )?;

    // Add small PNG next to it
    let png_data = create_test_png();
    add_image_to_pdf(
        &mut doc,
        0,
        &png_data,
        ImageFormat::Png,
        Position { x: 300.0, y: 450.0 },
        50.0,
        50.0,
    )?;

    add_text_with_style(
        &mut doc,
        0,
        "PNG (Red Pixel)",
        Position { x: 300.0, y: 430.0 },
        "Helvetica",
        10.0,
        Color::BLACK,
    )?;

    doc.save("example_7_images.pdf")?;
    println!("   ✅ Created with JPEG and PNG images\n");

    // Example 8: Batch annotations using JSON-serializable structs (NEW!)
    println!("📄 Creating example_8_batch_annotations.pdf");
    create_pdf_with_text(
        "example_8_batch_annotations.pdf",
        "Original Content",
        50.0,
        550.0,
        14.0
    )?;

    let annotations = vec![
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 500.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Title: Annotation System Demo".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 20.0,
                color: Color { r: 0, g: 51, b: 102 }, // Dark blue
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 470.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Subtitle: Applied in a single batch operation".to_string(),
                font_family: "Times-Italic".to_string(),
                font_size: 14.0,
                color: Color { r: 102, g: 102, b: 102 }, // Gray
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 250.0 },
            content: AnnotationType::Image(ImageAnnotation {
                image_data: jpeg_data.clone(),
                format: ImageFormat::Jpeg,
                width: 150.0,
                height: 150.0,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 230.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Image added via annotation system".to_string(),
                font_family: "Courier".to_string(),
                font_size: 10.0,
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 200.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "✓ All annotations applied in one operation".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 12.0,
                color: Color::GREEN,
            }),
        },
    ];

    apply_annotations_to_file(
        "example_8_batch_annotations.pdf",
        "example_8_batch_annotations.pdf",
        &annotations,
    )?;
    println!("   ✅ Created with batch annotations (text + images)\n");

    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("🎉 All test PDFs generated successfully!");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    println!("📂 Generated files:");
    println!("   1. example_1_simple.pdf              - Single text");
    println!("   2. example_2_original.pdf            - Original (before modification)");
    println!("   3. example_2_modified.pdf            - Modified (with added text)");
    println!("   4. example_3_font_sizes.pdf          - Multiple font sizes");
    println!("   5. example_4_positions.pdf           - Various positions");
    println!("   6. example_5_long_text.pdf           - Multiple lines with special chars");
    println!("   7. example_6_colors_and_fonts.pdf    - NEW: Colored text, various fonts");
    println!("   8. example_7_images.pdf              - NEW: JPEG and PNG images");
    println!("   9. example_8_batch_annotations.pdf   - NEW: Batch annotation system\n");

    println!("📝 What to check:");
    println!("   ✓ All PDFs should open without errors");
    println!("   ✓ Text should be readable and positioned correctly");
    println!("   ✓ Colors should be visible (red, blue, green, purple, etc.)");
    println!("   ✓ Different fonts should be distinguishable");
    println!("   ✓ Images should render correctly (JPEG and PNG)");
    println!("   ✓ Batch annotations should show mixed text and images");
    println!("   ✓ No corruption or rendering issues\n");

    Ok(())
}

/// Helper function to create a minimal test PNG (1x1 red pixel)
fn create_test_png() -> Vec<u8> {
    use ::image::{RgbImage, ImageFormat as ImgFmt, Rgb};
    use std::io::Cursor;

    let mut img = RgbImage::new(1, 1);
    img.put_pixel(0, 0, Rgb([255, 0, 0]));

    let mut buffer = Cursor::new(Vec::new());
    img.write_to(&mut buffer, ImgFmt::Png).expect("Failed to write PNG");
    buffer.into_inner()
}
