import { LiveMap, JsonObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    // Liveblocks Presence
    Presence: {
      cursor: { x: number; y: number } | null;
      selection: string[] | null;
    };

    // LiveMap storage - JsonObject constraint ko exact satisfy karta hai
    Storage: {
      records: LiveMap<string, JsonObject>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
        avatar?: string;
      };
    };

    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
  }
}

export {};