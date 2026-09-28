import JSZip from "jszip";

export interface ExtractedZipItem {
  name: string;
  isDir: boolean;
  size: number;
  date: Date;
  getBlob: () => Promise<Blob>;
  getText: () => Promise<string>;
}

export async function createZipArchive(
  files: { name: string; content: Blob | ArrayBuffer | Uint8Array | string }[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.content);
  }

  return await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );
}

export async function extractZipArchive(zipData: ArrayBuffer | Blob): Promise<ExtractedZipItem[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipData);
  const items: ExtractedZipItem[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    items.push({
      name: zipEntry.name,
      isDir: zipEntry.dir,
      size: (zipEntry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0,
      date: zipEntry.date,
      getBlob: async () => {
        return await zipEntry.async("blob");
      },
      getText: async () => {
        return await zipEntry.async("text");
      },
    });
  });

  return items;
}
