"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useStorageStore } from "@/hooks/useStorageStore";
import { useSelf } from "@liveblocks/react/suspense";

export function CollaborativeBoard() {
  // Current authenticated user info fetch karo
  const me = useSelf();

  const storeWithStatus = useStorageStore({
    user: {
      id: me?.id ?? "guest-id",
      color: me?.info?.color ?? "#3062D4",
      name: me?.info?.name ?? "Guest User",
    },
  });

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <Tldraw store={storeWithStatus} autoFocus />
    </div>
  );
}