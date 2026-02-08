export interface ImageData {
  data: string; // base64 data URL
  format: 'jpeg' | 'png';
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Opens a file dialog for the user to select an image (JPEG or PNG)
 * Returns the image data as base64 along with metadata
 *
 * @returns Promise that resolves to ImageData or null if canceled
 */
export async function openImageDialog(): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({
            data: dataUrl,
            format: file.type === 'image/jpeg' ? 'jpeg' : 'png',
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          });
        };
        img.onerror = () => {
          console.error('Failed to load image');
          resolve(null);
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        console.error('Failed to read file');
        resolve(null);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
}
