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
          // Send all user IDs to API
          const response = await fetch(`/api/users?ids=${userIds.join(",")}`);
          if (!response.ok) return [];

          const users: Array<{ id: string; name: string; image?: string; avatar?: string;color?: string; }> =
            await response.json();

          // Liveblocks requires array to match exact 'userIds' order
          return userIds.map((id) => {
            const user = users.find((u) => u.id === id);

            if (!user) {
              // Fallback for Guests or Users not found in DB
              return {
                name: id.startsWith("guest_") ? "Guest User" : "Anonymous",
                color: "#10b981",
                avatar: "",
              };
            }

            return {
              name: user.name || "Anonymous",
              avatar: user.image || user.avatar || "",
              color: user.color || "#3b82f6",
            };
          });
        } catch (error) {
          console.error("Error resolving users in Liveblocks:", error);
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