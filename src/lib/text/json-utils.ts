export interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  line?: number;
  column?: number;
  snippet?: string;
  byteSize: number;
  keyCount?: number;
}

export function validateJson(input: string): JsonValidationResult {
  const byteSize = new Blob([input]).size;

  if (!input.trim()) {
    return {
      isValid: false,
      error: "Input is empty. Please provide valid JSON content.",
      byteSize: 0,
    };
  }

  try {
    const parsed = JSON.parse(input);
    let keyCount = 0;
    if (parsed && typeof parsed === "object") {
      keyCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
    }

    return {
      isValid: true,
      byteSize,
      keyCount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON syntax";
    let line = 1;
    let column = 1;

    // Attempt to extract position from V8 error: "at position 123"
    const posMatch = message.match(/at position (\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const lines = input.slice(0, pos).split("\n");
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    } else {
      // Attempt to extract line / column if formatted like "line 4 column 10"
      const lineColMatch = message.match(/line (\d+) column (\d+)/i);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        column = parseInt(lineColMatch[2], 10);
      }
    }

    // Extract surrounding snippet
    const allLines = input.split("\n");
    const targetLine = allLines[line - 1] || "";
    const snippet = targetLine.trim();

    return {
      isValid: false,
      error: message,
      line,
      column,
      snippet,
      byteSize,
    };
  }
}

export function formatJson(
  input: string,
  indent: 2 | 4 | "\t" = 2
): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    const result = JSON.stringify(parsed, null, indent);
    return { success: true, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse JSON";
    return { success: false, error: message };
  }
}

export function minifyJson(
  input: string
): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    const result = JSON.stringify(parsed);
    return { success: true, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse JSON";
    return { success: false, error: message };
  }
}
