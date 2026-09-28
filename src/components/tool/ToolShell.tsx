"use client";

import * as React from "react";
import { ToolDefinition } from "@/lib/registry/types";
import { Breadcrumb } from "../layout/Breadcrumb";
import { ToolHeader } from "./ToolHeader";
import { RelatedTools } from "./RelatedTools";
import { getRelatedTools } from "@/lib/registry/tools";
import { addRecentToolSlug } from "@/lib/storage/recent-tools";
import { ShieldCheck, Zap, Lock } from "lucide-react";

export interface ToolShellProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

export function ToolShell({ tool, children }: ToolShellProps) {
  React.useEffect(() => {
    addRecentToolSlug(tool.slug);
  }, [tool.slug]);

  const relatedTools = React.useMemo(() => {
    return getRelatedTools(tool, 4);
  }, [tool]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Categories", href: "/#categories" },
          { label: tool.category.toUpperCase(), href: `/categories/${tool.category}` },
          { label: tool.name },
        ]}
      />

      {/* Header */}
      <div className="mt-4">
        <ToolHeader tool={tool} />
      </div>

      {/* Main Tool Content */}
      <main className="mt-8">{children}</main>

      {/* Security & Feature Guarantees */}
      <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Why use {tool.name} on UtilityHub?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                100% Client-Side Privacy
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your data never travels to our servers. Files and inputs are processed locally in your web browser.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Zero Wait Time & Instant
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                No upload queues or file size limits caused by network bottlenecks. Native browser processing executes at top speed.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Open-Source & Transparent
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Built on open-source web standards. Inspect the code, verify the algorithms, and audit privacy anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <RelatedTools tools={relatedTools} />
    </div>
  );
}
