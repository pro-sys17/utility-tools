import * as Diff from "diff";

export interface TextMetrics {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  topWords: { word: string; count: number; percentage: number }[];
}

export function analyzeText(text: string): TextMetrics {
  if (!text || text.trim() === "") {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
      topWords: [],
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, "").length;
  const lines = text.split(/\r\n|\r|\n/).length;

  // Words matching alphanumeric tokens
  const wordsArray = text.match(/\b[\w'-]+\b/g) || [];
  const words = wordsArray.length;

  // Sentences (approximate matching punctuation followed by space or end)
  const sentencesArray = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [];
  const sentences = sentencesArray.length || (words > 0 ? 1 : 0);

  // Paragraphs (non-empty blocks separated by double newlines)
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length || 1;

  // Reading time: 200 words per minute average
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Speaking time: 130 words per minute average
  const speakingTimeMinutes = Math.max(1, Math.ceil(words / 130));

  // Top keywords (ignoring small stop words)
  const stopWords = new Set([
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there",
    "their", "what", "so", "up", "out", "if", "about", "who", "get",
    "which", "go", "me", "is", "are", "was", "were",
  ]);

  const wordCounts: Record<string, number> = {};
  for (const rawWord of wordsArray) {
    const word = rawWord.toLowerCase();
    if (word.length > 2 && !stopWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / (words || 1)) * 100),
    }));

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes,
    speakingTimeMinutes,
    topWords: sortedWords,
  };
}

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
  count?: number;
}

export interface DiffResult {
  parts: DiffPart[];
  additions: number;
  deletions: number;
  unchanged: number;
}

export function computeTextDiff(
  oldText: string,
  newText: string,
  mode: "lines" | "words" = "lines"
): DiffResult {
  const parts = mode === "lines"
    ? Diff.diffLines(oldText, newText)
    : Diff.diffWords(oldText, newText);

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const part of parts) {
    const lines = (part.value.match(/\n/g) || []).length || 1;
    if (part.added) {
      additions += lines;
    } else if (part.removed) {
      deletions += lines;
    } else {
      unchanged += lines;
    }
  }

  return {
    parts,
    additions,
    deletions,
    unchanged,
  };
}

/**
 * Robust UTF-8 Base64 Encoder / Decoder for strings
 */
export function encodeBase64Text(str: string, urlSafe: boolean = false): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let b64 = btoa(binary);
  if (urlSafe) {
    b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return b64;
}

export function decodeBase64Text(b64: string): string {
  let clean = b64.trim();
  // Handle URL-safe base64
  clean = clean.replace(/-/g, "+").replace(/_/g, "/");
  while (clean.length % 4 !== 0) {
    clean += "=";
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Generate RFC 4122/9562 UUIDs
 */
export function generateUuids(
  count: number = 1,
  options?: {
    uppercase?: boolean;
    hyphens?: boolean;
    version?: "v4" | "nil";
  }
): string[] {
  const results: string[] = [];
  const qty = Math.min(1000, Math.max(1, count));
  const uppercase = options?.uppercase ?? false;
  const hyphens = options?.hyphens ?? true;

  for (let i = 0; i < qty; i++) {
    let id: string;
    if (options?.version === "nil") {
      id = "00000000-0000-0000-0000-000000000000";
    } else {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        id = crypto.randomUUID();
      } else {
        // Fallback for environments without crypto.randomUUID
        id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
    }

    if (!hyphens) {
      id = id.replace(/-/g, "");
    }
    if (uppercase) {
      id = id.toUpperCase();
    } else {
      id = id.toLowerCase();
    }

    results.push(id);
  }

  return results;
}
