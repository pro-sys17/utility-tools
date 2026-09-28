import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Layers, Cpu, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About UtilityHub — Architecture & Mission",
  description: "Learn about UtilityHub's open-source architecture, local-first processing, and modular design system.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <Breadcrumb items={[{ label: "About" }]} />

      <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About UtilityHub
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          UtilityHub was engineered to solve a common developer and everyday productivity frustration: bloated, ad-filled web converter sites that require uploading private documents to unknown servers.
        </p>
      </div>

      <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="h-5 w-5 text-blue-500" />
            <span>Architecture & Principles</span>
          </h2>
          <p>
            UtilityHub is designed around a single shared tool registry and modular engine architecture. Adding a new utility does not require editing multiple pages or hardcoding links. Every tool plugs into the central registry with typed schemas, processing models, and metadata.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Central Tool Registry
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single source of truth driving dynamic routing, SEO metadata, category pages, search indexing, and breadcrumbs.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Reusable Processing Engines
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standardized engines for PDF-lib, Canvas image manipulation, JSZip packaging, and Diff calculations.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-purple-500" />
            <span>Modern Technology Stack</span>
          </h2>
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li><strong>Next.js App Router:</strong> Server-side rendering for lightning-fast first paint and optimal SEO.</li>
            <li><strong>TypeScript:</strong> 100% strict type safety across all registry tools and processing utilities.</li>
            <li><strong>Tailwind CSS v4:</strong> Sleek, accessible design system with native light and dark modes.</li>
            <li><strong>pdf-lib & pdfjs-dist:</strong> Client-side PDF manipulation, parsing, and canvas rendering.</li>
            <li><strong>JSZip:</strong> Client-side ZIP creation and extraction without server overhead.</li>
            <li><strong>Web Crypto API:</strong> Cryptographically random UUID generation and hashing.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-emerald-500" />
            <span>Open Source & Community</span>
          </h2>
          <p>
            UtilityHub is released under the permissive MIT License. Contributions, bug reports, and new utility submissions are enthusiastically welcomed by our community.
          </p>
        </section>
      </div>
    </div>
  );
}
