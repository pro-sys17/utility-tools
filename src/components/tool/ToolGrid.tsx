"use client";

import * as React from "react";
import { Search, Filter } from "lucide-react";
import { ToolDefinition } from "@/lib/registry/types";
import { CATEGORIES } from "@/lib/registry/categories";
import { ToolCard } from "./ToolCard";
import { Input } from "../common/Input";

export interface ToolGridProps {
  tools: ToolDefinition[];
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
}

export function ToolGrid({
  tools,
  title,
  subtitle,
  showFilters = false,
}: ToolGridProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const filteredTools = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tools.filter((t) => {
      const matchCat = selectedCategory === "all" || t.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [tools, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {(title || subtitle || showFilters) && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter utilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  All ({tools.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = tools.filter((t) => t.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {filteredTools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Filter className="mx-auto h-8 w-8 text-slate-400 mb-3" />
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No matching tools found
          </h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search query or switching categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
