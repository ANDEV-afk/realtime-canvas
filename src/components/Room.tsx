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
    <LiveblocksProvider authEndpoint={`/api/boards/${roomId}/access`}>
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
