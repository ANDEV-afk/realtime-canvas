import { useEffect, useState } from "react";
import { useRoom } from "@liveblocks/react/suspense";
import { JsonObject } from "@tldraw/utils";
import {
  computed,
  createPresenceStateDerivation,
  createTLStore,
  createUserId,
  react,
  defaultShapeUtils,
  DocumentRecordType,
  InstancePresenceRecordType,
  PageRecordType,
  CameraRecordType,
  InstancePageStateRecordType,
  PointerRecordType,
  IndexKey,
  TLAnyShapeUtilConstructor,
  TLDocument,
  TLInstancePresence,
  TLPageId,
  TLRecord,
  TLStoreEventInfo,
  TLStoreWithStatus,
  TLUser,
  UserRecordType,
  TLINSTANCE_ID,
  TLPOINTER_ID,
  TLInstance,
} from "tldraw";

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

  const [store] = useState(() => {
    return createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  useEffect(() => {
    let isMounted = true;
    const unsubs: (() => void)[] = [];

    async function setup() {
      const { root } = await room.getStorage();
      if (!isMounted) return;

      const liveRecords = root.get("records") as unknown as {
        get(id: string): TLRecord | undefined;
        set(id: string, value: TLRecord): void;
        delete(id: string): void;
        values(): IterableIterator<TLRecord>;
      };

      const pageId = "page:page" as TLPageId;
      const recordsToPut: TLRecord[] = [];

      // 1. Ensure base document and page records exist
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

      // Populate Liveblocks Storage records safely with asset sanitization
      const storedLiveRecords = Array.from(liveRecords.values()).map((record) => {
        if (record.typeName === "asset" && record.props && typeof record.props === "object") {
          return {
            ...record,
            props: {
              ...record.props,
              src: (record.props as any).src || "",
            },
          } as unknown as TLRecord;
        }
        return record;
      });
      recordsToPut.push(...storedLiveRecords);
      store.put(recordsToPut, "initialize");

      // 2. Local Session / Instance Records 
      if (!store.has(TLINSTANCE_ID)) {
        recordsToPut.push({
          id: TLINSTANCE_ID,
          typeName: "instance",
          currentPageId: pageId,
          followingUserId: null,
          highlightedUserIds: [],
          brush: null,
          cursor: { type: "default", rotation: 0 },
          opacityForNextShape: 1,
          stylesForNextShape: {},
          screenBounds: { x: 0, y: 0, w: 1080, h: 720 },
          insets: [false, false, false, false],
          zoomBrush: null,
          isGridMode: false,
          isPenMode: false,
          chatMessage: "",
          isChatting: false,
          isFocused: true,
          devicePixelRatio: 1,
          isIsolateMode: false,
          duplicateProps: null,
          // Nayi tldraw version ki missing properties:
          isFocusMode: false,
          isDebugMode: false,
          isToolLocked: false,
          exportBackground: false,
          scribbles: [],
          meta: {},
        } as unknown as TLInstance); // <-- Double casting to bypass TS strict overlap error
      }

      // 3. Ensure Pointer, Camera, and InstancePageState exist
      const pointerId = PointerRecordType.createId(TLPOINTER_ID);
      if (!store.has(pointerId)) {
        store.put([
          PointerRecordType.create({
            id: pointerId,
            x: 0,
            y: 0,
            lastActivityTimestamp: Date.now(),
          }),
        ]);
      }

      if (!store.has(CameraRecordType.createId(pageId))) {
        store.put([CameraRecordType.create({ id: CameraRecordType.createId(pageId) })]);
      }

      if (!store.has(InstancePageStateRecordType.createId(pageId))) {
        store.put([
          InstancePageStateRecordType.create({
            id: InstancePageStateRecordType.createId(pageId),
            pageId,
          }),
        ]);
      }

      if (!isMounted) return;

      // 4. Sync local store user actions -> Liveblocks Storage
      unsubs.push(
        store.listen(
          ({ changes }: TLStoreEventInfo) => {
            room.batch(() => {
              Object.values(changes.added).forEach((record) => {
                try {
                  liveRecords.set(record.id, record);
                } catch {
                  // Read-only user write prevention
                }
              });

              Object.values(changes.updated).forEach(([, record]) => {
                try {
                  liveRecords.set(record.id, record);
                } catch {
                  // Read-only user write prevention
                }
              });

              Object.values(changes.removed).forEach((record) => {
                try {
                  liveRecords.delete(record.id);
                } catch {
                  // Read-only user write prevention
                }
              });
            });
          },
          { source: "user", scope: "document" } // Strictly user actions only to break loop
        )
      );

      // 5. Sync presence changes
      function syncStoreWithPresence({ changes }: TLStoreEventInfo) {
        room.batch(() => {
          Object.values(changes.added).forEach((record) => {
            room.updatePresence({ [record.id]: record } as unknown as JsonObject);
          });

          Object.values(changes.updated).forEach(([, record]) => {
            room.updatePresence({ [record.id]: record } as unknown as JsonObject);
          });

          Object.values(changes.removed).forEach((record) => {
            room.updatePresence({ [record.id]: null } as unknown as JsonObject);
          });
        });
      }

      unsubs.push(
        store.listen(syncStoreWithPresence, {
          source: "user",
          scope: "session",
        })
      );

      unsubs.push(
        store.listen(syncStoreWithPresence, {
          source: "user",
          scope: "presence",
        })
      );

      // 6. Sync remote Liveblocks Storage -> Local tldraw store
      unsubs.push(
        room.subscribe(
          liveRecords as never,
          (storageChanges) => {
            const toRemove: TLRecord["id"][] = [];
            const toPut: TLRecord[] = [];

            for (const update of storageChanges) {
              if (update.type !== "LiveMap") return;

              for (const [id, { type }] of Object.entries(update.updates)) {
                switch (type) {
                  case "delete": {
                    toRemove.push(id as TLRecord["id"]);
                    break;
                  }
                  case "update": {
                    const curr = (update.node as unknown as { get(id: string): unknown }).get(id);
                    if (curr) toPut.push(curr as TLRecord);
                    break;
                  }
                }
              }
            }

            store.mergeRemoteChanges(() => {
              if (toRemove.length) store.remove(toRemove);
              if (toPut.length) store.put(toPut);
            });
          },
          { isDeep: true }
        )
      );

      // 7. User Preferences & Presence setup
      const userPreferences = computed<TLUser | null>("userPreferences", () => {
        if (!user) return null;
        return UserRecordType.create({
          id: createUserId(user.id),
          name: user.name,
          color: user.color,
          imageUrl: "",
          meta: {},
        });
      });

      const connectionIdString = "" + (room.getSelf()?.connectionId || 0);

      const presenceDerivation = createPresenceStateDerivation(
        userPreferences,
        { instanceId: InstancePresenceRecordType.createId(connectionIdString) }
      )(store);

      room.updatePresence({
        presence: presenceDerivation.get() ?? null,
      } as unknown as JsonObject);

      unsubs.push(
        react("when presence changes", () => {
          const presence = presenceDerivation.get() ?? null;
          requestAnimationFrame(() => {
            room.updatePresence({ presence } as unknown as JsonObject);
          });
        })
      );

      unsubs.push(
        room.subscribe("others", (others, event) => {
          const toRemove: TLInstancePresence["id"][] = [];
          const toPut: TLInstancePresence[] = [];

          switch (event.type) {
            case "leave": {
              if (event.user.connectionId) {
                toRemove.push(
                  InstancePresenceRecordType.createId(`${event.user.connectionId}`)
                );
              }
              break;
            }
            case "reset": {
              others.forEach((other) => {
                toRemove.push(
                  InstancePresenceRecordType.createId(`${other.connectionId}`)
                );
              });
              break;
            }
            case "enter":
            case "update": {
              const presence = (event.user.presence as Record<string, unknown>)?.presence as TLInstancePresence | undefined;
              if (presence) {
                toPut.push(presence);
              }
            }
          }

          store.mergeRemoteChanges(() => {
            if (toRemove.length) store.remove(toRemove);
            if (toPut.length) store.put(toPut);
          });
        })
      );

      if (isMounted) {
        setStoreWithStatus({
          store,
          status: "synced-remote",
          connectionStatus: "online",
        });
      }
    }

    setup();

    return () => {
      isMounted = false;
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
    };
  }, [room, store]); // Depend on room and store only

  return storeWithStatus;
}