"use client";

import { useEffect, useRef } from "react";
import { type Editor, type TLStoreSnapshot, getSnapshot, loadSnapshot } from "tldraw";
import { saveBoardSnapshot } from "../actions/save-board-snapshot";

interface UseBoardPersistenceOptions {
  editor: Editor | null;
  boardId: string;
  initialSnapshot: TLStoreSnapshot | Record<string, unknown> | null | undefined;
  debounceMs?: number;
}

// !isHydrated.current: Board load hote time DB waley purane shapes load hone par nakli save trigger hone se rokta hai.

// entry.source !== "user": Zoom/Pan/Mouse hover hone par debounce timer reset hone se rokta hai.

export function useBoardPersistence({
  editor,
  boardId,
  initialSnapshot,
  debounceMs = 1000,
}: UseBoardPersistenceOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null); // timerRef is used to debounce the save
  const isHydrated = useRef(false); // isHydrated is used to check if the board is loaded

  // 1. Core Save Logic Helper
  const saveNow = () => {
    if (!editor) return;
  
    // 1. Extract the document state
    const { document } = getSnapshot(editor.store);
  
    // 2. Pure plain JSON Object banayein (Opaque references remove karne ke liye)
    const plainDocument = JSON.parse(JSON.stringify(document));
  
    // 3. Server action call
    saveBoardSnapshot(boardId, plainDocument);
  };

  // 2. Safe Restore Snapshot Logic
  useEffect(() => {
    if (!editor || isHydrated.current) return;

    // Direct object check taaki empty/malformed snapshot schema crash na kare
    if (initialSnapshot && Object.keys(initialSnapshot).length > 0) {
      try {
        // Safe loading method: document object wrapped properly
        editor.loadSnapshot({document: initialSnapshot as unknown as TLStoreSnapshot});
      } catch (err) {
        console.error("[TLDRAW_LOAD_SNAPSHOT_FAILED]:", err);
      }
    }

    isHydrated.current = true; // Board load hone par true karo
  }, [editor, initialSnapshot]);

  // 3. Debounced Autosave Listener
  useEffect(() => {
    if (!editor) return;

    const cleanupListener = editor.store.listen( // listen to the store for changes
      (entry) => {
        // Hydration phase aur transient session changes ignore karo
        if (!isHydrated.current || entry.source !== "user") return;

        if (timerRef.current) clearTimeout(timerRef.current); // clear the timeout if it exists
        timerRef.current = setTimeout(saveNow, debounceMs); // set the timeout to save the board snapshot
      },
      { scope: "document" } // Camera/zoom/pointer moves filtering
    );

    // 4. Cleanup & Flush Pending Save on Unmount (Page leave karne par last change lose na ho)
    return () => {
      cleanupListener();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveNow(); // Page leave karne par last change lose na ho
      }
    };
  }, [editor, boardId, debounceMs]);
}