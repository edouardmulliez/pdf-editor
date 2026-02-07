use pdf_editor_temp_lib::pdf_ops::{create_pdf_with_text, add_text_to_pdf};

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

    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("🎉 All test PDFs generated successfully!");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    println!("📂 Generated files:");
    println!("   1. example_1_simple.pdf         - Single text");
    println!("   2. example_2_original.pdf       - Original (before modification)");
    println!("   3. example_2_modified.pdf       - Modified (with added text)");
    println!("   4. example_3_font_sizes.pdf     - Multiple font sizes");
    println!("   5. example_4_positions.pdf      - Various positions");
    println!("   6. example_5_long_text.pdf      - Multiple lines with special chars\n");

    println!("📝 What to check:");
    println!("   ✓ All PDFs should open without errors");
    println!("   ✓ Text should be readable and positioned correctly");
    println!("   ✓ example_2_modified.pdf should have both texts");
    println!("   ✓ Font sizes should be visibly different");
    println!("   ✓ No corruption or rendering issues\n");

    Ok(())
}
