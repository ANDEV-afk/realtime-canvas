"use client";

import { useEffect, useRef } from "react";
import { type Editor, type TLStoreSnapshot, getSnapshot } from "tldraw";
import { saveBoardSnapshot } from "../actions/save-board-snapshot";

interface UseBoardPersistenceOptions {
  editor: Editor | null;
  boardId: string;
  initialSnapshot: TLStoreSnapshot | Record<string, unknown> | null | undefined;
  debounceMs?: number;
  isReadOnly?: boolean;
}

// !isHydrated.current: Board load hote time DB waley purane shapes load hone par nakli save trigger hone se rokta hai.

// entry.source !== "user": Zoom/Pan/Mouse hover hone par debounce timer reset hone se rokta hai.

// Helper->
// Multiple sources (DB, initial snapshot, API response) se JSON structure thoda transform ho sakta hai. Kabhi snapshot direct object hota hai, kabhi usme .store wrapped hota hai, toh kabhi .document.store.

//Ye function kisi bhi raw/malformed JSON structure ko clean TLStoreSnapshot format (jiske paas schemaVersion aur store objects hote hain) me convert/standardize karta hai, taaki Tldraw crashes na hon.

const normalizeSnapshot = (snap: Record<string, unknown> | TLStoreSnapshot | unknown): TLStoreSnapshot => {
  const snapData = snap as Record<string, unknown> | null | undefined;
  if (snapData?.store && snapData?.schemaVersion) return snapData as unknown as TLStoreSnapshot;
  if (snapData?.document && typeof snapData.document === "object" && "store" in (snapData.document as Record<string, unknown>)) {
    return (snapData.document as Record<string, unknown>) as unknown as TLStoreSnapshot;
  }

  // Fallback for raw arrays or unknown object structures
  const records = Array.isArray(snap)? snap: Object.entries(snap || {}) // if the snapshot is an array, return the array, otherwise return the object entries
        .filter(([k]) => k !== "schemaVersion" && k !== "version") // filter out the schemaVersion and version
        .map(([, v]) => v); // map the object entries to an array

  return {
    schemaVersion: typeof snapData?.schemaVersion === "number" ? snapData.schemaVersion : 1,
    store: records,
  } as unknown as TLStoreSnapshot; // return the snapshot in the TLStoreSnapshot format
};

export function useBoardPersistence({
  editor,
  boardId,
  initialSnapshot,
  debounceMs = 1000,
  isReadOnly = false, // isReadOnly is used to check if the board is read only
}: UseBoardPersistenceOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null); // timerRef is used to debounce the save
  const isHydrated = useRef(false); // isHydrated is used to check if the board is loaded

  // 1. Core Save Logic Helper
  const saveNow = () => {
    if (!editor || isReadOnly) return; // if the editor is not present or the board is read only, return
  
    // 1. Get snapshot from store
    const snapshot = getSnapshot(editor.store); // get the snapshot from the store
  
    // 2. Pure plain JSON Object
    const plainSnapshot = JSON.parse(JSON.stringify(snapshot)); // parse the snapshot to a pure plain JSON Object
  
    // 3. Server action call
    saveBoardSnapshot(boardId, plainSnapshot);
  };

  // 2. Safe Restore Snapshot Logic
  useEffect(() => {
    if (!editor || isHydrated.current) return;

    if (initialSnapshot && Object.keys(initialSnapshot).length > 0) {
      try {
        const storeData = normalizeSnapshot(initialSnapshot);
        editor.loadSnapshot(storeData);
      } catch (err) {
        console.error("[TLDRAW_LOAD_SNAPSHOT_FAILED]:", err);
        // Fallback to an empty board gracefully
        editor.loadSnapshot({ schemaVersion: 1, store: {} } as unknown as TLStoreSnapshot);
      }
    }

    isHydrated.current = true;
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