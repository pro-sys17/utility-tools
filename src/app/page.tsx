import Link from "next/link";
import { getAllTools, getPopularTools } from "@/lib/registry/tools";
import { CATEGORIES } from "@/lib/registry/categories";
import { ToolGrid } from "@/components/tool/ToolGrid";
import { ToolCard } from "@/components/tool/ToolCard";
import { RecentToolsSection } from "@/components/home/RecentToolsSection";
import { HomeHeroSearch } from "@/components/home/HomeHeroSearch";
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Archive,
  Type,
  Code,
  ArrowLeftRight,
  Shield,
  Calculator,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-6 w-6" />,
  image: <ImageIcon className="h-6 w-6" />,
  archive: <Archive className="h-6 w-6" />,
  text: <Type className="h-6 w-6" />,
  developer: <Code className="h-6 w-6" />,
  converter: <ArrowLeftRight className="h-6 w-6" />,
  network: <Shield className="h-6 w-6" />,
  calculator: <Calculator className="h-6 w-6" />,
  misc: <Sparkles className="h-6 w-6" />,
};

export default function HomePage() {
  const allTools = getAllTools();
  const popularTools = getPopularTools();

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50 dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Privacy Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>100% Client-Side Privacy — Zero Server File Uploads</span>
          </div>

          {/* Heading & Tagline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Powerful tools for everyday work.
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              PDF, files, images, developer utilities, converters, calculators, security tools, and more. Fast, private, and simple.
            </p>
          </div>

          {/* Interactive Search Bar */}
          <HomeHeroSearch />

          {/* Core Guarantees Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <span>No registration needed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <span>Files stay on your device</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Instant local processing</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Categories Section */}
        <section id="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Explore by Category
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Browse our modular collections of focused utilities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => {
              const count = allTools.filter((t) => t.category === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative flex items-start space-x-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 transition-all duration-200"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} shrink-0`}
                  >
                    {CATEGORY_ICON_MAP[cat.id]}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cat.name}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {count}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recently Used Section (Client reactive) */}
        <RecentToolsSection />

        {/* Popular Tools Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Popular Utilities
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Frequently used tools ready for instant local execution.
              </p>
            </div>
            <a
              href="#all-tools"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {popularTools.slice(0, 6).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* All Tools Section with search and category filters */}
        <section id="all-tools" className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <ToolGrid
            tools={allTools}
            title="All Utilities"
            subtitle="Search, filter, and launch any tool directly."
            showFilters={true}
          />
        </section>
      </div>
    </div>
  );
}
