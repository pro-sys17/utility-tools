"use client";

import * as React from "react";
import { Button } from "@/components/common/Button";
import { CopyButton } from "@/components/common/CopyButton";
import { Textarea } from "@/components/common/Input";
import { formatJson, minifyJson, validateJson } from "@/lib/text/json-utils";
import { downloadText } from "@/lib/file/download-utils";
import { formatBytes } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Download, RotateCcw, Sparkles, Minimize2, AlignLeft } from "lucide-react";

const SAMPLE_JSON = `{
  "app": "UtilityHub",
  "version": "1.0.0",
  "features": [
    "Privacy-first local processing",
    "No server file uploads",
    "Modular architecture"
  ],
  "author": {
    "name": "Open Source Community",
    "license": "MIT"
  }
}`;

export function JsonFormatterTool() {
  const [input, setInput] = React.useState<string>(SAMPLE_JSON);
  const [indent, setIndent] = React.useState<2 | 4 | "\t">(2);
  const [action, setAction] = React.useState<"format" | "minify">("format");

  const { output, error } = React.useMemo(() => {
    if (!input.trim()) {
      return { output: "", error: null };
    }
    if (action === "minify") {
      const res = minifyJson(input);
      return { output: res.result || "", error: res.error || null };
    } else {
      const res = formatJson(input, indent);
      return { output: res.result || "", error: res.error || null };
    }
  }, [input, indent, action]);

  const handleDownload = () => {
    const textToDownload = output || input;
    if (textToDownload) {
      downloadText(textToDownload, "formatted.json", "application/json");
    }
  };

  const validation = React.useMemo(() => {
    return validateJson(input);
  }, [input]);

  return (
    <div className="space-y-6">
      {/* Action Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Indent:</span>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              onClick={() => {
                setIndent(2);
                setAction("format");
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                indent === 2 && action === "format"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              2 Spaces
            </button>
            <button
              onClick={() => {
                setIndent(4);
                setAction("format");
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                indent === 4 && action === "format"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              4 Spaces
            </button>
            <button
              onClick={() => {
                setIndent("\t");
                setAction("format");
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                indent === "\t" && action === "format"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tab
            </button>
          </div>

          <Button
            variant={action === "minify" ? "default" : "outline"}
            size="sm"
            onClick={() => setAction("minify")}
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>Minify</span>
          </Button>

          {action === "minify" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAction("format")}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span>Format</span>
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setInput(SAMPLE_JSON);
              setAction("format");
            }}
            title="Load sample JSON"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sample</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setInput("")}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>

          {output && <CopyButton text={output} size="sm" />}

          {output && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </Button>
          )}
        </div>
      </div>

      {/* Side-by-side or stacked editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Column */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Raw Input ({formatBytes(validation.byteSize)})</span>
            {validation.isValid ? (
              <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Valid JSON</span>
              </span>
            ) : input.trim() ? (
              <span className="flex items-center space-x-1 text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Invalid</span>
              </span>
            ) : null}
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            className="h-[420px] font-mono text-xs leading-relaxed"
          />
        </div>

        {/* Output Column */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Formatted Output</span>
            {output && <span>{formatBytes(new Blob([output]).size)}</span>}
          </div>
          <Textarea
            readOnly
            value={output}
            placeholder="Formatted JSON will appear here..."
            className="h-[420px] font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950/70"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-sm border border-red-200 dark:border-red-900 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
