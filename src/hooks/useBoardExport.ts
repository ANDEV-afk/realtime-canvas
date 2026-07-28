"use client";

import { useEditor } from "tldraw";
import { toast } from "sonner";

export function useBoardExport() {
  const editor = useEditor();

  const getSafeTitle = (title: string) =>title.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "whiteboard";

  // Helper function to handle browser downloads reliably
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Image Export (PNG & SVG)
  const exportImage = async (boardTitle: string = "whiteboard",format: "png" | "svg" = "png") => {
    if (!editor) return toast.error("Editor not ready");

    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) return toast.error("Canvas is empty!");

    try {
      // toImage takes only 2 arguments: (shapeIds, options)
      const imageResult = await editor.toImage(shapeIds, {
        format: format,
        scale: 2,
        background: true,
      });

      if (!imageResult) throw new Error("Failed to generate image export");

      const safeTitle = getSafeTitle(boardTitle);
      triggerDownload(imageResult.blob, `${safeTitle}.${format}`);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export Image Error:", error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  // 2. JSON Backup (.tldraw)
  const exportJSON = (boardTitle: string = "whiteboard") => {
    if (!editor) return toast.error("Editor not ready");

    try {
      const snapshot = editor.getSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });

      const safeTitle = getSafeTitle(boardTitle);
      triggerDownload(blob, `${safeTitle}.tldraw`);

      toast.success("Project downloaded (.tldraw)");
    } catch (error) {
      console.error("Export JSON Error:", error);
      toast.error("Failed to export JSON");
    }
  };

  return { exportImage, exportJSON };
}