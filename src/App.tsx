import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { Header } from './components/UI/Header';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { PDFViewer } from './components/PDFViewer/PDFViewer';
import { StatusBar } from './components/UI/StatusBar';
import { usePDFStore } from './stores/usePDFStore';
import { useAnnotationStore } from './stores/useAnnotationStore';
import { loadPdfFromBytes } from './utils/pdf-loader';
import { transformAnnotationsForRust } from './utils/annotation-transformer';

function App() {
  const { document: pdfDoc, setDocument, setLoading, setError } = usePDFStore();

  const handleOpenFile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Tauri command to open file dialog and read PDF
      const result = await invoke<{
        file_name: string;
        file_path: string;
        data: number[];
      }>('open_pdf_dialog');

      // Convert number array to Uint8Array
      const uint8Array = new Uint8Array(result.data);

      // Load PDF with PDF.js
      const loadedPdf = await loadPdfFromBytes(
        uint8Array,
        result.file_name,
        result.file_path
      );

      // Update store with loaded PDF
      setDocument(
        loadedPdf.document,
        loadedPdf.fileName,
        loadedPdf.filePath,
        loadedPdf.numPages
      );

      console.log(`PDF loaded: ${loadedPdf.fileName} (${loadedPdf.numPages} pages)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to open PDF');
      setError(message);
      console.error('Error opening PDF:', error);
    }
  };

  const handleExport = async () => {
    try {
      const { document: pdfDoc, fileName, filePath, setLoading, setError, setSuccessMessage } = usePDFStore.getState();

      // 1. Validate state
      if (!pdfDoc || !filePath) {
        setError('No PDF loaded');
        return;
      }

      // 2. Get annotations
      const annotations = useAnnotationStore.getState().annotations;

      // 3. Show save dialog
      const defaultFilename = fileName
        ? fileName.replace(/\.pdf$/i, '') + '-annotated.pdf'
        : 'annotated.pdf';

      const savePath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });

      if (!savePath) return; // User cancelled

      // 4. Show loading state
      setLoading(true);

      // 5. Transform annotations to Rust format
      const rustAnnotations = transformAnnotationsForRust(annotations);
      const annotationsJson = JSON.stringify(rustAnnotations);

      // 6. Call Tauri export command
      await invoke<string>('export_pdf', {
        inputPath: filePath,
        outputPath: savePath,
        annotationsJson,
      });

      // 7. Show success message
      const filename = savePath.split('/').pop() || 'file.pdf';
      setSuccessMessage(`Exported to ${filename}`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      usePDFStore.getState().setError(message);
      console.error('Export error:', error);
    } finally {
      usePDFStore.getState().setLoading(false);
    }
  };

  const handleExportAnnotationsOnly = async () => {
    try {
      const { document: pdfDoc, fileName, filePath, setLoading, setError, setSuccessMessage } = usePDFStore.getState();

      if (!pdfDoc || !filePath) {
        setError('No PDF loaded');
        return;
      }

      const annotations = useAnnotationStore.getState().annotations;

      const defaultFilename = fileName
        ? fileName.replace(/\.pdf$/i, '') + '-annotations-only.pdf'
        : 'annotations-only.pdf';

      const savePath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });

      if (!savePath) return;

      setLoading(true);

      const rustAnnotations = transformAnnotationsForRust(annotations);
      const annotationsJson = JSON.stringify(rustAnnotations);

      await invoke<string>('export_annotations_only', {
        inputPath: filePath,
        outputPath: savePath,
        annotationsJson,
      });

      const filename = savePath.split('/').pop() || 'file.pdf';
      setSuccessMessage(`Exported annotations to ${filename}`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      usePDFStore.getState().setError(message);
      console.error('Export annotations only error:', error);
    } finally {
      usePDFStore.getState().setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        onOpenFile={handleOpenFile}
        onExport={handleExport}
        onExportAnnotationsOnly={handleExportAnnotationsOnly}
        hasDocument={pdfDoc !== null}
      />

      {pdfDoc && <Toolbar />}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <PDFViewer />
      </div>

      <StatusBar />
    </div>
  );
}

export default App;
