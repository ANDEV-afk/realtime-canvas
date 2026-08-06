import { useEffect, useState } from "react";
import { useRoom, useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";
import { customAssetStore } from "@/lib/upload-asset";
import {
  createTLStore,
  defaultShapeUtils,
  DocumentRecordType,
  PageRecordType,
  InstancePresenceRecordType,
  IndexKey,
  TLAnyShapeUtilConstructor,
  TLDocument,
  TLPageId,
  TLRecord,
  TLStoreEventInfo,
  TLStoreWithStatus,
  TLUser,
  UserRecordType,
  TLINSTANCE_ID,
  TLPOINTER_ID,
} from "tldraw";

// Helper function to sanitize records and satisfy Tldraw strict schema validation
function sanitizeRecord(record: TLRecord): TLRecord {
  if (record.typeName === "instance") {
    // Remove obsolete properties that throw "Unexpected property" in newer tldraw versions
    const {
      isSnapMode,
      isPenMode,
      isHandMode,
      isDarkMode,
      isChatting,
      highlightedUserIds,
      ...cleanInstance
    } = record as Record<string, unknown>;

    return {
      ...cleanInstance,
      openMenus: Array.isArray(cleanInstance.openMenus) ? cleanInstance.openMenus : [],
      chatMessage: typeof cleanInstance.chatMessage === "string" ? cleanInstance.chatMessage : "",
      isFocusMode: typeof cleanInstance.isFocusMode === "boolean" ? cleanInstance.isFocusMode : false,
      isGridMode: typeof cleanInstance.isGridMode === "boolean" ? cleanInstance.isGridMode : false,
      isToolLocked: typeof cleanInstance.isToolLocked === "boolean" ? cleanInstance.isToolLocked : false,
      isFocused: typeof cleanInstance.isFocused === "boolean" ? cleanInstance.isFocused : true,
      isReadonly: typeof cleanInstance.isReadonly === "boolean" ? cleanInstance.isReadonly : false,
      isCoarsePointer: typeof cleanInstance.isCoarsePointer === "boolean" ? cleanInstance.isCoarsePointer : false,
      isHoveringCanvas: typeof cleanInstance.isHoveringCanvas === "boolean" ? cleanInstance.isHoveringCanvas : true,
      devicePixelRatio: typeof cleanInstance.devicePixelRatio === "number" ? cleanInstance.devicePixelRatio : 1,
      insets: Array.isArray(cleanInstance.insets) ? cleanInstance.insets : [],
      zoomBrush: cleanInstance.zoomBrush !== undefined ? cleanInstance.zoomBrush : null,
      scribbles: Array.isArray(cleanInstance.scribbles) ? cleanInstance.scribbles : [],
    } as unknown as TLRecord;
  }

  if (record.typeName === "asset" && record.props && typeof record.props === "object") {
    const props = record.props as Record<string, unknown>;
    return {
      ...record,
      props: {
        ...props,
        src: record.type === "bookmark" ? undefined : (props.src || props.url || ""),
      },
    } as unknown as TLRecord;
  }

  return record;
}

export function useStorageStore({
  shapeUtils = [],
  user,
  isReadOnly,
}: Partial<{
  hostUrl: string;
  version: number;
  shapeUtils: TLAnyShapeUtilConstructor[];
  user: {
    id: string;
    color: string;
    name: string;
  };
  isReadOnly: boolean;
}>) {
  const room = useRoom();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const [store] = useState(() => {
    return createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
      assets: customAssetStore,
    });
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  // 1. Broadcast local pointer movement to Liveblocks Presence
  useEffect(() => {
    if (!store) return;

    const unsub = store.listen((changes) => {
      for (const record of Object.values(changes.changes.added)) {
        if (record.typeName === "instance" && (record as any).cursor) {
          const cursor = (record as any).cursor;
          if (cursor && typeof cursor.x === "number" && typeof cursor.y === "number") {
            updateMyPresence({ cursor: { x: cursor.x, y: cursor.y } });
          }
        }
      }
      for (const [, to] of Object.values(changes.changes.updated)) {
        if (to.typeName === "instance" && (to as any).cursor) {
          const cursor = (to as any).cursor;
          if (cursor && typeof cursor.x === "number" && typeof cursor.y === "number") {
            updateMyPresence({ cursor: { x: cursor.x, y: cursor.y } });
          }
        }
      }
    }, { scope: "session" });

    return () => {
      unsub();
    };
  }, [store, updateMyPresence]);

  // 2. Sync remote cursors from Liveblocks others presence into tldraw store instance_presence
  useEffect(() => {
    if (!store) return;

    const presenceRecords: TLRecord[] = [];
    const activePresenceIds = new Set<string>();

    for (const other of others) {
      const presence = other.presence as {
        cursor?: { x?: number; y?: number } | null;
      };

      // Strict validation for x and y numbers
      if (
        !presence ||
        !presence.cursor ||
        typeof presence.cursor.x !== "number" ||
        typeof presence.cursor.y !== "number"
      ) {
        continue;
      }

      const presenceId = InstancePresenceRecordType.createId(`${other.connectionId}`);
      activePresenceIds.add(presenceId);

      const presenceRecord = InstancePresenceRecordType.create({
        id: presenceId,
        userId: (`user:${other.connectionId}`) as TLUser["id"],
        userName: other.info?.name || "Guest",
        color: other.info?.color || "#3b82f6",
        currentPageId: "page:page" as TLPageId,
        cursor: {
          x: presence.cursor.x,
          y: presence.cursor.y,
          type: "default",
          rotation: 0,
        },
        brush: null,
        scribbles: [],
        followingUserId: null,
        chatMessage: "",
        selectedShapeIds: [],
        lastActivityTimestamp: Date.now(),
      });

      presenceRecords.push(presenceRecord as unknown as TLRecord);
    }

    if (presenceRecords.length > 0) {
      store.put(presenceRecords);
    }

    // Remove disconnected users' presences
    const existingPresences = store
      .allRecords()
      .filter((r) => r.typeName === "instance_presence" && r.id.startsWith("instance_presence:"));

    const toRemove = existingPresences
      .filter((r) => !activePresenceIds.has(r.id as string))
      .map((r) => r.id);

    if (toRemove.length > 0) {
      store.remove(toRemove as any);
    }
  }, [store, others]);

  // 3. Storage and record synchronization setup
  useEffect(() => {
    let isMounted = true;
    const unsubs: (() => void)[] = [];

    async function setup() {
      const { root } = await room.getStorage();
      if (!isMounted) return;

      let liveRecords = root.get("records") as any;
      if (!liveRecords) {
        root.set("records", new LiveMap());
        liveRecords = root.get("records") as any;
      }

      const pageId = "page:page" as TLPageId;
      const recordsToPut: TLRecord[] = [];
      const userId = "user:user" as TLUser["id"];

      if (!store.has("document:document" as TLDocument["id"])) {
        recordsToPut.push(
          DocumentRecordType.create({
            id: "document:document" as TLDocument["id"],
          })
        );
      }

      if (!store.has(pageId)) {
        recordsToPut.push(
          PageRecordType.create({
            id: pageId,
            name: "Page 1",
            index: "a1" as IndexKey,
          })
        );
      }

      const storedLiveRecords = Array.from(liveRecords.values())
        .filter((record: any) => record && record.id !== TLINSTANCE_ID && record.id !== TLPOINTER_ID && record.id !== userId && record.typeName !== "instance_presence")
        .map((record: any) => sanitizeRecord(record));

      recordsToPut.push(...storedLiveRecords);

      if (store.has(TLINSTANCE_ID)) {
        store.update(TLINSTANCE_ID, (record: any) => {
          return sanitizeRecord({
            ...record,
            isReadonly: !!isReadOnly,
          } as TLRecord) as any;
        });
      } else {
        recordsToPut.push(
          sanitizeRecord({
            id: TLINSTANCE_ID,
            typeName: "instance",
            currentPageId: pageId,
            followingUserId: null,
            brush: null,
            cursor: { type: "default", rotation: 0 },
            scribbles: [],
            opacityForNextShape: 1,
            stylesForNextShape: {},
            screenBounds: { x: 0, y: 0, w: 1080, h: 720 },
            zoomLevel: 1,
            isFocusMode: false,
            isGridMode: false,
            isToolLocked: false,
            isFocused: true,
            exportBackground: true,
            isDebugMode: false,
            isReadonly: !!isReadOnly,
            openMenus: [],
            screenCenter: { x: 540, y: 360 },
            pageStates: {},
            insets: [],
            zoomBrush: null,
            devicePixelRatio: 1,
          } as unknown as TLRecord)
        );
      }

      if (!store.has(TLPOINTER_ID)) {
        recordsToPut.push({
          id: TLPOINTER_ID,
          typeName: "pointer",
          target: "canvas",
          pointerId: 1,
          point: { x: 0, y: 0 },
          lastPoint: { x: 0, y: 0 },
          isDown: false,
          isPen: false,
          isEraser: false,
        } as unknown as TLRecord);
      }

      if (!store.has(userId)) {
        recordsToPut.push(
          UserRecordType.create({
            id: userId,
            name: user?.name || "Anonymous",
            color: user?.color || "#3b82f6",
          })
        );
      }

      store.put(recordsToPut, "initialize");

      const unsubscribeLocal = store.listen(
        (changes: TLStoreEventInfo) => {
          if (!isMounted) return;
          if (changes.source === "remote") return;

          room.batch(() => {
            for (const record of Object.values(changes.changes.added)) {
              if (record.id === TLINSTANCE_ID || record.id === TLPOINTER_ID || record.id === userId || record.typeName === "instance_presence") continue;
              liveRecords.set(record.id, record);
            }
            for (const [, to] of Object.values(changes.changes.updated)) {
              if (to.id === TLINSTANCE_ID || to.id === TLPOINTER_ID || to.id === userId || to.typeName === "instance_presence") continue;
              liveRecords.set(to.id, to);
            }
            for (const record of Object.values(changes.changes.removed)) {
              if (record.id === TLINSTANCE_ID || record.id === TLPOINTER_ID || record.id === userId || record.typeName === "instance_presence") continue;
              liveRecords.delete(record.id);
            }
          });
        },
        { scope: "document" }
      );

      unsubs.push(unsubscribeLocal);

      const unsubStorage = room.subscribe(
        liveRecords,
        () => {
          if (!isMounted) return;

          const currentRemoteRecords = Array.from(liveRecords.values()).filter(Boolean);

          store.mergeRemoteChanges(() => {
            const localRecordIds = new Set(store.allRecords().map((r) => r.id));
            const remoteRecordIds = new Set(currentRemoteRecords.map((r: any) => r.id));

            const toRemove: string[] = [];
            for (const localId of localRecordIds) {
              const r = store.get(localId as any);
              if (localId === TLINSTANCE_ID || localId === TLPOINTER_ID || localId === userId || r?.typeName === "instance_presence") {
                continue;
              }
              if (!remoteRecordIds.has(localId as any)) {
                toRemove.push(localId);
              }
            }
            if (toRemove.length > 0) {
              store.remove(toRemove as any);
            }

            const filteredRemoteRecords = currentRemoteRecords
              .filter((r: any) => r && r.id !== TLINSTANCE_ID && r.id !== TLPOINTER_ID && r.id !== userId && r.typeName !== "instance_presence")
              .map((r: any) => sanitizeRecord(r));

            store.put(filteredRemoteRecords);
          });
        }
      );

      unsubs.push(unsubStorage);

      if (isMounted) {
        setStoreWithStatus({
          status: "synced-remote",
          connectionStatus: "online",
          store,
        });
      }
    }

    setup().catch((err) => {
      console.error("[useStorageStore] Setup failed:", err);
      if (isMounted) {
        setStoreWithStatus({
          status: "synced-remote",
          connectionStatus: "online",
          store,
        });
      }
    });

    return () => {
      isMounted = false;
      unsubs.forEach((unsub) => unsub());
    };
  }, [room, store, user, isReadOnly]);

  return storeWithStatus;
}