"use client";

import { useState } from "react";
import { useEditor } from "tldraw";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Copy, Check, Download, Share2, Sun, Moon } from "lucide-react";

interface ShareModalProps {
  boardId?: string;
}

export const ShareModal = ({ boardId }: ShareModalProps) => {
  const editor = useEditor();
  const [activeTab, setActiveTab] = useState<"invite" | "export">("invite");
  const [copied, setCopied] = useState(false);

  // Export Settings
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [darkMode, setDarkMode] = useState(true);
  const [background, setBackground] = useState(true);

  // Copy Exact Board URL
  const handleCopy = async () => {
    try {
      // Direct full URL without modifying route structure
      const currentUrl = window.location.href;

      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Export Handler (Official tldraw API)
  const handleExport = async () => {
    if (!editor) return;

    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      alert("Nothing to export.");
      return;
    }

    try {
      const imageResult = await editor.toImage(shapeIds, {
        format,
        scale: 2,
        background,
        darkMode,
      });

      if (!imageResult) return;

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(imageResult.blob);
      downloadLink.download = `whiteboard.${format}`;
      downloadLink.click();
      URL.revokeObjectURL(downloadLink.href);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-2 active:scale-95">
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-3.5 z-[99999] bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl text-foreground"
        sideOffset={15}
      >
        {/* Navigation Header Tabs */}
        <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl mb-3.5 gap-1">
          <button
            onClick={() => setActiveTab("invite")}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "invite"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invite
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "export"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Export
          </button>
        </div>

        {/* TAB 1: INVITE */}
        {activeTab === "invite" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="font-medium text-muted-foreground">Access</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-500 font-semibold px-2 py-0.5 rounded-md border border-blue-500/20">
                Anyone with link
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-300" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
          </div>
        )}

        {/* TAB 2: EXPORT */}
        {activeTab === "export" && (
          <div className="space-y-2.5 text-xs">
            {/* Format Toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground font-medium">Format</span>
              <div className="flex bg-background border border-border/50 rounded-md p-0.5 gap-1">
                {(["png", "svg"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded uppercase transition-all ${
                      format === fmt
                        ? "bg-blue-600 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Segmented Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60">
              <span className="text-muted-foreground font-medium">Theme</span>
              <div className="flex bg-background border border-border/60 rounded-lg p-0.5 gap-1">
                <button
                  onClick={() => setDarkMode(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    darkMode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="h-3 w-3" />
                  Dark
                </button>
                <button
                  onClick={() => setDarkMode(false)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    !darkMode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="h-3 w-3" />
                  Light
                </button>
              </div>
            </div>

            {/* Background Checkbox */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground font-medium">Canvas Background</span>
              <input
                type="checkbox"
                checked={background}
                onChange={(e) => setBackground(e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Download Button */}
            <button
              onClick={handleExport}
              className="w-full mt-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export {format.toUpperCase()}</span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};