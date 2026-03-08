use std::fs;
use std::io::Cursor;
use std::path::PathBuf;

#[derive(Debug, serde::Serialize)]
pub struct PdfFileData {
    pub file_name: String,
    pub file_path: String,
    pub data: Vec<u8>,
}

/// Reads a PDF file from the given path and returns its data.
///
/// # Arguments
///
/// * `path` - The path to the PDF file
///
/// # Returns
///
/// * `Ok(PdfFileData)` - The file data including name, path, and raw bytes
/// * `Err(String)` - An error message if the file cannot be read or is not a valid PDF
pub fn read_pdf_file(path: PathBuf) -> Result<PdfFileData, String> {
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    if !path.is_file() {
        return Err("Path is not a file".to_string());
    }

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid file name")?
        .to_string();

    let data = fs::read(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Verify PDF magic bytes
    if data.len() < 4 || &data[0..4] != b"%PDF" {
        return Err("File is not a valid PDF".to_string());
    }

    // Check for PDF encryption
    let cursor = Cursor::new(&data);
    if let Ok(doc) = lopdf::Document::load_from(cursor) {
        if doc.is_encrypted() {
            return Err(
                "This PDF is encrypted. Please decrypt it before editing.".to_string()
            );
        }
    }

    Ok(PdfFileData {
        file_name,
        file_path: path.to_string_lossy().to_string(),
        data,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::path::PathBuf;

    #[test]
    fn test_read_valid_pdf() {
        let mut temp_file = tempfile::NamedTempFile::new().unwrap();
        temp_file.write_all(b"%PDF-1.4\ntest content").unwrap();
        let path = temp_file.path().to_path_buf();

        let result = read_pdf_file(path);
        assert!(result.is_ok());

        let pdf_data = result.unwrap();
        assert!(pdf_data.file_name.len() > 0);
        assert_eq!(&pdf_data.data[0..4], b"%PDF");
    }

    #[test]
    fn test_read_invalid_file() {
        let mut temp_file = tempfile::NamedTempFile::new().unwrap();
        temp_file.write_all(b"Not a PDF").unwrap();
        let path = temp_file.path().to_path_buf();

        let result = read_pdf_file(path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a valid PDF"));
    }

    #[test]
    fn test_read_nonexistent_file() {
        let path = PathBuf::from("/nonexistent/file.pdf");
        let result = read_pdf_file(path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not exist"));
    }
}
