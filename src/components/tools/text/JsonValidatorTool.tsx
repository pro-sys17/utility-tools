"use client";

import * as React from "react";
import { Button } from "@/components/common/Button";
import { CopyButton } from "@/components/common/CopyButton";
import { Textarea } from "@/components/common/Input";
import { validateJson } from "@/lib/text/json-utils";
import { downloadText } from "@/lib/file/download-utils";
import { formatBytes } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Sparkles, RotateCcw, Download } from "lucide-react";

const VALID_SAMPLE = `{
  "status": "success",
  "data": {
    "userId": 10492,
    "email": "user@utilityhub.dev",
    "verified": true,
    "tags": ["developer", "security", "open-source"]
  }
}`;

const BROKEN_SAMPLE = `{
  "status": "error",
  'singleQuotes': true,
  "trailingComma": 123,
}`;

export function JsonValidatorTool() {
  const [input, setInput] = React.useState<string>(VALID_SAMPLE);

  const validation = React.useMemo(() => {
    return validateJson(input);
  }, [input]);

  const handleFixCommonIssues = () => {
    let fixed = input;
    // Replace single quotes with double quotes around keys/values
    fixed = fixed.replace(/'([^']+)'/g, '"$1"');
    // Remove trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, "$1");
    setInput(fixed);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInput(VALID_SAMPLE)}
            title="Load valid JSON"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Valid Sample</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInput(BROKEN_SAMPLE)}
            title="Load broken JSON to test validator"
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <span>Test Broken JSON</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setInput("")}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {!validation.isValid && input.trim() && (
            <Button variant="secondary" size="sm" onClick={handleFixCommonIssues}>
              Auto-fix common mistakes
            </Button>
          )}

          {input.trim() && <CopyButton text={input} size="sm" />}

          {input.trim() && validation.isValid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadText(input, "valid.json", "application/json")}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </Button>
          )}
        </div>
      </div>

      {/* Editor & Diagnostics */}
      <div className="space-y-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste JSON to validate according to RFC 8259..."
          className="h-[380px] font-mono text-xs leading-relaxed"
        />

        {/* Validation Status Banner */}
        {input.trim() && (
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              validation.isValid
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200"
                : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/80 text-red-800 dark:text-red-200"
            }`}
          >
            <div className="flex items-start space-x-3">
              {validation.isValid ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm sm:text-base">
                  {validation.isValid ? "Valid JSON Syntax (RFC 8259 Compliant)" : "Syntax Error Detected"}
                </h4>
                <p className="text-xs mt-1 opacity-90">
                  {validation.isValid
                    ? `Successfully parsed. Total size: ${formatBytes(validation.byteSize)}. Root keys/elements: ${validation.keyCount}.`
                    : validation.error}
                </p>

                {!validation.isValid && validation.line && (
                  <div className="mt-2 inline-flex items-center space-x-2 text-xs font-mono bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 rounded-md border border-red-300 dark:border-red-900">
                    <span>Line: {validation.line}</span>
                    <span>Column: {validation.column}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
