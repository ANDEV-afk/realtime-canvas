"use client";

import { useEffect } from "react";
import { useEditor, useValue, type TLEventInfo } from "tldraw";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";

/**
 * Mount this as a CHILD of <Tldraw>. It must live inside the tldraw context
 * so it can access the real `Editor` instance via useEditor().
 *
 * Perf notes:
 * - Cursor position updates are throttled with requestAnimationFrame so we
 *   broadcast at most once per frame instead of on every raw pointer event.
 * - Selection uses tldraw's reactive signals via useValue (cheap).
 */
export function PresenceSync() {
  const editor = useEditor();
  const updateMyPresence = useUpdateMyPresence();

  // --- Cursor position (throttled to animation frames) ---
  useEffect(() => {
    let rafId: number | null = null;
    let pending: { x: number; y: number } | null = null;
    let lastSent = 0;

    function flush() {
      rafId = null;
      if (!pending) return;
      const now = performance.now();
      // Cap broadcast rate at ~33fps to keep realtime traffic light
      if (now - lastSent < 30) return;
      lastSent = now;
      updateMyPresence({ cursor: pending });
      pending = null;
    }

    function handleEvent(info: TLEventInfo) {
      if (info.name !== "pointer_move" && info.name !== "pointer_down") return;
      const { x, y } = editor.inputs.currentPagePoint;
      pending = { x, y };
      if (rafId === null) {
        rafId = requestAnimationFrame(flush);
      }
    }

    editor.on("event", handleEvent);

    // Clear cursor when it leaves the canvas / tab loses focus
    function handlePointerLeave() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pending = null;
      updateMyPresence({ cursor: null });
    }
    const container = editor.getContainer();
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      editor.off("event", handleEvent);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [editor, updateMyPresence]);

  // --- Selection (reactive signal, cheap) ---
  const selectedShapeIds = useValue("selectedShapeIds", () => editor.getSelectedShapeIds(), [editor]);

  useEffect(() => {
    updateMyPresence({ selection: selectedShapeIds });
  }, [selectedShapeIds, updateMyPresence]);

  return null;
}
