use pdf_editor_temp_lib::pdf_ops::{
    apply_annotations_to_file, Annotation, AnnotationType, TextAnnotation, ImageAnnotation,
    Color, Position, ImageFormat, FontMetrics,
};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🎨 Generating annotated test PDFs...\n");

    // Create output directory if it doesn't exist
    std::fs::create_dir_all("examples/output")?;

    // Load input files
    let input_pdf = "examples/input/hercules.pdf";
    let jpeg_image = std::fs::read("examples/input/fox.jpg")?;
    let png_image = std::fs::read("examples/input/fox.png")?;

    // Example 1: Text with different fonts
    println!("📄 Creating 1_different_fonts.pdf");
    let annotations = vec![
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 750.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Helvetica (Regular)".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 720.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Helvetica-Bold".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 690.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Helvetica-Oblique".to_string(),
                font_family: "Helvetica-Oblique".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 660.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Times-Roman".to_string(),
                font_family: "Times-Roman".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 630.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Times-Bold".to_string(),
                font_family: "Times-Bold".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 600.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Times-Italic".to_string(),
                font_family: "Times-Italic".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 570.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Courier".to_string(),
                font_family: "Courier".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 540.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Courier-Bold".to_string(),
                font_family: "Courier-Bold".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
    ];
    apply_annotations_to_file(input_pdf, "examples/output/1_different_fonts.pdf", &annotations)?;
    println!("   ✅ Created with 8 different fonts\n");

    // Example 2: Text with different sizes
    println!("📄 Creating 2_different_sizes.pdf");
    let annotations = vec![
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 750.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Size 8pt - Small text".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 8.0,
                font_metrics: FontMetrics::from_font_size(8.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 720.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Size 12pt - Normal text".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 12.0,
                font_metrics: FontMetrics::from_font_size(12.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 680.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Size 16pt - Medium text".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 630.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Size 24pt - Large text".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 24.0,
                font_metrics: FontMetrics::from_font_size(24.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 560.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Size 36pt - Very Large".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 36.0,
                font_metrics: FontMetrics::from_font_size(36.0),
                color: Color::BLACK,
            }),
        },
    ];
    apply_annotations_to_file(input_pdf, "examples/output/2_different_sizes.pdf", &annotations)?;
    println!("   ✅ Created with 5 different font sizes\n");

    // Example 3: Text with different colors
    println!("📄 Creating 3_different_colors.pdf");
    let annotations = vec![
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 750.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Red Text (255, 0, 0)".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color::RED,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 710.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Green Text (0, 255, 0)".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color::GREEN,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 670.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Blue Text (0, 0, 255)".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color::BLUE,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 630.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Orange Text (255, 165, 0)".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color { r: 255, g: 165, b: 0 },
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 590.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Purple Text (128, 0, 128)".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color { r: 128, g: 0, b: 128 },
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 550.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Teal Text (0, 128, 128)".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color { r: 0, g: 128, b: 128 },
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 510.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Gray Text (128, 128, 128)".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 16.0,
                font_metrics: FontMetrics::from_font_size(16.0),
                color: Color { r: 128, g: 128, b: 128 },
            }),
        },
    ];
    apply_annotations_to_file(input_pdf, "examples/output/3_different_colors.pdf", &annotations)?;
    println!("   ✅ Created with 7 different colors\n");

    // Example 4: Images (JPEG and PNG)
    println!("📄 Creating 4_images.pdf");
    let annotations = vec![
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 750.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Image Annotations Demo".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 18.0,
                font_metrics: FontMetrics::from_font_size(18.0),
                color: Color { r: 0, g: 51, b: 102 },
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 500.0 },
            content: AnnotationType::Image(ImageAnnotation {
                image_data: jpeg_image.clone(),
                format: ImageFormat::Jpeg,
                width: 150.0,
                height: 150.0,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 470.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "JPEG Image (fox.jpg)".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 10.0,
                font_metrics: FontMetrics::from_font_size(10.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 250.0, y: 500.0 },
            content: AnnotationType::Image(ImageAnnotation {
                image_data: png_image.clone(),
                format: ImageFormat::Png,
                width: 150.0,
                height: 150.0,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 250.0, y: 470.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "PNG Image (fox.png)".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 10.0,
                font_metrics: FontMetrics::from_font_size(10.0),
                color: Color::BLACK,
            }),
        },
    ];
    apply_annotations_to_file(input_pdf, "examples/output/4_images.pdf", &annotations)?;
    println!("   ✅ Created with JPEG and PNG images\n");

    // Example 5: Mixed annotations (comprehensive demo)
    println!("📄 Creating 5_mixed_comprehensive.pdf");
    let annotations = vec![
        // Title
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 750.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Comprehensive Annotation Demo".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 20.0,
                font_metrics: FontMetrics::from_font_size(20.0),
                color: Color { r: 0, g: 51, b: 102 },
            }),
        },
        // Subtitle
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 720.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Demonstrating all annotation capabilities in a single PDF".to_string(),
                font_family: "Times-Italic".to_string(),
                font_size: 12.0,
                font_metrics: FontMetrics::from_font_size(12.0),
                color: Color { r: 102, g: 102, b: 102 },
            }),
        },
        // Section 1: Colors
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 680.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Colors:".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 70.0, y: 660.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Red • Green • Blue".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 12.0,
                font_metrics: FontMetrics::from_font_size(12.0),
                color: Color::RED,
            }),
        },
        // Section 2: Fonts
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 620.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Fonts:".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 70.0, y: 600.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Helvetica, Times, Courier".to_string(),
                font_family: "Times-Roman".to_string(),
                font_size: 12.0,
                font_metrics: FontMetrics::from_font_size(12.0),
                color: Color::BLACK,
            }),
        },
        // Section 3: Images
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 560.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Images:".to_string(),
                font_family: "Helvetica-Bold".to_string(),
                font_size: 14.0,
                font_metrics: FontMetrics::from_font_size(14.0),
                color: Color::BLACK,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 400.0 },
            content: AnnotationType::Image(ImageAnnotation {
                image_data: jpeg_image.clone(),
                format: ImageFormat::Jpeg,
                width: 120.0,
                height: 120.0,
            }),
        },
        Annotation {
            page: 0,
            position: Position { x: 200.0, y: 400.0 },
            content: AnnotationType::Image(ImageAnnotation {
                image_data: png_image.clone(),
                format: ImageFormat::Png,
                width: 120.0,
                height: 120.0,
            }),
        },
        // Footer
        Annotation {
            page: 0,
            position: Position { x: 50.0, y: 350.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "✓ All annotations applied in a single batch operation".to_string(),
                font_family: "Courier".to_string(),
                font_size: 10.0,
                font_metrics: FontMetrics::from_font_size(10.0),
                color: Color::GREEN,
            }),
        },
    ];
    apply_annotations_to_file(input_pdf, "examples/output/5_mixed_comprehensive.pdf", &annotations)?;
    println!("   ✅ Created comprehensive demo with mixed annotations\n");

    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("🎉 All annotated PDFs generated successfully!");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    println!("📂 Input:");
    println!("   • examples/input/hercules.pdf (source PDF)");
    println!("   • examples/input/fox.jpg (JPEG image)");
    println!("   • examples/input/fox.png (PNG image)\n");

    println!("📂 Generated outputs in examples/output/:");
    println!("   1. 1_different_fonts.pdf       - 8 different fonts (Helvetica, Times, Courier families)");
    println!("   2. 2_different_sizes.pdf       - 5 font sizes from 8pt to 36pt");
    println!("   3. 3_different_colors.pdf      - 7 colors (red, green, blue, orange, purple, teal, gray)");
    println!("   4. 4_images.pdf                - JPEG and PNG image annotations");
    println!("   5. 5_mixed_comprehensive.pdf   - Complete demo with text (fonts/sizes/colors) and images\n");

    println!("📝 What to check:");
    println!("   ✓ All PDFs should open without errors in Preview/Acrobat/Chrome");
    println!("   ✓ Original PDF content should be preserved");
    println!("   ✓ Text annotations should show correct fonts, sizes, and colors");
    println!("   ✓ Images should render at correct positions and sizes");
    println!("   ✓ No corruption or rendering issues\n");

    Ok(())
}
