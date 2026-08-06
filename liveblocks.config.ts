import { LiveMap, JsonObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: {
      presence?: JsonObject | null;
      cursor?: { x: number; y: number } | null;
      selection?: string[] | null;
    };

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