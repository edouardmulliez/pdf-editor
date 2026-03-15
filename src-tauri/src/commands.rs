use crate::file_ops::{read_pdf_file, PdfFileData};
use crate::pdf_ops::{apply_annotations_to_file, create_annotations_only_pdf, Annotation};
use tauri::AppHandle;

/// Opens a file dialog to select a PDF file and returns its data.
///
/// This command opens a native file dialog filtered to PDF files only.
/// If the user selects a file, it reads and validates the PDF, returning
/// the file name, path, and raw bytes. If the user cancels, it returns an error.
///
/// # Arguments
///
/// * `app` - The Tauri application handle
///
/// # Returns
///
/// * `Ok(PdfFileData)` - The selected PDF file data
/// * `Err(String)` - An error message if no file was selected or reading failed
#[tauri::command]
pub async fn open_pdf_dialog(app: AppHandle) -> Result<PdfFileData, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("PDF Files", &["pdf"])
        .blocking_pick_file();

    match file_path {
        Some(file_path) => {
            // Convert FilePath to PathBuf - handles both Path and Url variants
            let path_buf = file_path
                .into_path()
                .map_err(|e| format!("Failed to convert file path: {}", e))?;
            read_pdf_file(path_buf)
        }
        None => Err("No file selected".to_string()),
    }
}

/// Exports a PDF with annotations applied.
///
/// This command takes an input PDF path, applies annotations from JSON-serialized data,
/// and saves the result to the output path. All annotations are deserialized and validated
/// before being applied to the PDF.
///
/// # Arguments
///
/// * `input_path` - Path to the source PDF file
/// * `output_path` - Path where the annotated PDF will be saved
/// * `annotations_json` - JSON string containing array of annotations
///
/// # Returns
///
/// * `Ok(String)` - Success message with output path
/// * `Err(String)` - Error message if deserialization or export fails
#[tauri::command]
pub async fn export_pdf(
    input_path: String,
    output_path: String,
    annotations_json: String,
) -> Result<String, String> {
    let t0 = std::time::Instant::now();
    // Deserialize JSON to Vec<Annotation>
    let annotations: Vec<Annotation> = serde_json::from_str(&annotations_json)
        .map_err(|e| format!("Invalid annotation data: {}", e))?;
    println!("[TIMING] JSON deserialization: {:?}", t0.elapsed());

    let t1 = std::time::Instant::now();
    // Apply annotations using existing Phase 0 function
    apply_annotations_to_file(&input_path, &output_path, &annotations)
        .map_err(|e| format!("Export failed: {}", e))?;
    println!("[TIMING] apply_annotations_to_file: {:?}", t1.elapsed());

    // Return success message
    Ok(format!("Successfully exported PDF to {}", output_path))
}

/// Exports a new PDF containing only the annotations (no original PDF content).
/// Page count and dimensions match the original PDF.
///
/// # Arguments
///
/// * `input_path` - Path to the source PDF (used for page dimensions)
/// * `output_path` - Path where the annotations-only PDF will be saved
/// * `annotations_json` - JSON string containing array of annotations
///
/// # Returns
///
/// * `Ok(String)` - Success message with output path
/// * `Err(String)` - Error message if deserialization or export fails
#[tauri::command]
pub async fn export_annotations_only(
    input_path: String,
    output_path: String,
    annotations_json: String,
) -> Result<String, String> {
    let annotations: Vec<Annotation> = serde_json::from_str(&annotations_json)
        .map_err(|e| format!("Invalid annotation data: {}", e))?;

    create_annotations_only_pdf(&input_path, &output_path, &annotations)
        .map_err(|e| format!("Export failed: {}", e))?;

    Ok(format!("Successfully exported annotations-only PDF to {}", output_path))
}
