export interface UtilityFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export function createUtilityFile(file: File): UtilityFile {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
  };
}

export function validateFile(
  file: File,
  options?: {
    maxSizeInBytes?: number;
    acceptedMimeTypes?: string[];
  }
): { valid: boolean; error?: string } {
  if (options?.maxSizeInBytes && file.size > options.maxSizeInBytes) {
    const maxMb = (options.maxSizeInBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum size limit of ${maxMb}MB.`,
    };
  }

  if (options?.acceptedMimeTypes && options.acceptedMimeTypes.length > 0) {
    const isWildcard = options.acceptedMimeTypes.includes("*/*");
    if (!isWildcard) {
      const match = options.acceptedMimeTypes.some((type) => {
        if (type.endsWith("/*")) {
          const prefix = type.split("/")[0];
          return file.type.startsWith(`${prefix}/`);
        }
        return file.type === type;
      });

      if (!match) {
        return {
          valid: false,
          error: `File type "${file.type || "unknown"}" is not supported. Expected: ${options.acceptedMimeTypes.join(", ")}.`,
        };
      }
    }
  }

  return { valid: true };
}

export function moveItemInList<T>(list: T[], index: number, direction: "up" | "down"): T[] {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return list;
  const copy = [...list];
  const item = copy[index];
  copy[index] = copy[targetIndex];
  copy[targetIndex] = item;
  return copy;
}

export function createSafeObjectUrl(blob: Blob | File): string {
  return URL.createObjectURL(blob);
}

export function revokeSafeObjectUrl(url: string | undefined): void {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignored if already revoked
    }
  }
}
