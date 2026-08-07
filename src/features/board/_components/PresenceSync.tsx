"use client";

import { useEffect } from "react";
import { useEditor, useValue, type TLEventInfo } from "tldraw";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";

/**
 * Mount this as a CHILD of <Tldraw>. It must live inside the tldraw context
 * so it can access the real `Editor` instance via useEditor().
 *
 * Why not `store.listen()` on the "pointer" record (old approach)?
 * tldraw updates the pointer/instance session records on a high-frequency,
 * perf-optimized path that does not reliably surface through the normal
 * store change-listener diff. The supported way to react to pointer motion
 * is `editor.on("event", ...)`, which fires for every real input event
 * ("pointer_move", "pointer_down", etc.) regardless of how the store
 * internally batches session state.
 */
export function PresenceSync() {
  const editor = useEditor();
  const updateMyPresence = useUpdateMyPresence();

  // --- Cursor position ---
  useEffect(() => {
    function handleEvent(info: TLEventInfo) {
      if (info.name !== "pointer_move" && info.name !== "pointer_down") return;
      const { x, y } = editor.inputs.currentPagePoint;
      updateMyPresence({ cursor: { x, y } });
    }

    editor.on("event", handleEvent);

    // Clear cursor when it leaves the canvas / tab loses focus
    function handlePointerLeave() {
      updateMyPresence({ cursor: null });
    }
    const container = editor.getContainer();
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      editor.off("event", handleEvent);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [editor, updateMyPresence]);

  // --- Selection (this DOES go through the normal store/reactive signals,
  // so useValue works fine here) ---
  const selectedShapeIds = useValue(
    "selectedShapeIds",
    () => editor.getSelectedShapeIds(),
    [editor]
  );

  useEffect(() => {
    updateMyPresence({ selection: selectedShapeIds });
  }, [selectedShapeIds, updateMyPresence]);

  return null;
}