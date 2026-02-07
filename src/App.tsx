import React from 'react';
import { Header } from './components/UI/Header';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { PDFViewer } from './components/PDFViewer/PDFViewer';
import { StatusBar } from './components/UI/StatusBar';
import { usePDFStore } from './stores/usePDFStore';

function App() {
  const { document: pdfDoc } = usePDFStore();

  const handleOpenFile = async () => {
    // TODO: Implement file opening with Tauri dialog
    console.log('Open file clicked');
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
