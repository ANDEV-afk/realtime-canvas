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

const sanitizeRecord = (record: any) => {
  if (!record || typeof record !== "object") return record;
  if (record.typeName === "shape" && record.props && typeof record.props === "object") {
    const props = { ...record.props };
    if (props.richText && typeof props.richText === "object") {
      const { attrs, ...validRichText } = props.richText;
      props.richText = validRichText;
    }
    return { ...record, props };
  }
  return record;
};

// Modern Tldraw schema-compliant normalizer
const normalizeSnapshot = (
  snap: Record<string, unknown> | TLStoreSnapshot | unknown,
  editor: Editor
): any => {
  const snapData = snap as Record<string, unknown> | null | undefined;
  const currentSerializedSchema = editor.store.schema.serialize();

  // 1. Agar valid Tldraw snapshot format me store aur schema (ya schemaVersion) hai
  if (snapData && typeof snapData === "object") {
    const rawStore = snapData.store || (snapData.document && (snapData.document as any).store) || snapData;
    
    // Extracted records object or array normalize karna
    let storeRecords: Record<string, unknown> = {};
    if (Array.isArray(rawStore)) {
      rawStore.forEach((record: any) => {
        if (record && record.id) {
          storeRecords[record.id] = record;
        }
      });
    } else if (rawStore && typeof rawStore === "object") {
      storeRecords = rawStore as Record<string, unknown>;
    }

    return {
      schema: snapData.schema || currentSerializedSchema,
      store: storeRecords,
    };
  }

  // Fallback structure using active editor schema
  return {
    schema: currentSerializedSchema,
    store: {},
  };
};

export function useBoardPersistence({
  editor,
  boardId,
  initialSnapshot,
  debounceMs = 1000,
  isReadOnly = false,
}: UseBoardPersistenceOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isHydrated = useRef(false);

  // 1. Save Logic
  const saveNow = () => {
    if (!editor || isReadOnly) return;

    const snapshot = getSnapshot(editor.store);
    const plainSnapshot = JSON.parse(JSON.stringify(snapshot));

    saveBoardSnapshot(boardId, plainSnapshot);
  };

  // 2. Safe Restore Snapshot Logic
  useEffect(() => {
    if (!editor || isHydrated.current) return;

    if (initialSnapshot && Object.keys(initialSnapshot).length > 0) {
      try {
        const storeData = normalizeSnapshot(initialSnapshot, editor);
        editor.loadSnapshot(storeData);
      } catch (err) {
        console.error("[TLDRAW_LOAD_SNAPSHOT_FAILED]:", err);
        // Fallback using editor schema instead of rigid schemaVersion: 1
        try {
          editor.loadSnapshot({
            schema: editor.store.schema.serialize(),
            store: {},
          } as any);
        } catch (fallbackErr) {
          console.error("[TLDRAW_FALLBACK_FAILED]:", fallbackErr);
        }
      }
    }

    isHydrated.current = true;
  }, [editor, initialSnapshot]);

  // 3. Debounced Autosave Listener
  useEffect(() => {
    if (!editor) return;

    const cleanupListener = editor.store.listen(
      (entry) => {
        if (!isHydrated.current || entry.source !== "user") return;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(saveNow, debounceMs);
      },
      { scope: "document" }
    );

    return () => {
      cleanupListener();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveNow();
      }
    };
  }, [editor, boardId, debounceMs]);
}