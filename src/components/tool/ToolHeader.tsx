"use client";

import * as React from "react";
import { Star, ShieldCheck, Cpu, Server } from "lucide-react";
import { ToolDefinition } from "@/lib/registry/types";
import { useIsFavorite, toggleFavorite } from "@/lib/storage/favorites";
import { Badge } from "../common/Badge";

export interface ToolHeaderProps {
  tool: ToolDefinition;
}

export function ToolHeader({ tool }: ToolHeaderProps) {
  const favorite = useIsFavorite(tool.id);

  const handleToggleFavorite = () => {
    toggleFavorite(tool.id);
  };

  const renderProcessingBadge = () => {
    switch (tool.processing) {
      case "client":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Processed locally in your browser</span>
          </div>
        );
      case "worker":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-medium">
            <Cpu className="h-4 w-4" />
            <span>Processed locally via Web Worker</span>
          </div>
        );
      case "server":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-medium">
            <Server className="h-4 w-4" />
            <span>Requires server processing</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tool.name}
            </h1>
            <button
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-lg border transition-colors ${
                favorite
                  ? "bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40 dark:border-amber-800"
                  : "border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 dark:border-slate-800 dark:hover:border-slate-700"
              }`}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-5 w-5 ${favorite ? "fill-amber-400 text-amber-500" : ""}`} />
            </button>
          </div>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {tool.longDescription || tool.description}
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-auto">
          {renderProcessingBadge()}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Badge variant="secondary" className="capitalize text-xs">
          Category: {tool.category}
        </Badge>
        {tool.keywords.slice(0, 4).map((kw) => (
          <span
            key={kw}
            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            #{kw}
          </span>
        ))}
      </div>
    </div>
  );
}
