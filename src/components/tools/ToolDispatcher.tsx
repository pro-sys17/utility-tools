"use client";

import * as React from "react";
import { ToolDefinition } from "@/lib/registry/types";
import { ToolShell } from "@/components/tool/ToolShell";
import { PdfViewerTool } from "./pdf/PdfViewerTool";
import { PdfEditorTool } from "./pdf/PdfEditorTool";
import { MergePdfTool } from "./pdf/MergePdfTool";
import { SplitPdfTool } from "./pdf/SplitPdfTool";
import { PdfCompressTool } from "./pdf/PdfCompressTool";
import { PdfToJpgTool } from "./pdf/PdfToJpgTool";
import { JpgToPdfTool } from "./pdf/JpgToPdfTool";
import { ZipCreatorTool } from "./archive/ZipCreatorTool";
import { ZipExtractorTool } from "./archive/ZipExtractorTool";
import { JsonFormatterTool } from "./text/JsonFormatterTool";
import { JsonValidatorTool } from "./text/JsonValidatorTool";
import { Base64Tool } from "./text/Base64Tool";
import { UuidGeneratorTool } from "./text/UuidGeneratorTool";
import { TextDiffTool } from "./text/TextDiffTool";
import { WordCounterTool } from "./text/WordCounterTool";
import { ImageCompressorTool } from "./image/ImageCompressorTool";
import { Clock } from "lucide-react";

export interface ToolDispatcherProps {
  tool: ToolDefinition;
}

export function ToolDispatcher({ tool }: ToolDispatcherProps) {
  const renderToolComponent = () => {
    switch (tool.slug) {
      case "pdf-viewer":
        return <PdfViewerTool />;
      case "pdf-editor":
        return <PdfEditorTool />;
      case "merge-pdf":
        return <MergePdfTool />;
      case "split-pdf":
        return <SplitPdfTool />;
      case "pdf-compress":
        return <PdfCompressTool />;
      case "pdf-to-jpg":
        return <PdfToJpgTool />;
      case "jpg-to-pdf":
        return <JpgToPdfTool />;
      case "zip-creator":
        return <ZipCreatorTool />;
      case "zip-extractor":
        return <ZipExtractorTool />;
      case "json-formatter":
        return <JsonFormatterTool />;
      case "json-validator":
        return <JsonValidatorTool />;
      case "base64-converter":
        return <Base64Tool />;
      case "uuid-generator":
        return <UuidGeneratorTool />;
      case "text-diff":
        return <TextDiffTool />;
      case "word-counter":
        return <WordCounterTool />;
      case "image-compressor":
        return <ImageCompressorTool />;
      default:
        return (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-blue-500 mb-3" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Tool Planned in Phase 2
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {tool.name} is registered in the architecture and scheduled for the next phase. Try our other active utilities in the {tool.category} category.
            </p>
          </div>
        );
    }
  };

  return <ToolShell tool={tool}>{renderToolComponent()}</ToolShell>;
}
