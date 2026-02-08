use crate::file_ops::{read_pdf_file, PdfFileData};
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
