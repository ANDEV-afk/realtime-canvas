import { useEffect, useState } from "react";
import { useRoom, useOthers } from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";
import { customAssetStore } from "@/lib/upload-asset";
import {
  createTLStore,
  defaultShapeUtils,
  DocumentRecordType,
  PageRecordType,
  CameraRecordType,
  InstancePageStateRecordType,
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
    const instance = record as unknown as Record<string, unknown>;

    // Strip legacy/unexpected properties
    const { isHandMode, isSnapMode, isDarkMode, ...rest } = instance;

    return {
      ...rest,
      openMenus: Array.isArray(instance.openMenus) ? instance.openMenus : [],
      chatMessage: typeof instance.chatMessage === "string" ? instance.chatMessage : "",
      isFocusMode: typeof instance.isFocusMode === "boolean" ? instance.isFocusMode : false,
      isGridMode: typeof instance.isGridMode === "boolean" ? instance.isGridMode : false,
      isToolLocked: typeof instance.isToolLocked === "boolean" ? instance.isToolLocked : false,
      isFocused: typeof instance.isFocused === "boolean" ? instance.isFocused : true,
      isReadonly: typeof instance.isReadonly === "boolean" ? instance.isReadonly : false,
      isCoarsePointer: typeof instance.isCoarsePointer === "boolean" ? instance.isCoarsePointer : false,
      isHoveringCanvas: typeof instance.isHoveringCanvas === "boolean" ? instance.isHoveringCanvas : true,
      devicePixelRatio: typeof instance.devicePixelRatio === "number" ? instance.devicePixelRatio : 1,
      insets: Array.isArray(instance.insets) ? instance.insets : [],
      zoomBrush: instance.zoomBrush !== undefined ? instance.zoomBrush : null,
      scribbles: Array.isArray(instance.scribbles) ? instance.scribbles : [],
      isPenMode: typeof instance.isPenMode === "boolean" ? instance.isPenMode : false,
      isChatting: typeof instance.isChatting === "boolean" ? instance.isChatting : false,
      highlightedUserIds: Array.isArray(instance.highlightedUserIds) ? instance.highlightedUserIds : [],
    } as unknown as TLRecord;
  }

  if (record.typeName === "asset" && record.props && typeof record.props === "object") {
    const props = record.props as Record<string, unknown>;
    const resolvedSrc = props.src || props.url || "";

    // Fix: Bookmark assets ke props se 'url' strip karna zaruri hai 
    // kyunki tldraw schema usko reject karta hai.
    if (record.type === "bookmark") {
      const { url, ...restProps } = props;
      return {
        ...record,
        props: {
          ...restProps,
          src: resolvedSrc,
        },
      } as unknown as TLRecord;
    }

    return {
      ...record,
      props: {
        ...props,
        src: resolvedSrc,
      },
    } as unknown as TLRecord;
  }

  return record;
}
// Records that must NEVER be pushed to / removed based on Liveblocks storage —
// they are per-client session state only.
const SESSION_ONLY_TYPENAMES = new Set([
  "instance",
  "pointer",
  "camera",
  "instance_page_state",
  "instance_presence",
]);

// Replace the entire hook body with this optimized & stabilized version:

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

  const [store] = useState(() => {
    return createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
      assets: customAssetStore,
    });
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  // 1. Remote cursors sync
  useEffect(() => {
    if (!store) return;

    const presenceRecords: TLRecord[] = [];
    const activePresenceIds = new Set<string>();

    for (const other of others) {
      const presence = other.presence as {
        cursor?: { x?: number; y?: number } | null;
      };

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

    store.mergeRemoteChanges(() => {
      if (presenceRecords.length > 0) {
        store.put(presenceRecords);
      }

      const existingPresences = store
        .allRecords()
        .filter((r) => r.typeName === "instance_presence" && r.id.startsWith("instance_presence:"));

      const toRemove = existingPresences
        .filter((r) => !activePresenceIds.has(r.id as string))
        .map((r) => r.id);

      if (toRemove.length > 0) {
        store.remove(toRemove as any);
      }
    });
  }, [store, others]);

  // 2. Document sync (Fixed Infinite Loop & Freeze Bug)
  useEffect(() => {
    let isMounted = true;
    let isApplyingRemote = false; // Flag to stop recursive store sync loops
    let recordUnsubs: (() => void)[] = [];
    let rootUnsub: (() => void) | null = null;

    const pageId = "page:page" as TLPageId;
    const userId = "user:user" as TLUser["id"];

    function teardownRecordSync() {
      recordUnsubs.forEach((u) => u());
      recordUnsubs = [];
    }

    function attachRecordSync(liveRecords: any) {
      teardownRecordSync();

      // Local edits -> Liveblocks storage
      const unsubscribeLocal = store.listen(
        (changes: TLStoreEventInfo) => {
          if (!isMounted || isApplyingRemote) return; // Prevent echo loop!

          room.batch(() => {
            for (const record of Object.values(changes.changes.added)) {
              if (!SESSION_ONLY_TYPENAMES.has(record.typeName)) {
                liveRecords.set(record.id, record);
              }
            }
            for (const [, to] of Object.values(changes.changes.updated)) {
              if (!SESSION_ONLY_TYPENAMES.has(to.typeName)) {
                liveRecords.set(to.id, to);
              }
            }
            for (const record of Object.values(changes.changes.removed)) {
              if (!SESSION_ONLY_TYPENAMES.has(record.typeName)) {
                liveRecords.delete(record.id);
              }
            }
          });
        },
        { source: "user", scope: "document" }
      );
      recordUnsubs.push(unsubscribeLocal);

      // Storage -> Local store
      const unsubStorage = room.subscribe(liveRecords, () => {
        if (!isMounted) return;

        const currentRemoteRecords = Array.from(liveRecords.values())
          .filter(Boolean)
          .map((r: any) => sanitizeRecord(r));

        isApplyingRemote = true; // Lock sync
        store.mergeRemoteChanges(() => {
          const remoteIds = new Set(currentRemoteRecords.map((r: any) => r.id));

          const toRemove = store
            .allRecords()
            .filter(
              (r) =>
                !SESSION_ONLY_TYPENAMES.has(r.typeName) &&
                r.id !== userId &&
                !remoteIds.has(r.id)
            )
            .map((r) => r.id);

          if (toRemove.length > 0) {
            store.remove(toRemove as any);
          }

          if (currentRemoteRecords.length > 0) {
            store.put(currentRemoteRecords);
          }
        });
        isApplyingRemote = false; // Unlock sync
      });
      recordUnsubs.push(unsubStorage);
    }

    function hydrate(liveRecords: any) {
      try {
        const toApplyLocally: TLRecord[] = [];
        const toPersistRemotely: TLRecord[] = [];

        if (!liveRecords.has("document:document")) {
          const doc = DocumentRecordType.create({
            id: "document:document" as TLDocument["id"],
          });
          toApplyLocally.push(doc);
          toPersistRemotely.push(doc);
        }

        if (!liveRecords.has(pageId)) {
          const page = PageRecordType.create({
            id: pageId,
            name: "Page 1",
            index: "a1" as IndexKey,
          });
          toApplyLocally.push(page);
          toPersistRemotely.push(page);
        }

        const cameraRecordId = CameraRecordType.createId(pageId);
        if (!store.has(cameraRecordId)) {
          toApplyLocally.push(
            CameraRecordType.create({ id: cameraRecordId, x: 0, y: 0, z: 1 })
          );
        }

        const pageStateRecordId = InstancePageStateRecordType.createId(pageId);
        if (!store.has(pageStateRecordId)) {
          toApplyLocally.push(
            InstancePageStateRecordType.create({
              id: pageStateRecordId,
              pageId: pageId,
              selectedShapeIds: [],
              hintingShapeIds: [],
              erasingShapeIds: [],
              focusedGroupId: null,
            })
          );
        }

        const storedLiveRecords = Array.from(liveRecords.values())
          .filter(
            (record: any) =>
              record &&
              record.id !== TLINSTANCE_ID &&
              record.id !== TLPOINTER_ID &&
              record.id !== userId &&
              record.typeName !== "instance_presence"
          )
          .map((record: any) => sanitizeRecord(record));
        toApplyLocally.push(...storedLiveRecords);

        if (!store.has(TLINSTANCE_ID)) {
          toApplyLocally.push(
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
          toApplyLocally.push({
            id: TLPOINTER_ID,
            typeName: "pointer",
            x: 0,
            y: 0,
            lastActivityTimestamp: Date.now(),
            meta: {},
          } as unknown as TLRecord);
        }

        if (!store.has(userId)) {
          toApplyLocally.push(
            UserRecordType.create({
              id: userId,
              name: user?.name || "Anonymous",
              color: user?.color || "#3b82f6",
            })
          );
        }

        isApplyingRemote = true;
        store.mergeRemoteChanges(() => {
          store.put(toApplyLocally, "initialize");
        });
        isApplyingRemote = false;

        if (toPersistRemotely.length > 0) {
          room.batch(() => {
            for (const record of toPersistRemotely) {
              liveRecords.set(record.id, record);
            }
          });
        }
      } catch (hydrationErr) {
        console.error("[useStorageStore] Hydration error:", hydrationErr);
      }
    }

    async function setup() {
      const { root } = await room.getStorage();
      if (!isMounted) return;

      function getOrCreateRecordsMap() {
        let map = root.get("records") as any;
        if (!map) {
          root.set("records", new LiveMap());
          map = root.get("records") as any;
        }
        return map;
      }

      let liveRecords = getOrCreateRecordsMap();

      rootUnsub = room.subscribe(root, () => {
        const current = root.get("records") as any;
        if (current && current !== liveRecords) {
          liveRecords = current;
          attachRecordSync(liveRecords);
          hydrate(liveRecords);
        }
      });

      attachRecordSync(liveRecords);
      hydrate(liveRecords);

      if (isMounted) {
        setStoreWithStatus({
          status: "synced-remote",
          connectionStatus: "online",
          store,
        });
      }
    }

    setup().catch((err) => {
      console.error("[useStorageStore] Setup error:", err);
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
      teardownRecordSync();
      if (rootUnsub) rootUnsub();
    };
  }, [room, store, user?.id, user?.name, user?.color, isReadOnly]);

  return storeWithStatus;
}