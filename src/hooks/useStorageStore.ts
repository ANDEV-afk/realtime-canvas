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

  // 1. Sync remote cursors from Liveblocks `others` presence into tldraw's
  // instance_presence records. (This part was already working correctly —
  // untouched.)
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

  // 2. Document (shapes/page) sync — race-safe.
  useEffect(() => {
    let isMounted = true;
    let recordUnsubs: (() => void)[] = [];
    let rootUnsub: (() => void) | null = null;

    const pageId = "page:page" as TLPageId;
    const userId = "user:user" as TLUser["id"];

    function teardownRecordSync() {
      recordUnsubs.forEach((u) => u());
      recordUnsubs = [];
    }

    // Wires local<->remote sync for a specific `liveRecords` LiveMap.
    // Called again whenever the canonical "records" LiveMap reference
    // changes (see rootUnsub below) so we never stay stuck on a stale map.
    function attachRecordSync(liveRecords: any) {
      teardownRecordSync();

      // Local edits -> Liveblocks storage. `source: "user"` means this
      // never fires for our own mergeRemoteChanges-wrapped hydration or
      // for remote-applied changes — no manual source check needed, and
      // no self-echo risk.
      const unsubscribeLocal = store.listen(
        (changes: TLStoreEventInfo) => {
          if (!isMounted) return;

          room.batch(() => {
            for (const record of Object.values(changes.changes.added)) {
              liveRecords.set(record.id, record);
            }
            for (const [, to] of Object.values(changes.changes.updated)) {
              liveRecords.set(to.id, to);
            }
            for (const record of Object.values(changes.changes.removed)) {
              liveRecords.delete(record.id);
            }
          });
        },
        { source: "user", scope: "document" }
      );
      recordUnsubs.push(unsubscribeLocal);

      // Liveblocks storage -> local store.
      const unsubStorage = room.subscribe(liveRecords, () => {
        if (!isMounted) return;

        const currentRemoteRecords = Array.from(liveRecords.values())
          .filter(Boolean)
          .map((r: any) => sanitizeRecord(r));

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
      });
      recordUnsubs.push(unsubStorage);
    }

    // Creates local-only session records (instance/pointer/user/camera/
    // page-state) if missing, and pulls existing document records from
    // `liveRecords` into the local store. Only records that are genuinely
    // NEW (didn't exist in liveRecords yet — i.e. a brand new board) get
    // persisted back to Liveblocks; already-stored records are only ever
    // applied locally, never re-written (this was the "echo on every
    // mount" bug).
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

        if (store.has(TLINSTANCE_ID)) {
          const existing = store.get(TLINSTANCE_ID) as any;
          toApplyLocally.push(
            sanitizeRecord({ ...existing, isReadonly: !!isReadOnly } as TLRecord)
          );
        } else {
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

        // Applied as a REMOTE merge — this must not be picked up by our
        // own `source: "user"` listener, or already-stored records would
        // get needlessly re-broadcast every mount (and could clobber a
        // fresher remote write with a stale snapshot).
        store.mergeRemoteChanges(() => {
          store.put(toApplyLocally, "initialize");
        });

        // Only genuinely-new document/page records get written back —
        // once, explicitly.
        if (toPersistRemotely.length > 0) {
          room.batch(() => {
            for (const record of toPersistRemotely) {
              liveRecords.set(record.id, record);
            }
          });
        }
      } catch (hydrationErr) {
        console.error(
          "[useStorageStore] Hydration failed — check which record failed schema validation:",
          hydrationErr
        );
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

      // Guard against the create-race: if two clients open a brand-new
      // board at the same time, both may create their own "records"
      // LiveMap. Liveblocks resolves this to a single winner — but a
      // client holding the losing map would otherwise stay stuck writing
      // to / listening on a dead object forever. Subscribing to `root`
      // lets us detect the swap and re-point sync at the real map.
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
      teardownRecordSync();
      if (rootUnsub) rootUnsub();
    };
    // Depend on primitive `user` fields, not the object reference — the
    // parent recreates `user={{...}}` on every render, which used to tear
    // down and rebuild the entire storage subscription pointlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, store, user?.id, user?.name, user?.color, isReadOnly]);

  return storeWithStatus;
}