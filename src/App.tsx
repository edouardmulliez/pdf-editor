import { invoke } from '@tauri-apps/api/core';
import { Header } from './components/UI/Header';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { PDFViewer } from './components/PDFViewer/PDFViewer';
import { StatusBar } from './components/UI/StatusBar';
import { usePDFStore } from './stores/usePDFStore';
import { loadPdfFromBytes } from './utils/pdf-loader';

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
      const message = error instanceof Error ? error.message : 'Failed to open PDF';
      setError(message);
      console.error('Error opening PDF:', error);
    }
  };

  const handleExport = async () => {
    // TODO: Implement PDF export
    console.log('Export clicked');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        onOpenFile={handleOpenFile}
        onExport={handleExport}
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
