import * as pdfjsLib from 'pdfjs-dist';

// Configure worker path for production and dev
if (import.meta.env.PROD) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

export { pdfjsLib };
