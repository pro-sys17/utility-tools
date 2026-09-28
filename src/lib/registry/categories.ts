import { CategoryDefinition, ToolCategory } from "./types";

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "pdf",
    name: "PDF Utilities",
    slug: "pdf",
    description: "Merge, split, compress, view, and convert PDF documents directly in your browser.",
    icon: "FileText",
    color: "from-red-500/20 to-orange-500/20 text-red-500 border-red-500/30",
  },
  {
    id: "image",
    name: "Image Tools",
    slug: "image",
    description: "Compress, resize, convert, and optimize images locally using fast Canvas APIs.",
    icon: "Image",
    color: "from-blue-500/20 to-cyan-500/20 text-blue-500 border-blue-500/30",
  },
  {
    id: "archive",
    name: "Files & Archives",
    slug: "archive",
    description: "Create and extract ZIP archives, inspect files, and manage bundles securely.",
    icon: "Archive",
    color: "from-amber-500/20 to-yellow-500/20 text-amber-500 border-amber-500/30",
  },
  {
    id: "text",
    name: "Text & Writing",
    slug: "text",
    description: "Inspect word counts, compare text diffs, format code, and transform strings.",
    icon: "Type",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30",
  },
  {
    id: "developer",
    name: "Developer Tools",
    slug: "developer",
    description: "JSON tools, Base64 converters, UUID generators, JWT decoders, and debuggers.",
    icon: "Code",
    color: "from-violet-500/20 to-purple-500/20 text-violet-500 border-violet-500/30",
  },
  {
    id: "converter",
    name: "Converters",
    slug: "converter",
    description: "Universal unit conversions for length, weight, temperature, data, and time.",
    icon: "ArrowLeftRight",
    color: "from-indigo-500/20 to-blue-500/20 text-indigo-500 border-indigo-500/30",
  },
  {
    id: "network",
    name: "Network & Security",
    slug: "network",
    description: "Subnet calculators, password generators, security headers, and hash generators.",
    icon: "Shield",
    color: "from-rose-500/20 to-pink-500/20 text-rose-500 border-rose-500/30",
  },
  {
    id: "calculator",
    name: "Calculators",
    slug: "calculator",
    description: "Financial calculations, loan EMI, compound interest, and percentage tools.",
    icon: "Calculator",
    color: "from-sky-500/20 to-cyan-500/20 text-sky-500 border-sky-500/30",
  },
  {
    id: "misc",
    name: "Miscellaneous",
    slug: "misc",
    description: "Random generators, timers, QR utilities, and convenient daily helpers.",
    icon: "Sparkles",
    color: "from-fuchsia-500/20 to-pink-500/20 text-fuchsia-500 border-fuchsia-500/30",
  },
];

export function getCategoryById(id: ToolCategory): CategoryDefinition | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}
