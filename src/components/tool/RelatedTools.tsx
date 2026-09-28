import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { ToolDefinition } from "@/lib/registry/types";

export interface RelatedToolsProps {
  tools: ToolDefinition[];
}

export function RelatedTools({ tools }: RelatedToolsProps) {
  if (tools.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Related Utilities
        </h3>
        <Link
          href="/#all-tools"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
        >
          <span>Explore all tools</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                  {tool.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
