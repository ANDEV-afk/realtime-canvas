"use client";

import { useState, useEffect } from "react";
import { useEditor } from "tldraw";
import { Copy, Check, Share2, Globe, Lock, Download, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ShareModalProps {
  boardId: string;
  initialAccessMode?: "editor" | "viewer";
  isOwner?: boolean;
}

export function ShareModal({ boardId, initialAccessMode = "editor", isOwner = false }: ShareModalProps) {
  const editor = useEditor();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"invite" | "export">("invite");
  const [accessMode, setAccessMode] = useState<"editor" | "viewer">(initialAccessMode);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Export settings
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [darkMode, setDarkMode] = useState(true);
  const [background, setBackground] = useState(true);

  useEffect(() => {
    setAccessMode(initialAccessMode);
  }, [initialAccessMode]);

  const handleAccessChange = async (newMode: "editor" | "viewer") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessMode: newMode }),
      });

      if (!res.ok) throw new Error("Failed to update access mode");

      setAccessMode(newMode);
      toast.success(`Board access updated to ${newMode}s only`);
    } catch (error) {
      console.error("Access update error:", error);
      toast.error("Failed to update access mode");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Board link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Failed to copy link");
    }
  };

  const handleExport = async () => {
    if (!editor) return;

    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      toast.error("Nothing to export.");
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
      toast.success(`Exported ${format.toUpperCase()} successfully`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export board");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-8 px-4 shadow-sm flex items-center gap-2 cursor-pointer">
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-4 z-[99999] bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl text-foreground space-y-4"
        sideOffset={12}
      >
        {/* Navigation Header Tabs */}
        <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("invite")}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "invite"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invite
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
          <div className="space-y-4">
            {isOwner && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Visitor Access Mode</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAccessChange("editor")}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      accessMode === "editor"
                        ? "bg-blue-500/10 border-blue-500 text-foreground shadow-sm"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-0.5">
                      <Globe className="h-3.5 w-3.5 text-blue-500" />
                      <span>Editor</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Can edit canvas</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAccessChange("viewer")}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      accessMode === "viewer"
                        ? "bg-amber-500/10 border-amber-500 text-foreground shadow-sm"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-0.5">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      <span>Viewer</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Read-only mode</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <Button
                onClick={handleCopyLink}
                className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-300" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: EXPORT */}
        {activeTab === "export" && (
          <div className="space-y-3 text-xs">
            {/* Format Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-muted-foreground font-medium">Format</span>
              <div className="flex bg-background border border-border/50 rounded-lg p-0.5 gap-1">
                {(["png", "svg"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md uppercase transition-all cursor-pointer ${
                      format === fmt
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-muted-foreground font-medium">Theme</span>
              <div className="flex bg-background border border-border/50 rounded-lg p-0.5 gap-1">
                <button
                  onClick={() => setDarkMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
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
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
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
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-muted-foreground font-medium">Canvas Background</span>
              <input
                type="checkbox"
                checked={background}
                onChange={(e) => setBackground(e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Download Button */}
            <Button
              onClick={handleExport}
              className="w-full mt-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export {format.toUpperCase()}</span>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
