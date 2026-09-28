export interface ImageCompressOptions {
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  format?: "image/jpeg" | "image/webp" | "image/png";
}

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savingsPercentage: number;
  format: string;
}

export async function compressImage(
  file: File,
  options: ImageCompressOptions
): Promise<CompressedImageResult> {
  const { quality, maxWidth, maxHeight, format = "image/jpeg" } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const originalWidth = width;
      const originalHeight = height;

      // Calculate resized dimensions preserving aspect ratio
      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context."));
        return;
      }

      // Fill white background for JPEGs to avoid black transparent areas
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas compression failed to generate Blob."));
            return;
          }

          const originalSize = file.size;
          const compressedSize = blob.size;
          const savedBytes = Math.max(0, originalSize - compressedSize);
          const savingsPercentage = Math.round(
            ((originalSize - compressedSize) / originalSize) * 100
          );

          const resultUrl = URL.createObjectURL(blob);

          resolve({
            blob,
            dataUrl: resultUrl,
            originalWidth,
            originalHeight,
            width,
            height,
            originalSize,
            compressedSize,
            savedBytes,
            savingsPercentage,
            format,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image file."));
    };

    img.src = objectUrl;
  });
}
