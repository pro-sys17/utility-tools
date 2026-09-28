import { revokeSafeObjectUrl } from "./file-utils";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    revokeSafeObjectUrl(url);
  }, 1000);
}

export function downloadText(text: string, filename: string, mimeType: string = "text/plain"): void {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadBase64(base64Data: string, filename: string, mimeType: string = "application/octet-stream"): void {
  try {
    const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    downloadBlob(blob, filename);
  } catch (error) {
    throw new Error(`Failed to decode and download Base64 file: ${(error as Error).message}`);
  }
}
