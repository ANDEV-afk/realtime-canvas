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
    <LiveblocksProvider authEndpoint="/api/liveblock-auth">
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
            <div className="flex h-screen w-full items-center justify-center p-4">
              <Skeleton className="h-64 w-full max-w-6xl rounded-2xl" />
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}