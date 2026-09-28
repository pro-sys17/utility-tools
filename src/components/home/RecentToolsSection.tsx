"use client";

import * as React from "react";
import { useRecentToolSlugs, clearRecentTools } from "@/lib/storage/recent-tools";
import { getToolBySlug } from "@/lib/registry/tools";
import { ToolDefinition } from "@/lib/registry/types";
import { ToolCard } from "@/components/tool/ToolCard";
import { History, Trash2 } from "lucide-react";

export function RecentToolsSection() {
  const slugs = useRecentToolSlugs();

  const recentTools = React.useMemo(() => {
    return slugs
      .map((slug) => getToolBySlug(slug))
      .filter((t): t is ToolDefinition => !!t);
  }, [slugs]);

  if (recentTools.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Recently Used
          </h2>
        </div>
        <button
          onClick={clearRecentTools}
          className="text-xs text-slate-500 hover:text-red-500 flex items-center space-x-1 transition-colors"
          title="Clear recent tools history"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear history</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {recentTools.slice(0, 6).map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
