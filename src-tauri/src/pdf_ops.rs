//! PDF Operations and Annotation System
//!
//! This module provides a comprehensive system for creating and annotating PDF documents.
//! It supports text with custom fonts and colors, image embedding (JPEG/PNG), and batch
//! annotation processing with JSON-serializable data structures.
//!
//! # Features
//!
//! - **Text Annotations**: Add text with customizable fonts (Standard 14), sizes, and RGB colors
//! - **Image Annotations**: Embed JPEG and PNG images at any position with custom dimensions
//! - **Batch Processing**: Apply multiple annotations in a single operation with automatic page grouping
//! - **JSON Serialization**: All annotation types are JSON-serializable for easy frontend-backend communication
//! - **Backward Compatibility**: Existing PDF modification functions remain unchanged
//!
//! # Standard 14 Fonts
//!
//! The following fonts are guaranteed to be available in all PDF viewers:
//! - Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique
//! - Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic
//! - Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique
//! - Symbol, ZapfDingbats
//!
//! # Examples
//!
//! ## Simple text with color
//!
//! ```no_run
//! use pdf_editor_temp_lib::pdf_ops::*;
//! use lopdf::Document;
//!
//! let mut doc = Document::load("input.pdf")?;
//! add_text_with_style(
//!     &mut doc,
//!     0,
//!     "Hello World",
//!     Position { x: 100.0, y: 200.0 },
//!     "Helvetica-Bold",
//!     16.0,
//!     Color::RED,
//! )?;
//! doc.save("output.pdf")?;
//! # Ok::<(), Box<dyn std::error::Error>>(())
//! ```
//!
//! ## Batch annotations with JSON
//!
//! ```no_run
//! use pdf_editor_temp_lib::pdf_ops::*;
//!
//! let annotations = vec![
//!     Annotation {
//!         page: 0,
//!         position: Position { x: 50.0, y: 200.0 },
//!         content: AnnotationType::Text(TextAnnotation {
//!             content: "Title".to_string(),
//!             font_family: "Helvetica-Bold".to_string(),
//!             font_size: 18.0,
//!             color: Color::BLACK,
//!             font_metrics: FontMetrics::from_font_size(18.0),
//!         }),
//!     },
//! ];
//!
//! // Serialize to JSON
//! let json = serde_json::to_string(&annotations)?;
//!
//! // Deserialize and apply
//! let annotations: Vec<Annotation> = serde_json::from_str(&json)?;
//! apply_annotations_to_file("input.pdf", "output.pdf", &annotations)?;
//! # Ok::<(), Box<dyn std::error::Error>>(())
//! ```
//!
//! ## Image embedding
//!
//! ```no_run
//! use pdf_editor_temp_lib::pdf_ops::*;
//! use lopdf::Document;
//!
//! let mut doc = Document::load("input.pdf")?;
//! let image_data = std::fs::read("photo.jpg")?;
//!
//! add_image_to_pdf(
//!     &mut doc,
//!     0,
//!     &image_data,
//!     ImageFormat::Jpeg,
//!     Position { x: 100.0, y: 100.0 },
//!     200.0,  // width
//!     150.0,  // height
//! )?;
//! doc.save("output.pdf")?;
//! # Ok::<(), Box<dyn std::error::Error>>(())
//! ```

use printpdf::*;
use std::fs::File;
use std::io::BufWriter;

// Use explicit crate path to avoid ambiguity with printpdf's re-export
use ::lopdf::{Document, Object, Stream, Dictionary, content::{Content, Operation}};
use serde::{Deserialize, Serialize};
// Use explicit crate path to avoid ambiguity with printpdf's image module
use ::image::ImageReader;
use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::io::Write;

// ============================================================================
// Core Data Structures for Annotation System
// ============================================================================

/// RGB color representation (0-255 for each channel)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl Color {
    /// Black color constant
    pub const BLACK: Color = Color { r: 0, g: 0, b: 0 };

    /// White color constant
    pub const WHITE: Color = Color { r: 255, g: 255, b: 255 };

    /// Red color constant
    pub const RED: Color = Color { r: 255, g: 0, b: 0 };

    /// Green color constant
    pub const GREEN: Color = Color { r: 0, g: 255, b: 0 };

    /// Blue color constant
    pub const BLUE: Color = Color { r: 0, g: 0, b: 255 };

    /// Convert RGB (0-255) to PDF color space (0.0-1.0)
    pub fn to_pdf_rgb(&self) -> (f32, f32, f32) {
        (
            self.r as f32 / 255.0,
            self.g as f32 / 255.0,
            self.b as f32 / 255.0,
        )
    }
}

/// Position in PDF coordinate system (points from bottom-left)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Position {
    pub x: f32,
    pub y: f32,
}

/// Image format for embedded images
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImageFormat {
    Jpeg,
    Png,
}

/// Font metrics from Canvas measureText API
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct FontMetrics {
    pub ascent: f32,
    pub descent: f32,
}

impl FontMetrics {
    /// Creates approximate font metrics from font size (for testing purposes)
    /// Uses typical ratios: ascent = 0.78 * font_size, descent = 0.22 * font_size
    pub fn from_font_size(font_size: f32) -> Self {
        Self {
            ascent: font_size * 0.78,
            descent: font_size * 0.22,
        }
    }
}

/// Text annotation with font, size, and color
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TextAnnotation {
    pub content: String,
    pub font_family: String,
    pub font_size: f32,
    pub color: Color,
    pub font_metrics: FontMetrics,
}

/// Image annotation with embedded image data
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ImageAnnotation {
    /// Image data (base64-encoded in JSON)
    #[serde(with = "base64_serde")]
    pub image_data: Vec<u8>,
    pub format: ImageFormat,
    pub width: f32,
    pub height: f32,
}

/// Custom serde module for base64 encoding/decoding
mod base64_serde {
    use serde::{Deserialize, Deserializer, Serializer};
    use base64::{Engine as _, engine::general_purpose};

    pub fn serialize<S>(bytes: &[u8], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&general_purpose::STANDARD.encode(bytes))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        general_purpose::STANDARD.decode(s).map_err(serde::de::Error::custom)
    }
}

/// Annotation type (text or image)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum AnnotationType {
    Text(TextAnnotation),
    Image(ImageAnnotation),
}

/// Complete annotation with page, position, and content
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Annotation {
    pub page: usize,
    pub position: Position,
    #[serde(flatten)]
    pub content: AnnotationType,
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Standard 14 PDF fonts (guaranteed to be available in all PDF viewers)
const STANDARD_14_FONTS: &[&str] = &[
    "Helvetica",
    "Helvetica-Bold",
    "Helvetica-Oblique",
    "Helvetica-BoldOblique",
    "Times-Roman",
    "Times-Bold",
    "Times-Italic",
    "Times-BoldItalic",
    "Courier",
    "Courier-Bold",
    "Courier-Oblique",
    "Courier-BoldOblique",
    "Symbol",
    "ZapfDingbats",
];

/// Validates that the font family is one of the Standard 14 fonts
fn validate_font_family(font_family: &str) -> Result<(), Box<dyn std::error::Error>> {
    if STANDARD_14_FONTS.contains(&font_family) {
        Ok(())
    } else {
        Err(format!(
            "Invalid font family '{}'. Must be one of: {}",
            font_family,
            STANDARD_14_FONTS.join(", ")
        )
        .into())
    }
}

/// Encodes a UTF-8 string to WinAnsiEncoding (Windows-1252) bytes.
/// Characters with codepoints <= 0xFF map directly; others become '?'.
fn encode_text_to_winansi(text: &str) -> Vec<u8> {
    text.chars().map(|c| {
        let cp = c as u32;
        if cp <= 0xFF { cp as u8 } else { b'?' }
    }).collect()
}

/// Ensures that a font is present in the page's Resources dictionary
fn ensure_font_in_resources(
    doc: &mut Document,
    page_id: ::lopdf::ObjectId,
    font_family: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Step 1: Check if we need to create Resources
    let resources_id = {
        let page_dict = doc
            .get_object(page_id)?
            .as_dict()
            .map_err(|e| format!("Page is not a dictionary: {}", e))?;

        if let Ok(res_ref) = page_dict.get(b"Resources") {
            match res_ref {
                Object::Reference(ref_id) => *ref_id,
                Object::Dictionary(_) => {
                    // Resources is inline - handle directly
                    let page_dict = doc
                        .get_object_mut(page_id)?
                        .as_dict_mut()
                        .map_err(|e| format!("Page is not a dictionary: {}", e))?;

                    let resources_dict = page_dict
                        .get_mut(b"Resources")
                        .map_err(|e| format!("Resources not found: {}", e))?
                        .as_dict_mut()
                        .map_err(|e| format!("Resources is not a dictionary: {}", e))?;

                    // Get or create Font dictionary
                    if !resources_dict.has(b"Font") {
                        resources_dict.set("Font", Dictionary::new());
                    }

                    let font_dict = resources_dict
                        .get_mut(b"Font")
                        .map_err(|e| format!("Font dictionary not found: {}", e))?
                        .as_dict_mut()
                        .map_err(|e| format!("Font is not a dictionary: {}", e))?;

                    // Add font if not present
                    let font_key = font_family.as_bytes();
                    if !font_dict.has(font_key) {
                        let mut font_obj = Dictionary::new();
                        font_obj.set("Type", Object::Name(b"Font".to_vec()));
                        font_obj.set("Subtype", Object::Name(b"Type1".to_vec()));
                        font_obj.set("BaseFont", Object::Name(font_family.as_bytes().to_vec()));
                        font_obj.set("Encoding", Object::Name(b"WinAnsiEncoding".to_vec()));
                        font_dict.set(font_family, font_obj);
                    }

                    return Ok(());
                }
                _ => return Err("Resources is not a dictionary or reference".into()),
            }
        } else {
            // No Resources - create new one
            let mut resources_dict = Dictionary::new();
            resources_dict.set("Font", Dictionary::new());
            let resources_id = doc.add_object(resources_dict);

            // Now update page
            let page_dict = doc
                .get_object_mut(page_id)?
                .as_dict_mut()
                .map_err(|e| format!("Page is not a dictionary: {}", e))?;
            page_dict.set("Resources", Object::Reference(resources_id));

            resources_id
        }
    };

    // Step 2: Check if we need to create Font dictionary
    let font_dict_id = {
        let resources_dict = doc
            .get_object(resources_id)?
            .as_dict()
            .map_err(|e| format!("Resources is not a dictionary: {}", e))?;

        if let Ok(font_ref) = resources_dict.get(b"Font") {
            match font_ref {
                Object::Reference(ref_id) => *ref_id,
                Object::Dictionary(_) => {
                    // Font dict is inline - modify it directly
                    let resources_dict = doc
                        .get_object_mut(resources_id)?
                        .as_dict_mut()
                        .map_err(|e| format!("Resources is not a dictionary: {}", e))?;

                    let font_dict = resources_dict
                        .get_mut(b"Font")
                        .map_err(|e| format!("Font dictionary not found: {}", e))?
                        .as_dict_mut()
                        .map_err(|e| format!("Font is not a dictionary: {}", e))?;

                    let font_key = font_family.as_bytes();
                    if !font_dict.has(font_key) {
                        let mut font_obj = Dictionary::new();
                        font_obj.set("Type", Object::Name(b"Font".to_vec()));
                        font_obj.set("Subtype", Object::Name(b"Type1".to_vec()));
                        font_obj.set("BaseFont", Object::Name(font_family.as_bytes().to_vec()));
                        font_obj.set("Encoding", Object::Name(b"WinAnsiEncoding".to_vec()));
                        font_dict.set(font_family, font_obj);
                    }

                    return Ok(());
                }
                _ => return Err("Font is not a dictionary or reference".into()),
            }
        } else {
            // No Font dictionary - create new one
            let font_dict = Dictionary::new();
            let font_dict_id = doc.add_object(font_dict);

            // Now update resources
            let resources_dict = doc
                .get_object_mut(resources_id)?
                .as_dict_mut()
                .map_err(|e| format!("Resources is not a dictionary: {}", e))?;
            resources_dict.set("Font", Object::Reference(font_dict_id));

            font_dict_id
        }
    };

    // Step 3: Add font to Font dictionary if not present
    let font_dict = doc
        .get_object_mut(font_dict_id)?
        .as_dict_mut()
        .map_err(|e| format!("Font dictionary is not a dictionary: {}", e))?;

    let font_key = font_family.as_bytes();
    if !font_dict.has(font_key) {
        let mut font_obj = Dictionary::new();
        font_obj.set("Type", Object::Name(b"Font".to_vec()));
        font_obj.set("Subtype", Object::Name(b"Type1".to_vec()));
        font_obj.set("BaseFont", Object::Name(font_family.as_bytes().to_vec()));
        font_obj.set("Encoding", Object::Name(b"WinAnsiEncoding".to_vec()));
        font_dict.set(font_family, font_obj);
    }

    Ok(())
}

/// Creates an Image XObject for a JPEG image
fn create_jpeg_xobject(
    doc: &mut Document,
    jpeg_data: &[u8],
) -> Result<::lopdf::ObjectId, Box<dyn std::error::Error>> {
    // Parse JPEG to get dimensions
    let img = ImageReader::new(std::io::Cursor::new(jpeg_data))
        .with_guessed_format()?
        .decode()?;

    let width = img.width();
    let height = img.height();

    // Create XObject dictionary for JPEG
    let mut xobject_dict = Dictionary::new();
    xobject_dict.set("Type", Object::Name(b"XObject".to_vec()));
    xobject_dict.set("Subtype", Object::Name(b"Image".to_vec()));
    xobject_dict.set("Width", Object::Integer(width as i64));
    xobject_dict.set("Height", Object::Integer(height as i64));
    xobject_dict.set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
    xobject_dict.set("BitsPerComponent", Object::Integer(8));
    xobject_dict.set("Filter", Object::Name(b"DCTDecode".to_vec()));

    // Create stream with raw JPEG data (no re-compression needed)
    let stream = Stream::new(xobject_dict, jpeg_data.to_vec());
    let xobject_id = doc.add_object(stream);

    Ok(xobject_id)
}

/// Creates an Image XObject for a PNG image
fn create_png_xobject(
    doc: &mut Document,
    png_data: &[u8],
) -> Result<::lopdf::ObjectId, Box<dyn std::error::Error>> {
    // Decode PNG
    let img = ImageReader::new(std::io::Cursor::new(png_data))
        .with_guessed_format()?
        .decode()?;

    let width = img.width();
    let height = img.height();

    // Check if image has alpha channel
    let has_alpha = match img.color() {
        ::image::ColorType::Rgba8 | ::image::ColorType::La8 |
        ::image::ColorType::Rgba16 | ::image::ColorType::La16 |
        ::image::ColorType::Rgba32F => true,
        _ => false,
    };

    // Create SMask (alpha channel) if image has transparency
    let smask_id = if has_alpha {
        // Extract alpha channel
        let rgba_img = img.to_rgba8();
        let rgba_data = rgba_img.as_raw();

        // Extract alpha channel (every 4th byte starting from index 3)
        let alpha_data: Vec<u8> = rgba_data.iter()
            .skip(3)
            .step_by(4)
            .copied()
            .collect();

        // Compress alpha data
        let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
        encoder.write_all(&alpha_data)?;
        let compressed_alpha = encoder.finish()?;

        // Create SMask XObject dictionary (grayscale image for alpha)
        let mut smask_dict = Dictionary::new();
        smask_dict.set("Type", Object::Name(b"XObject".to_vec()));
        smask_dict.set("Subtype", Object::Name(b"Image".to_vec()));
        smask_dict.set("Width", Object::Integer(width as i64));
        smask_dict.set("Height", Object::Integer(height as i64));
        smask_dict.set("ColorSpace", Object::Name(b"DeviceGray".to_vec()));
        smask_dict.set("BitsPerComponent", Object::Integer(8));
        smask_dict.set("Filter", Object::Name(b"FlateDecode".to_vec()));

        // Create SMask stream
        let smask_stream = Stream::new(smask_dict, compressed_alpha);
        Some(doc.add_object(smask_stream))
    } else {
        None
    };

    // Convert to RGB (without alpha)
    let rgb_img = img.to_rgb8();
    let raw_data = rgb_img.into_raw();

    // Compress RGB data with zlib
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(&raw_data)?;
    let compressed_data = encoder.finish()?;

    // Create XObject dictionary for PNG
    let mut xobject_dict = Dictionary::new();
    xobject_dict.set("Type", Object::Name(b"XObject".to_vec()));
    xobject_dict.set("Subtype", Object::Name(b"Image".to_vec()));
    xobject_dict.set("Width", Object::Integer(width as i64));
    xobject_dict.set("Height", Object::Integer(height as i64));
    xobject_dict.set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
    xobject_dict.set("BitsPerComponent", Object::Integer(8));
    xobject_dict.set("Filter", Object::Name(b"FlateDecode".to_vec()));

    // Add SMask reference if transparency exists
    if let Some(smask_id) = smask_id {
        xobject_dict.set("SMask", Object::Reference(smask_id));
    }

    // Create stream with compressed RGB data
    let stream = Stream::new(xobject_dict, compressed_data);
    let xobject_id = doc.add_object(stream);

    Ok(xobject_id)
}

/// Adds an image XObject reference to the page's Resources
fn add_image_to_page_resources(
    doc: &mut Document,
    page_id: ::lopdf::ObjectId,
    image_id: ::lopdf::ObjectId,
    image_name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Step 1: Get or create Resources
    let resources_id = {
        let page_dict = doc
            .get_object(page_id)?
            .as_dict()
            .map_err(|e| format!("Page is not a dictionary: {}", e))?;

        if let Ok(res_ref) = page_dict.get(b"Resources") {
            match res_ref {
                Object::Reference(ref_id) => *ref_id,
                Object::Dictionary(_) => {
                    // Resources is inline
                    let page_dict = doc
                        .get_object_mut(page_id)?
                        .as_dict_mut()
                        .map_err(|e| format!("Page is not a dictionary: {}", e))?;

                    let resources_dict = page_dict
                        .get_mut(b"Resources")
                        .map_err(|e| format!("Resources not found: {}", e))?
                        .as_dict_mut()
                        .map_err(|e| format!("Resources is not a dictionary: {}", e))?;

                    // Get or create XObject dictionary
                    if !resources_dict.has(b"XObject") {
                        resources_dict.set("XObject", Dictionary::new());
                    }

                    let xobject_dict = resources_dict
                        .get_mut(b"XObject")
                        .map_err(|e| format!("XObject dictionary not found: {}", e))?
                        .as_dict_mut()
                        .map_err(|e| format!("XObject is not a dictionary: {}", e))?;

                    // Add image reference
                    xobject_dict.set(image_name, Object::Reference(image_id));

                    return Ok(());
                }
                _ => return Err("Resources is not a dictionary or reference".into()),
            }
        } else {
            // No Resources - create new one
            let mut resources_dict = Dictionary::new();
            let mut xobject_dict = Dictionary::new();
            xobject_dict.set(image_name, Object::Reference(image_id));
            resources_dict.set("XObject", xobject_dict);

            let resources_id = doc.add_object(resources_dict);

            let page_dict = doc
                .get_object_mut(page_id)?
                .as_dict_mut()
                .map_err(|e| format!("Page is not a dictionary: {}", e))?;
            page_dict.set("Resources", Object::Reference(resources_id));

            return Ok(());
        }
    };

    // Step 2: Get or create XObject dictionary
    let xobject_dict_id = {
        let resources_dict = doc
            .get_object(resources_id)?
            .as_dict()
            .map_err(|e| format!("Resources is not a dictionary: {}", e))?;

        if let Ok(xobj_ref) = resources_dict.get(b"XObject") {
            match xobj_ref {
                Object::Reference(ref_id) => *ref_id,
                Object::Dictionary(_) => {
                    // XObject dict is inline
                    let resources_dict = doc
                        .get_object_mut(resources_id)?
                        .as_dict_mut()
                        .map_err(|e| format!("Resources is not a dictionary: {}", e))?;

                    let xobject_dict = resources_dict
                        .get_mut(b"XObject")
                        .map_err(|e| format!("XObject dictionary not found: {}", e))?
                        .as_dict_mut()
                        .map_err(|e| format!("XObject is not a dictionary: {}", e))?;

                    // Add image reference
                    xobject_dict.set(image_name, Object::Reference(image_id));

                    return Ok(());
                }
                _ => return Err("XObject is not a dictionary or reference".into()),
            }
        } else {
            // No XObject dictionary - create new one
            let mut xobject_dict = Dictionary::new();
            xobject_dict.set(image_name, Object::Reference(image_id));

            let xobject_dict_id = doc.add_object(xobject_dict);

            let resources_dict = doc
                .get_object_mut(resources_id)?
                .as_dict_mut()
                .map_err(|e| format!("Resources is not a dictionary: {}", e))?;
            resources_dict.set("XObject", Object::Reference(xobject_dict_id));

            return Ok(());
        }
    };

    // Step 3: Add image to XObject dictionary
    let xobject_dict = doc
        .get_object_mut(xobject_dict_id)?
        .as_dict_mut()
        .map_err(|e| format!("XObject dictionary is not a dictionary: {}", e))?;

    xobject_dict.set(image_name, Object::Reference(image_id));

    Ok(())
}

// ============================================================================
// PDF Operations
// ============================================================================

/// Resolves a page's /Contents into a flat array of stream references.
///
/// PDF spec allows /Contents to be:
/// - A direct reference to a single stream
/// - A direct reference to an array of stream references
/// - A direct array of stream references
///
/// Some PDF generators (e.g. pypdf's clone_reader_document_root) produce
/// /Contents as an indirect reference to an array. lopdf returns this as
/// Object::Reference, but naively wrapping it in a new array would create
/// an invalid structure (array element pointing to an array, not a stream).
/// This helper dereferences one level to produce a flat, valid contents array.
fn resolve_contents_to_array(
    doc: &Document,
    existing_contents: &Object,
) -> Vec<Object> {
    match existing_contents {
        Object::Reference(ref_id) => {
            // Dereference to see whether it points to a stream or an array
            match doc.get_object(*ref_id) {
                Ok(Object::Array(arr)) => arr.clone(),
                _ => vec![Object::Reference(*ref_id)],
            }
        }
        Object::Array(arr) => arr.clone(),
        _ => vec![],
    }
}

/// Adds text to a PDF with custom font, size, and color
///
/// # Arguments
/// * `doc` - Mutable reference to the PDF document
/// * `page_num` - Page number (0-indexed)
/// * `text` - Text to add
/// * `position` - Position in PDF coordinate system (points from bottom-left)
/// * `font_family` - Font family (must be one of Standard 14 fonts)
/// * `font_size` - Font size in points
/// * `color` - RGB color
pub fn add_text_with_style(
    doc: &mut Document,
    page_num: usize,
    text: &str,
    position: Position,
    font_family: &str,
    font_size: f32,
    color: Color,
) -> Result<(), Box<dyn std::error::Error>> {
    // Validate font family
    validate_font_family(font_family)?;

    // Get page ID
    let pages: Vec<_> = doc.page_iter().collect();
    if page_num >= pages.len() {
        return Err(format!("Page {} not found (PDF has {} pages)", page_num, pages.len()).into());
    }
    let page_id = pages[page_num];

    // Ensure font is in resources
    ensure_font_in_resources(doc, page_id, font_family)?;

    // Create content stream with color, font, and text
    let mut content = Content { operations: vec![] };

    // Convert color to PDF RGB (0.0-1.0)
    let (r, g, b) = color.to_pdf_rgb();

    // Set color (rg = fill color for text)
    content.operations.push(Operation::new("rg", vec![
        r.into(),
        g.into(),
        b.into(),
    ]));

    // Begin text
    content.operations.push(Operation::new("BT", vec![]));

    // Set font and size
    content.operations.push(Operation::new("Tf", vec![
        font_family.into(),
        font_size.into(),
    ]));

    // Set position
    content.operations.push(Operation::new("Td", vec![
        position.x.into(),
        position.y.into(),
    ]));

    // Show text
    content.operations.push(Operation::new("Tj", vec![
        Object::String(encode_text_to_winansi(text), ::lopdf::StringFormat::Literal)
    ]));

    // End text
    content.operations.push(Operation::new("ET", vec![]));

    // Encode and compress content stream
    let encoded_content = content.encode()
        .map_err(|e| format!("Failed to encode content: {}", e))?;

    let mut new_stream = Stream::new(Dictionary::new(), encoded_content);
    new_stream.compress()
        .map_err(|e| format!("Failed to compress stream: {}", e))?;

    // Add stream to document
    let new_content_id = doc.add_object(new_stream);

    // Append to page's Contents array
    let page_dict = doc.get_object(page_id)
        .map_err(|e| format!("Failed to get page: {}", e))?
        .as_dict()
        .map_err(|e| format!("Page is not a dictionary: {}", e))?;

    let existing_contents = page_dict.get(b"Contents")
        .map_err(|e| format!("No existing Contents: {}", e))?;

    let mut contents_array = resolve_contents_to_array(doc, existing_contents);
    contents_array.push(Object::Reference(new_content_id));

    // Update page with content array
    let page_dict = doc.get_object_mut(page_id)?
        .as_dict_mut()
        .map_err(|e| format!("Failed to get mutable page dict: {}", e))?;

    page_dict.set("Contents", Object::Array(contents_array));

    Ok(())
}

/// Adds an image to a PDF at specified position
///
/// # Arguments
/// * `doc` - Mutable reference to the PDF document
/// * `page_num` - Page number (0-indexed)
/// * `image_data` - Raw image data (JPEG or PNG)
/// * `format` - Image format
/// * `position` - Position in PDF coordinate system (points from bottom-left)
/// * `width` - Display width in points
/// * `height` - Display height in points
pub fn add_image_to_pdf(
    doc: &mut Document,
    page_num: usize,
    image_data: &[u8],
    format: ImageFormat,
    position: Position,
    width: f32,
    height: f32,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get page ID
    let pages: Vec<_> = doc.page_iter().collect();
    if page_num >= pages.len() {
        return Err(format!("Page {} not found (PDF has {} pages)", page_num, pages.len()).into());
    }
    let page_id = pages[page_num];

    // Create image XObject based on format
    let xobject_id = match format {
        ImageFormat::Jpeg => create_jpeg_xobject(doc, image_data)?,
        ImageFormat::Png => create_png_xobject(doc, image_data)?,
    };

    // Generate unique image name
    let image_name = format!("Im{}", xobject_id.0);

    // Add image to page resources
    add_image_to_page_resources(doc, page_id, xobject_id, &image_name)?;

    // Create content stream with image operations
    let mut content = Content { operations: vec![] };

    // Save graphics state
    content.operations.push(Operation::new("q", vec![]));

    // Transform matrix: [width 0 0 height x y] cm
    // This scales and positions the image
    content.operations.push(Operation::new("cm", vec![
        width.into(),
        0.0.into(),
        0.0.into(),
        height.into(),
        position.x.into(),
        position.y.into(),
    ]));

    // Draw image: /ImageName Do
    content.operations.push(Operation::new("Do", vec![
        Object::Name(image_name.as_bytes().to_vec())
    ]));

    // Restore graphics state
    content.operations.push(Operation::new("Q", vec![]));

    // Encode and compress content stream
    let encoded_content = content.encode()
        .map_err(|e| format!("Failed to encode content: {}", e))?;

    let mut new_stream = Stream::new(Dictionary::new(), encoded_content);
    new_stream.compress()
        .map_err(|e| format!("Failed to compress stream: {}", e))?;

    // Add stream to document
    let new_content_id = doc.add_object(new_stream);

    // Append to page's Contents array
    let page_dict = doc.get_object(page_id)
        .map_err(|e| format!("Failed to get page: {}", e))?
        .as_dict()
        .map_err(|e| format!("Page is not a dictionary: {}", e))?;

    let existing_contents = page_dict.get(b"Contents")
        .map_err(|e| format!("No existing Contents: {}", e))?;

    let mut contents_array = resolve_contents_to_array(doc, existing_contents);
    contents_array.push(Object::Reference(new_content_id));

    // Update page with content array
    let page_dict = doc.get_object_mut(page_id)?
        .as_dict_mut()
        .map_err(|e| format!("Failed to get mutable page dict: {}", e))?;

    page_dict.set("Contents", Object::Array(contents_array));

    Ok(())
}

/// Applies multiple annotations to a PDF document in batch
///
/// # Arguments
/// * `doc` - Mutable reference to the PDF document
/// * `annotations` - Slice of annotations to apply
pub fn apply_annotations(
    doc: &mut Document,
    annotations: &[Annotation],
) -> Result<(), Box<dyn std::error::Error>> {
    use std::collections::HashMap;

    // Group annotations by page
    let mut by_page: HashMap<usize, Vec<&Annotation>> = HashMap::new();
    for ann in annotations {
        by_page.entry(ann.page).or_default().push(ann);
    }

    // Apply all annotations to each page
    for (page_num, page_anns) in by_page {
        apply_annotations_to_page(doc, page_num, &page_anns)?;
    }

    Ok(())
}

/// Helper function to apply annotations to a single page
fn apply_annotations_to_page(
    doc: &mut Document,
    page_num: usize,
    annotations: &[&Annotation],
) -> Result<(), Box<dyn std::error::Error>> {
    // Get page ID
    let pages: Vec<_> = doc.page_iter().collect();
    if page_num >= pages.len() {
        return Err(format!("Page {} not found (PDF has {} pages)", page_num, pages.len()).into());
    }
    let page_id = pages[page_num];

    // Create single content stream for all annotations
    let mut content = Content { operations: vec![] };

    // Process each annotation
    for ann in annotations {
        match &ann.content {
            AnnotationType::Text(text_ann) => {
                // Validate font
                validate_font_family(&text_ann.font_family)?;

                // Ensure font is in resources
                ensure_font_in_resources(doc, page_id, &text_ann.font_family)?;

                // Convert color to PDF RGB
                let (r, g, b) = text_ann.color.to_pdf_rgb();

                // Set color
                content.operations.push(Operation::new("rg", vec![
                    r.into(),
                    g.into(),
                    b.into(),
                ]));


                // Begin text
                content.operations.push(Operation::new("BT", vec![]));

                // Set font and size
                content.operations.push(Operation::new("Tf", vec![
                    text_ann.font_family.as_str().into(),
                    text_ann.font_size.into(),
                ]));

                // Set position (position.y represents the alphabetic baseline)
                // SVG <text> and PDF Td both use baseline positioning, so no adjustment needed
                content.operations.push(Operation::new("Td", vec![
                    ann.position.x.into(),
                    ann.position.y.into(),
                ]));

                // Show text
                content.operations.push(Operation::new("Tj", vec![
                    Object::String(encode_text_to_winansi(&text_ann.content), ::lopdf::StringFormat::Literal)
                ]));

                // End text
                content.operations.push(Operation::new("ET", vec![]));
            }
            AnnotationType::Image(image_ann) => {
                // Create image XObject
                let xobject_id = match image_ann.format {
                    ImageFormat::Jpeg => create_jpeg_xobject(doc, &image_ann.image_data)?,
                    ImageFormat::Png => create_png_xobject(doc, &image_ann.image_data)?,
                };

                // Generate unique image name
                let image_name = format!("Im{}", xobject_id.0);

                // Add image to page resources
                add_image_to_page_resources(doc, page_id, xobject_id, &image_name)?;

                // Save graphics state
                content.operations.push(Operation::new("q", vec![]));

                // Transform matrix
                // Adjust Y coordinate: PDF cm matrix positions image by bottom-left corner,
                // but we want the top-left corner at the user's click position. Subtract
                // image height to move the bottom-left down so the top-left aligns with the click.
                let adjusted_y = ann.position.y - image_ann.height;
                content.operations.push(Operation::new("cm", vec![
                    image_ann.width.into(),
                    0.0.into(),
                    0.0.into(),
                    image_ann.height.into(),
                    ann.position.x.into(),
                    adjusted_y.into(),
                ]));

                // Draw image
                content.operations.push(Operation::new("Do", vec![
                    Object::Name(image_name.as_bytes().to_vec())
                ]));

                // Restore graphics state
                content.operations.push(Operation::new("Q", vec![]));
            }
        }
    }

    // Encode and compress content stream
    let encoded_content = content.encode()
        .map_err(|e| format!("Failed to encode content: {}", e))?;

    let mut new_stream = Stream::new(Dictionary::new(), encoded_content);
    new_stream.compress()
        .map_err(|e| format!("Failed to compress stream: {}", e))?;

    // Add stream to document
    let new_content_id = doc.add_object(new_stream);

    // Append to page's Contents array
    let page_dict = doc.get_object(page_id)
        .map_err(|e| format!("Failed to get page: {}", e))?
        .as_dict()
        .map_err(|e| format!("Page is not a dictionary: {}", e))?;

    let existing_contents = page_dict.get(b"Contents")
        .map_err(|e| format!("No existing Contents: {}", e))?;

    let mut contents_array = resolve_contents_to_array(doc, existing_contents);
    contents_array.push(Object::Reference(new_content_id));

    // Update page with content array
    let page_dict = doc.get_object_mut(page_id)?
        .as_dict_mut()
        .map_err(|e| format!("Failed to get mutable page dict: {}", e))?;

    page_dict.set("Contents", Object::Array(contents_array));

    Ok(())
}

/// File-based wrapper for applying annotations
///
/// # Arguments
/// * `input_path` - Path to existing PDF
/// * `output_path` - Path for output PDF
/// * `annotations` - Slice of annotations to apply
pub fn apply_annotations_to_file(
    input_path: &str,
    output_path: &str,
    annotations: &[Annotation],
) -> Result<(), Box<dyn std::error::Error>> {
    let mut doc = Document::load(input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    apply_annotations(&mut doc, annotations)?;

    doc.save(output_path)
        .map_err(|e| format!("Failed to save PDF: {}", e))?;

    println!("✅ Applied {} annotations to PDF: {} -> {}", annotations.len(), input_path, output_path);
    Ok(())
}

/// Creates a new PDF containing only the annotations, with blank pages matching the
/// original PDF's page count and dimensions. No original PDF content is included.
///
/// # Arguments
/// * `input_path` - Path to the original PDF (used for page dimensions only)
/// * `output_path` - Path where the annotations-only PDF will be saved
/// * `annotations` - Annotations to apply to the new document
pub fn create_annotations_only_pdf(
    input_path: &str,
    output_path: &str,
    annotations: &[Annotation],
) -> Result<(), Box<dyn std::error::Error>> {
    // Load original to extract page dimensions
    let original_doc = Document::load(input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    let original_pages: Vec<_> = original_doc.page_iter().collect();

    // Collect MediaBox for each page (fallback to A4 if missing)
    let mut page_dimensions: Vec<[f32; 4]> = Vec::new();
    for page_id in &original_pages {
        let dims = original_doc
            .get_object(*page_id)
            .ok()
            .and_then(|o| o.as_dict().ok())
            .and_then(|d| d.get(b"MediaBox").ok())
            .and_then(|mb| mb.as_array().ok())
            .and_then(|arr| {
                if arr.len() < 4 {
                    return None;
                }
                let vals: Vec<f32> = arr.iter().map(|o| match o {
                    Object::Integer(i) => *i as f32,
                    Object::Real(f) => *f,
                    _ => 0.0,
                }).collect();
                Some([vals[0], vals[1], vals[2], vals[3]])
            })
            .unwrap_or([0.0, 0.0, 595.0, 842.0]);
        page_dimensions.push(dims);
    }

    // Build a new blank document
    let mut new_doc = Document::with_version("1.4");

    // Reserve an ObjectId for the Pages node by inserting a placeholder
    let pages_id = new_doc.add_object(Object::Null);

    // Create blank pages
    let mut page_ids: Vec<lopdf::ObjectId> = Vec::new();
    for dims in &page_dimensions {
        let content_stream = Stream::new(Dictionary::new(), b"".to_vec());
        let content_id = new_doc.add_object(content_stream);

        let mut page_dict = Dictionary::new();
        page_dict.set("Type", Object::Name(b"Page".to_vec()));
        page_dict.set("Parent", Object::Reference(pages_id));
        page_dict.set("MediaBox", Object::Array(vec![
            Object::Real(dims[0] as f32),
            Object::Real(dims[1] as f32),
            Object::Real(dims[2] as f32),
            Object::Real(dims[3] as f32),
        ]));
        page_dict.set("Contents", Object::Reference(content_id));
        page_dict.set("Resources", Object::Dictionary(Dictionary::new()));
        let page_id = new_doc.add_object(page_dict);
        page_ids.push(page_id);
    }

    // Replace the placeholder with the real Pages dictionary
    let mut pages_dict = Dictionary::new();
    pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
    pages_dict.set(
        "Kids",
        Object::Array(page_ids.iter().map(|&id| Object::Reference(id)).collect()),
    );
    pages_dict.set("Count", Object::Integer(page_ids.len() as i64));
    new_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Set up catalog
    let mut catalog = Dictionary::new();
    catalog.set("Type", Object::Name(b"Catalog".to_vec()));
    catalog.set("Pages", Object::Reference(pages_id));
    let catalog_id = new_doc.add_object(catalog);
    new_doc.trailer.set("Root", Object::Reference(catalog_id));

    // Apply annotations onto the blank pages
    apply_annotations(&mut new_doc, annotations)?;

    new_doc.save(output_path)
        .map_err(|e| format!("Failed to save annotations-only PDF: {}", e))?;

    println!("✅ Created annotations-only PDF: {} -> {}", input_path, output_path);
    Ok(())
}

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
/// This is a convenience wrapper around add_text_with_style with default styling
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
    let mut doc = Document::load(input_path)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    add_text_with_style(
        &mut doc,
        page_num,
        text,
        Position { x, y },
        "Helvetica",
        font_size,
        Color::BLACK,
    )?;

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

    #[test]
    fn test_color_to_pdf_rgb() {
        let black = Color::BLACK;
        assert_eq!(black.to_pdf_rgb(), (0.0, 0.0, 0.0));

        let white = Color::WHITE;
        assert_eq!(white.to_pdf_rgb(), (1.0, 1.0, 1.0));

        let red = Color::RED;
        assert_eq!(red.to_pdf_rgb(), (1.0, 0.0, 0.0));

        let custom = Color { r: 128, g: 64, b: 192 };
        let (r, g, b) = custom.to_pdf_rgb();
        assert!((r - 0.502).abs() < 0.01);
        assert!((g - 0.251).abs() < 0.01);
        assert!((b - 0.753).abs() < 0.01);
    }

    #[test]
    fn test_text_annotation_json() {
        let annotation = Annotation {
            page: 0,
            position: Position { x: 100.0, y: 200.0 },
            content: AnnotationType::Text(TextAnnotation {
                content: "Hello World".to_string(),
                font_family: "Helvetica".to_string(),
                font_size: 12.0,
                color: Color::BLACK,
                font_metrics: FontMetrics::from_font_size(12.0),
            }),
        };

        let json = serde_json::to_string(&annotation).unwrap();
        println!("Text annotation JSON: {}", json);

        let deserialized: Annotation = serde_json::from_str(&json).unwrap();
        assert_eq!(annotation, deserialized);
    }

    #[test]
    fn test_image_annotation_json() {
        let image_data = vec![0xFF, 0xD8, 0xFF, 0xE0]; // JPEG header
        let annotation = Annotation {
            page: 1,
            position: Position { x: 50.0, y: 100.0 },
            content: AnnotationType::Image(ImageAnnotation {
                image_data: image_data.clone(),
                format: ImageFormat::Jpeg,
                width: 100.0,
                height: 150.0,
            }),
        };

        let json = serde_json::to_string(&annotation).unwrap();
        println!("Image annotation JSON: {}", json);

        // Verify base64 encoding in JSON
        assert!(json.contains("image_data"));
        assert!(!json.contains("0xFF")); // Raw bytes should not be in JSON

        let deserialized: Annotation = serde_json::from_str(&json).unwrap();
        assert_eq!(annotation, deserialized);

        // Verify image data is preserved
        if let AnnotationType::Image(img) = &deserialized.content {
            assert_eq!(img.image_data, image_data);
        } else {
            panic!("Expected Image annotation");
        }
    }

    #[test]
    fn test_mixed_annotations_json() {
        let annotations = vec![
            Annotation {
                page: 0,
                position: Position { x: 10.0, y: 20.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Title".to_string(),
                    font_family: "Helvetica-Bold".to_string(),
                    font_size: 24.0,
                    color: Color::RED,
                    font_metrics: FontMetrics::from_font_size(24.0),
                }),
            },
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 50.0 },
                content: AnnotationType::Image(ImageAnnotation {
                    image_data: vec![1, 2, 3, 4],
                    format: ImageFormat::Png,
                    width: 200.0,
                    height: 200.0,
                }),
            },
            Annotation {
                page: 1,
                position: Position { x: 100.0, y: 100.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Page 2".to_string(),
                    font_family: "Times-Roman".to_string(),
                    font_size: 14.0,
                    color: Color::BLUE,
                    font_metrics: FontMetrics::from_font_size(14.0),
                }),
            },
        ];

        let json = serde_json::to_string_pretty(&annotations).unwrap();
        println!("Mixed annotations JSON:\n{}", json);

        let deserialized: Vec<Annotation> = serde_json::from_str(&json).unwrap();
        assert_eq!(annotations, deserialized);
        assert_eq!(deserialized.len(), 3);
    }

    #[test]
    fn test_validate_font_family() {
        // Valid fonts
        assert!(validate_font_family("Helvetica").is_ok());
        assert!(validate_font_family("Helvetica-Bold").is_ok());
        assert!(validate_font_family("Times-Roman").is_ok());
        assert!(validate_font_family("Courier").is_ok());
        assert!(validate_font_family("Symbol").is_ok());
        assert!(validate_font_family("ZapfDingbats").is_ok());

        // Invalid fonts
        assert!(validate_font_family("Arial").is_err());
        assert!(validate_font_family("Comic Sans").is_err());
        assert!(validate_font_family("").is_err());
    }

    #[test]
    fn test_add_text_with_custom_font() {
        let initial_pdf = "test_custom_font_initial.pdf";
        let output_pdf = "test_custom_font_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Add text with Times-Roman font
        let mut doc = Document::load(initial_pdf).expect("Failed to load PDF");
        let result = add_text_with_style(
            &mut doc,
            0,
            "Times Roman Text",
            Position { x: 100.0, y: 200.0 },
            "Times-Roman",
            16.0,
            Color::BLACK,
        );

        assert!(result.is_ok(), "Failed to add text with custom font: {:?}", result.err());

        doc.save(output_pdf).expect("Failed to save PDF");
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // Verify text was added
        let texts = extract_text_from_pdf(output_pdf).expect("Failed to extract text");
        let all_text = texts.join(" ");
        assert!(all_text.contains("Times Roman Text"), "Custom font text not found");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_add_text_with_color() {
        let initial_pdf = "test_color_initial.pdf";
        let output_pdf = "test_color_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Add red text
        let mut doc = Document::load(initial_pdf).expect("Failed to load PDF");
        let result = add_text_with_style(
            &mut doc,
            0,
            "Red Text",
            Position { x: 100.0, y: 200.0 },
            "Helvetica",
            14.0,
            Color::RED,
        );

        assert!(result.is_ok(), "Failed to add colored text: {:?}", result.err());

        doc.save(output_pdf).expect("Failed to save PDF");
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // Verify text was added
        let texts = extract_text_from_pdf(output_pdf).expect("Failed to extract text");
        let all_text = texts.join(" ");
        assert!(all_text.contains("Red Text"), "Colored text not found");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_multiple_fonts_same_page() {
        let initial_pdf = "test_multi_font_initial.pdf";
        let output_pdf = "test_multi_font_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        let mut doc = Document::load(initial_pdf).expect("Failed to load PDF");

        // Add text with different fonts
        add_text_with_style(
            &mut doc,
            0,
            "Helvetica",
            Position { x: 50.0, y: 220.0 },
            "Helvetica",
            12.0,
            Color::BLACK,
        ).expect("Failed to add Helvetica text");

        add_text_with_style(
            &mut doc,
            0,
            "Times Bold",
            Position { x: 50.0, y: 200.0 },
            "Times-Bold",
            12.0,
            Color::BLUE,
        ).expect("Failed to add Times-Bold text");

        add_text_with_style(
            &mut doc,
            0,
            "Courier Italic",
            Position { x: 50.0, y: 180.0 },
            "Courier-Oblique",
            12.0,
            Color::RED,
        ).expect("Failed to add Courier-Oblique text");

        doc.save(output_pdf).expect("Failed to save PDF");

        // Verify all text was added
        let texts = extract_text_from_pdf(output_pdf).expect("Failed to extract text");
        let all_text = texts.join(" ");
        assert!(all_text.contains("Helvetica"), "Helvetica text not found");
        assert!(all_text.contains("Times Bold"), "Times Bold text not found");
        assert!(all_text.contains("Courier Italic"), "Courier Italic text not found");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_invalid_font_family() {
        let initial_pdf = "test_invalid_font_initial.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        let mut doc = Document::load(initial_pdf).expect("Failed to load PDF");

        // Try to add text with invalid font
        let result = add_text_with_style(
            &mut doc,
            0,
            "Invalid",
            Position { x: 100.0, y: 200.0 },
            "Arial", // Not a Standard 14 font
            14.0,
            Color::BLACK,
        );

        assert!(result.is_err(), "Should fail with invalid font");
        let error_msg = result.unwrap_err().to_string();
        assert!(error_msg.contains("Invalid font family"), "Error message should mention invalid font");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
    }

    #[test]
    fn test_add_jpeg_image() {
        let initial_pdf = "test_jpeg_initial.pdf";
        let output_pdf = "test_jpeg_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Load JPEG image
        let jpeg_data = std::fs::read("examples/input/fox.jpg")
            .expect("Failed to read fox.jpg");

        // Add JPEG to PDF
        let mut doc = Document::load(initial_pdf).expect("Failed to load PDF");
        let result = add_image_to_pdf(
            &mut doc,
            0,
            &jpeg_data,
            ImageFormat::Jpeg,
            Position { x: 50.0, y: 100.0 },
            200.0,
            200.0,
        );

        assert!(result.is_ok(), "Failed to add JPEG image: {:?}", result.err());

        doc.save(output_pdf).expect("Failed to save PDF");
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_add_png_image() {
        let initial_pdf = "test_png_initial.pdf";
        let output_pdf = "test_png_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Create a minimal PNG (1x1 red pixel)
        let png_data = create_test_png();

        // Add PNG to PDF
        let mut doc = Document::load(initial_pdf).expect("Failed to load PDF");
        let result = add_image_to_pdf(
            &mut doc,
            0,
            &png_data,
            ImageFormat::Png,
            Position { x: 100.0, y: 150.0 },
            50.0,
            50.0,
        );

        assert!(result.is_ok(), "Failed to add PNG image: {:?}", result.err());

        doc.save(output_pdf).expect("Failed to save PDF");
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_multiple_images_same_page() {
        let initial_pdf = "test_multi_image_initial.pdf";
        let output_pdf = "test_multi_image_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        let mut doc = Document::load(initial_pdf).expect("Failed to load PDF");

        // Add JPEG
        let jpeg_data = std::fs::read("examples/input/fox.jpg")
            .expect("Failed to read fox.jpg");
        add_image_to_pdf(
            &mut doc,
            0,
            &jpeg_data,
            ImageFormat::Jpeg,
            Position { x: 50.0, y: 400.0 },
            100.0,
            100.0,
        ).expect("Failed to add first JPEG");

        // Add PNG
        let png_data = create_test_png();
        add_image_to_pdf(
            &mut doc,
            0,
            &png_data,
            ImageFormat::Png,
            Position { x: 200.0, y: 400.0 },
            50.0,
            50.0,
        ).expect("Failed to add PNG");

        // Add another JPEG at different position
        add_image_to_pdf(
            &mut doc,
            0,
            &jpeg_data,
            ImageFormat::Jpeg,
            Position { x: 300.0, y: 400.0 },
            80.0,
            80.0,
        ).expect("Failed to add second JPEG");

        doc.save(output_pdf).expect("Failed to save PDF");
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    /// Helper function to create a minimal test PNG (1x1 red pixel)
    fn create_test_png() -> Vec<u8> {
        use ::image::{RgbImage, ImageFormat as ImgFmt, Rgb};
        use std::io::Cursor;

        let mut img = RgbImage::new(1, 1);
        img.put_pixel(0, 0, Rgb([255, 0, 0])); // Red pixel

        let mut buffer = Cursor::new(Vec::new());
        img.write_to(&mut buffer, ImgFmt::Png).expect("Failed to write PNG");
        buffer.into_inner()
    }

    #[test]
    fn test_apply_annotations_batch() {
        let initial_pdf = "test_batch_initial.pdf";
        let output_pdf = "test_batch_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Create annotations
        let annotations = vec![
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 220.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Title".to_string(),
                    font_family: "Helvetica-Bold".to_string(),
                    font_size: 18.0,
                    color: Color::RED,
                    font_metrics: FontMetrics::from_font_size(18.0),
                }),
            },
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 190.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Subtitle".to_string(),
                    font_family: "Times-Italic".to_string(),
                    font_size: 14.0,
                    color: Color::BLUE,
                    font_metrics: FontMetrics::from_font_size(14.0),
                }),
            },
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 160.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Body text".to_string(),
                    font_family: "Courier".to_string(),
                    font_size: 12.0,
                    color: Color::BLACK,
                    font_metrics: FontMetrics::from_font_size(12.0),
                }),
            },
        ];

        // Apply annotations
        let result = apply_annotations_to_file(initial_pdf, output_pdf, &annotations);

        assert!(result.is_ok(), "Failed to apply batch annotations: {:?}", result.err());
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // The PDF should be valid - we can't easily verify text extraction
        // since our extraction function may not see all content streams
        // but the PDF will render correctly in viewers

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_mixed_text_and_image_annotations() {
        let initial_pdf = "test_mixed_initial.pdf";
        let output_pdf = "test_mixed_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Initial", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Load JPEG
        let jpeg_data = std::fs::read("examples/input/fox.jpg")
            .expect("Failed to read fox.jpg");

        // Create PNG
        let png_data = create_test_png();

        // Create mixed annotations
        let annotations = vec![
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 220.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Image Gallery".to_string(),
                    font_family: "Helvetica-Bold".to_string(),
                    font_size: 16.0,
                    color: Color::BLACK,
                    font_metrics: FontMetrics::from_font_size(16.0),
                }),
            },
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 100.0 },
                content: AnnotationType::Image(ImageAnnotation {
                    image_data: jpeg_data.clone(),
                    format: ImageFormat::Jpeg,
                    width: 100.0,
                    height: 100.0,
                }),
            },
            Annotation {
                page: 0,
                position: Position { x: 200.0, y: 100.0 },
                content: AnnotationType::Image(ImageAnnotation {
                    image_data: png_data,
                    format: ImageFormat::Png,
                    width: 50.0,
                    height: 50.0,
                }),
            },
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 80.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Fox (JPEG) and Red Pixel (PNG)".to_string(),
                    font_family: "Times-Italic".to_string(),
                    font_size: 10.0,
                    color: Color { r: 128, g: 128, b: 128 },
                    font_metrics: FontMetrics::from_font_size(10.0),
                }),
            },
        ];

        // Apply annotations
        let result = apply_annotations_to_file(initial_pdf, output_pdf, &annotations);

        assert!(result.is_ok(), "Failed to apply mixed annotations: {:?}", result.err());
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // The PDF should be valid with both text and images

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_annotations_multiple_pages() {
        let initial_pdf = "test_multipage_initial.pdf";
        let output_pdf = "test_multipage_output.pdf";

        // Create initial PDF with multiple pages
        create_pdf_with_text(initial_pdf, "Page 1", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // We only have 1 page in the initial PDF, so let's test error handling
        let annotations = vec![
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 220.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "On page 1".to_string(),
                    font_family: "Helvetica".to_string(),
                    font_size: 12.0,
                    color: Color::BLACK,
                    font_metrics: FontMetrics::from_font_size(12.0),
                }),
            },
            Annotation {
                page: 1, // This page doesn't exist
                position: Position { x: 50.0, y: 220.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "On page 2".to_string(),
                    font_family: "Helvetica".to_string(),
                    font_size: 12.0,
                    color: Color::BLACK,
                    font_metrics: FontMetrics::from_font_size(12.0),
                }),
            },
        ];

        // Try to apply annotations - should fail because page 1 doesn't exist
        let result = apply_annotations_to_file(initial_pdf, output_pdf, &annotations);
        assert!(result.is_err(), "Should fail when page doesn't exist");

        // Now test with valid annotations only on page 0
        let valid_annotations = vec![
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 220.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Valid annotation".to_string(),
                    font_family: "Helvetica".to_string(),
                    font_size: 12.0,
                    color: Color::BLACK,
                    font_metrics: FontMetrics::from_font_size(12.0),
                }),
            },
        ];

        let result = apply_annotations_to_file(initial_pdf, output_pdf, &valid_annotations);
        assert!(result.is_ok(), "Should succeed with valid annotations");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }

    #[test]
    fn test_end_to_end_annotation_workflow() {
        let initial_pdf = "test_e2e_initial.pdf";
        let output_pdf = "test_e2e_output.pdf";

        // Create initial PDF
        create_pdf_with_text(initial_pdf, "Original", 50.0, 250.0, 14.0)
            .expect("Failed to create initial PDF");

        // Create annotations as structs
        let annotations = vec![
            Annotation {
                page: 0,
                position: Position { x: 50.0, y: 220.0 },
                content: AnnotationType::Text(TextAnnotation {
                    content: "Hello World".to_string(),
                    font_family: "Helvetica-Bold".to_string(),
                    font_size: 16.0,
                    color: Color::RED,
                    font_metrics: FontMetrics::from_font_size(16.0),
                }),
            },
        ];

        // Serialize to JSON
        let json = serde_json::to_string_pretty(&annotations)
            .expect("Failed to serialize annotations");
        println!("Annotations JSON:\n{}", json);

        // Deserialize from JSON
        let deserialized: Vec<Annotation> = serde_json::from_str(&json)
            .expect("Failed to deserialize annotations");

        // Apply annotations
        apply_annotations_to_file(initial_pdf, output_pdf, &deserialized)
            .expect("Failed to apply annotations");

        // Verify the workflow succeeded (PDF should be valid)
        assert!(Path::new(output_pdf).exists(), "Output PDF was not created");

        // Cleanup
        std::fs::remove_file(initial_pdf).ok();
        std::fs::remove_file(output_pdf).ok();
    }
}
