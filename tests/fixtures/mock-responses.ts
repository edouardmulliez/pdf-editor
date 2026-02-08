export const mockPDFResponse = {
  file_name: 'test.pdf',
  file_path: '/test/fixtures/test.pdf',
  data: [] // Populated from actual file
};

export const mockTextAnnotation = {
  id: 'test-annotation-1',
  type: 'text' as const,
  pageNumber: 1,
  position: { x: 100, y: 100 },
  content: 'Test annotation',
  fontFamily: 'Arial',
  fontSize: 14,
  fontColor: '#000000',
  fontStyles: [],
  size: { width: 200, height: 30 }
};
