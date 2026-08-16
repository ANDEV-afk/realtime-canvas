"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveMap } from "@liveblocks/client";

interface RoomProps {
  roomId: string;
  children: ReactNode;
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <LiveblocksProvider
      authEndpoint={`/api/boards/${roomId}/access`}
      resolveUsers={async ({ userIds }) => {
        try {
          const response = await fetch(`/api/users?ids=${userIds.join(",")}`);
          if (!response.ok) return [];

          const users: Array<{ id: string; name: string; avatar?: string; color?: string }> 
          = await response.json();

          return users.map((user) => ({
            name: user.name || "Anonymous",
            avatar: user.avatar || "",
            color: user.color || "#3b82f6",
          }));
        } catch (error) {
          console.error("Error resolving users in Liveblocks:", error);
          return [];
        }
      }}
      //Mentions (@) Autocomplete Suggestion Callback
      resolveMentionSuggestions={async ({ text }) => {
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(text)}`);
          if (!response.ok) return [];

          const userIds: string[] = await response.json();
          return userIds; // Returns array of user IDs string for autocomplete
        } catch (error) {
          console.error("Error resolving mention suggestions:", error);
          return [];
        }
      }}
    >
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          selection: null,
        }}
        initialStorage={{
          records: new LiveMap(),
        }}
      >
        <ClientSideSuspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-zinc-950">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent bg-zinc-900" />
                <p className="text-sm text-zinc-400">Connecting to live board...</p>
              </div>
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}