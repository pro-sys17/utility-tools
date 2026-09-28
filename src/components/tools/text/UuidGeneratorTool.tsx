"use client";

import * as React from "react";
import { Button } from "@/components/common/Button";
import { CopyButton } from "@/components/common/CopyButton";
import { Textarea, Input } from "@/components/common/Input";
import { generateUuids } from "@/lib/text/text-utils";
import { downloadText } from "@/lib/file/download-utils";
import { RefreshCw, Download } from "lucide-react";

export function UuidGeneratorTool() {
  const [count, setCount] = React.useState<number>(5);
  const [uppercase, setUppercase] = React.useState<boolean>(false);
  const [hyphens, setHyphens] = React.useState<boolean>(true);
  const [version, setVersion] = React.useState<"v4" | "nil">("v4");
  const [uuids, setUuids] = React.useState<string[]>(() =>
    generateUuids(5, { uppercase: false, hyphens: true, version: "v4" })
  );

  const handleGenerate = (
    c: number = count,
    uc: boolean = uppercase,
    hy: boolean = hyphens,
    v: "v4" | "nil" = version
  ) => {
    const list = generateUuids(c, { uppercase: uc, hyphens: hy, version: v });
    setUuids(list);
  };

  const outputString = uuids.join("\n");

  return (
    <div className="space-y-6">
      {/* Config Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Quantity (1 - 1000)
            </label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => {
                const val = Math.min(1000, Math.max(1, parseInt(e.target.value) || 1));
                setCount(val);
                handleGenerate(val, uppercase, hyphens, version);
              }}
              className="h-9"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Version
            </label>
            <select
              value={version}
              onChange={(e) => {
                const v = e.target.value as "v4" | "nil";
                setVersion(v);
                handleGenerate(count, uppercase, hyphens, v);
              }}
              className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="v4">Version 4 (Cryptographically Random)</option>
              <option value="nil">Nil UUID (All zeros)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hyphens}
                onChange={(e) => {
                  const h = e.target.checked;
                  setHyphens(h);
                  handleGenerate(count, uppercase, h, version);
                }}
                className="rounded text-blue-600"
              />
              <span>Include Hyphens</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => {
                  const u = e.target.checked;
                  setUppercase(u);
                  handleGenerate(count, u, hyphens, version);
                }}
                className="rounded text-blue-600"
              />
              <span>Uppercase Letters</span>
            </label>
          </div>

          <div className="flex items-end">
            <Button size="md" className="w-full" onClick={() => handleGenerate()}>
              <RefreshCw className="h-4 w-4" />
              <span>Regenerate</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Output Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Generated {uuids.length} UUIDs (Web Crypto API)</span>
          <div className="flex items-center space-x-2">
            <CopyButton text={outputString} size="sm" label="Copy All" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadText(outputString, "uuids.txt")}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        <Textarea
          readOnly
          value={outputString}
          className="h-[320px] font-mono text-sm leading-loose bg-slate-50 dark:bg-slate-950/70"
        />
      </div>
    </div>
  );
}
