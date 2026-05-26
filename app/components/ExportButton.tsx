"use client";

import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { RefObject } from "react";
import { toast } from "sonner";
import { copyMapToClipboard, exportMapAsPNG } from "../utils/mapExport";

interface ExportButtonProps {
  svgRef: RefObject<SVGSVGElement | null>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ svgRef }) => {
  const handleExportMap = async () => {
    if (!svgRef.current) {
      toast.error("Map not ready for export. Please try again.");
      return;
    }

    try {
      await exportMapAsPNG(svgRef.current);
      toast.success("Map exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export map. Please try again.");
    }
  };

  const handleCopyToClipboard = async () => {
    if (!svgRef.current) {
      toast.error("Map not ready for copying. Please try again.");
      return;
    }

    try {
      await copyMapToClipboard(svgRef.current);
      toast.success("Map copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
      if (
        error instanceof Error &&
        error.message.includes("Clipboard not supported")
      ) {
        toast.info("Clipboard not supported. Map downloaded instead!");
      } else {
        toast.error(
          "Failed to copy to clipboard. Try the download option instead.",
        );
      }
    }
  };

  const controlClass =
    "bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md cursor-pointer";

  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2">
      <Button
        onClick={handleCopyToClipboard}
        variant="outline"
        size="sm"
        className={`${controlClass} flex items-center gap-2`}
      >
        <Copy className="w-4 h-4" />
        Copy
      </Button>
      <Button
        onClick={handleExportMap}
        variant="outline"
        size="sm"
        className={`${controlClass} flex items-center gap-2`}
      >
        <Download className="w-4 h-4" />
        Export
      </Button>
    </div>
  );
};
