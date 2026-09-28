"use client";

import * as React from "react";
import { Button } from "@/components/common/Button";
import { CopyButton } from "@/components/common/CopyButton";
import { Textarea } from "@/components/common/Input";
import { encodeBase64Text, decodeBase64Text } from "@/lib/text/text-utils";
import { downloadText } from "@/lib/file/download-utils";
import { FileDropzone } from "@/components/file/FileDropzone";
import { ArrowLeftRight, Download, RotateCcw, AlertCircle, Binary } from "lucide-react";

export function Base64Tool() {
  const [activeTab, setActiveTab] = React.useState<"text" | "file">("text");
  const [direction, setDirection] = React.useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = React.useState(false);

  // Text mode state
  const [textInput, setTextInput] = React.useState("Hello from UtilityHub! 🚀");

  // File mode state
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [fileBase64Output, setFileBase64Output] = React.useState("");
  const [fileError, setFileError] = React.useState<string | null>(null);

  // Derive text conversion directly without setState in effect
  const { textOutput, error } = React.useMemo(() => {
    if (!textInput) {
      return { textOutput: "", error: null };
    }
    try {
      if (direction === "encode") {
        return { textOutput: encodeBase64Text(textInput, urlSafe), error: null };
      } else {
        return { textOutput: decodeBase64Text(textInput), error: null };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid Base64 sequence";
      return { textOutput: "", error: `Base64 decode failed: ${message}` };
    }
  }, [textInput, direction, urlSafe]);

  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setUploadedFile(file);
    setFileError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64Output(result);
    };
    reader.onerror = () => {
      setFileError("Failed to read uploaded file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSwap = () => {
    setDirection((d) => (d === "encode" ? "decode" : "encode"));
    setTextInput(textOutput || textInput);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab("text")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "text"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Text & String Base64
        </button>
        <button
          onClick={() => setActiveTab("file")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "file"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          File to Base64 (Data URL)
        </button>
      </div>

      {activeTab === "text" ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                <button
                  onClick={() => setDirection("encode")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    direction === "encode"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Encode
                </button>
                <button
                  onClick={() => setDirection("decode")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    direction === "decode"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Decode
                </button>
              </div>

              {direction === "encode" && (
                <label className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 ml-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={urlSafe}
                    onChange={(e) => setUrlSafe(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>URL-Safe (- and _)</span>
                </label>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwap}
                title="Swap input and output"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Swap</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setTextInput("")}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Button>

              {textOutput && <CopyButton text={textOutput} size="sm" />}

              {textOutput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText(textOutput, "output.txt")}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Save</span>
                </Button>
              )}
            </div>
          </div>

          {/* Editors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                {direction === "encode" ? "Input String (UTF-8)" : "Base64 Input"}
              </label>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={direction === "encode" ? "Type or paste text..." : "Paste Base64..."}
                className="h-[320px] font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                {direction === "encode" ? "Base64 Output" : "Decoded Text"}
              </label>
              <Textarea
                readOnly
                value={textOutput}
                placeholder="Result will appear here..."
                className="h-[320px] font-mono text-xs bg-slate-50 dark:bg-slate-950/70"
              />
            </div>
          </div>
        </div>
      ) : (
        /* File Mode */
        <div className="space-y-4">
          {!uploadedFile ? (
            <FileDropzone
              onFilesSelected={handleFileUpload}
              acceptedTypes={["*/*"]}
              multiple={false}
              title="Select any file to encode to Base64"
              subtitle="Generates Data URL ready to embed in HTML, CSS, or JSON"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Binary className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {uploadedFile.type || "binary"} ({uploadedFile.size} bytes)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <CopyButton text={fileBase64Output} size="sm" label="Copy Base64" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                      setFileBase64Output("");
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Change File</span>
                  </Button>
                </div>
              </div>

              <Textarea
                readOnly
                value={fileBase64Output}
                className="h-[280px] font-mono text-xs bg-slate-50 dark:bg-slate-950/70"
              />
            </div>
          )}
        </div>
      )}

      {(error || fileError) && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-sm border border-red-200 dark:border-red-900 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error || fileError}</span>
        </div>
      )}
    </div>
  );
}
