"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { TLComponents, Tldraw, useEditor, type TLStoreSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { CustomShareZone } from "@/components/tldrawcomponents/customfunctions";
import { useBoardPersistence } from "@/features/board/hooks/use-board-persistence";
import { useStorageStore } from "@/hooks/useStorageStore";
import { Room } from "@/components/Room";

// Register custom share button component into tldraw UI
const tldrawComponents: TLComponents = {
  SharePanel: CustomShareZone,
};

// Plugin to synchronize tldraw dark mode setting with HTML document class
function ThemeSyncPlugin() {
  const editor = useEditor();

  useEffect(() => {
    const syncTheme = () => {
      const isDark = editor.user.getIsDarkMode();
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    syncTheme();

    const dispose = editor.store.listen((e) => {
      if (e.source === "user") syncTheme();
    });

    return () => dispose();
  }, [editor]);

  return null;
}

// Connects DB persistence logic cleanly inside the Tldraw Context tree
function BoardPersistence({
  boardId,
  initialSnapshot,
}: {
  boardId: string;
  initialSnapshot: Record<string, unknown> | null;
}) {
  const editor = useEditor();

  useBoardPersistence({
    editor,
    boardId,
    initialSnapshot: initialSnapshot as unknown as TLStoreSnapshot | null,
  });

  return null;
}

// Real-time Collaborative Canvas Inner Component
function InnerBoard({
  boardId,
  initialSnapshot,
  user,
}: {
  boardId: string;
  initialSnapshot: Record<string, unknown> | null;
  user: { id: string; name: string; color: string };
}) {
  const storeWithStatus = useStorageStore({ user });

  // 1. Check if storage store is fully initialized
  const isReady = storeWithStatus.status !== "loading" && storeWithStatus.store;
  if (!isReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Connecting to live board...</p>
        </div>
      </div>
    );
  }

  // 2. Render tldraw Canvas
  return (
    <Tldraw store={storeWithStatus} components={tldrawComponents}>
      <ThemeSyncPlugin />
      <BoardPersistence boardId={boardId} initialSnapshot={initialSnapshot} />
    </Tldraw>
  );
}

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.boardId as string;
  
  // Get session status (optional now for guest access)
  const { data: session, isPending: isSessionPending } = useSession();

  const [board, setBoard] = useState<{
    title: string;
    snapshot: Record<string, unknown> | null;
  } | null>(null);

  // Fetch initial board state without blocking non-logged-in users
  useEffect(() => {
    if (!boardId) return;

    fetch(`/api/boards/${boardId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // Fallback to empty snapshot if user is guest or board not found in DB
        setBoard(data || { title: "Shared Board", snapshot: null });
      })
      .catch(() => {
        setBoard({ title: "Shared Board", snapshot: null });
      });
  }, [boardId]);

  // Loading state while board metadata is being fetched
  if (isSessionPending || !board || !session) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 h-screen w-full">
        <Skeleton className="h-64 w-full max-w-6xl rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <style>{`
        .tlui-layout__top__left {
          margin-left: 44px !important;
          margin-top: 4px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .tlui-buttons__horizontal,
        .tlui-menu-zone {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>

      <Room roomId={boardId}>
        <InnerBoard
          boardId={boardId}
          initialSnapshot={board.snapshot}
          user={{
            id: session!.user.id,
            name: session!.user.name || "Anonymous",
            color: "#3b82f6",
          }}
        />
      </Room>
    </div>
  );
}