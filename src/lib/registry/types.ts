export type ToolCategory =
  | "pdf"
  | "image"
  | "archive"
  | "text"
  | "developer"
  | "converter"
  | "network"
  | "calculator"
  | "misc";

export type ProcessingType = "client" | "worker" | "server" | "hybrid";

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  description: string;
  longDescription?: string;
  keywords: string[];
  icon: string;
  accepts?: string[];
  outputTypes?: string[];
  processing: ProcessingType;
  featured?: boolean;
  popular?: boolean;
  badge?: string;
  status?: "active" | "planned" | "server-required";
}

export interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}
