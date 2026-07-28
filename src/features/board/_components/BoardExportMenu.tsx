"use client";

import { useState } from "react";
import { Download, Image as ImageIcon, FileCode, Loader2 } from "lucide-react";
import { useBoardExport } from "@/hooks/useBoardExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface BoardExportMenuProps {
  boardTitle?: string;
  trigger?: React.ReactNode;
}

export function BoardExportMenu({boardTitle = "whiteboard",trigger}: BoardExportMenuProps) {
  const { exportImage, exportJSON } = useBoardExport();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAction = async (e: React.MouseEvent,action: () => Promise<unknown> | unknown) => {
    // Prevent dropdown from closing abruptly while exporting
    e.preventDefault();
    if (isExporting) return;

    setIsExporting(true);
    try {
      await action();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer">
            <Download className="h-4 w-4 text-zinc-400" />
            <span>Export Board</span>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl p-1.5 shadow-2xl z-[99999]"
      >
        <DropdownMenuLabel className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
          Export Canvas
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800 my-1" />

        {/* PNG Export */}
        <DropdownMenuItem
          disabled={isExporting}
          onClick={(e) =>
            handleExportAction(e, () => exportImage(boardTitle, "png"))
          }
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <ImageIcon className="h-4 w-4 text-blue-400" />
          )}
          <span>Export as PNG</span>
        </DropdownMenuItem>

        {/* SVG Export */}
        <DropdownMenuItem
          disabled={isExporting}
          onClick={(e) =>
            handleExportAction(e, () => exportImage(boardTitle, "svg"))
          }
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <ImageIcon className="h-4 w-4 text-emerald-400" />
          )}
          <span>Export as SVG</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-zinc-800 my-1" />

        {/* JSON Backup Export */}
        <DropdownMenuItem
          disabled={isExporting}
          onClick={(e) => handleExportAction(e, () => exportJSON(boardTitle))}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />) : 
            (
            <FileCode className="h-4 w-4 text-amber-400" />
          )}
          <span>Export Project (.tldraw)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}