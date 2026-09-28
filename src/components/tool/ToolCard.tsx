"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShieldCheck, Cpu, ArrowUpRight, Wrench } from "lucide-react";
import { ToolDefinition } from "@/lib/registry/types";
import { useIsFavorite, toggleFavorite } from "@/lib/storage/favorites";
import { Badge } from "../common/Badge";

export interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const favorite = useIsFavorite(tool.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(tool.id);
  };

  const isClickable = tool.status === "active";
  const href = isClickable ? `/tools/${tool.slug}` : `/categories/${tool.category}`;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition-all duration-200 bg-white dark:bg-slate-900 ${
        isClickable
          ? "border-slate-200/90 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 dark:border-slate-800 dark:hover:border-blue-500/50"
          : "border-slate-200/60 opacity-75 hover:opacity-100 dark:border-slate-800/60"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-2xs group-hover:scale-105 transition-transform">
            <Wrench className="h-5 w-5" />
          </div>

          <div className="flex items-center space-x-1.5">
            {tool.status === "planned" && (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Planned
              </span>
            )}
            {tool.popular && tool.status === "active" && (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Popular
              </span>
            )}
            <button
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-lg border transition-colors ${
                favorite
                  ? "bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/50 dark:border-amber-700"
                  : "border-transparent text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
              }`}
              title={favorite ? "Favorited" : "Favorite"}
              aria-label={favorite ? "Remove favorite" : "Add favorite"}
            >
              <Star className={`h-4 w-4 ${favorite ? "fill-amber-400 text-amber-500" : ""}`} />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center space-x-1.5">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 transition-colors">
              {tool.name}
            </h3>
            {isClickable && (
              <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <Badge variant="secondary" className="capitalize text-[11px] font-normal">
          {tool.category}
        </Badge>

        <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400">
          {tool.processing === "client" ? (
            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Local</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-purple-600 dark:text-purple-400">
              <Cpu className="h-3.5 w-3.5" />
              <span>Worker</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
