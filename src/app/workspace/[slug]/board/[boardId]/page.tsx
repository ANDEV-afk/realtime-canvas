"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { TLComponents, Tldraw, useEditor, type TLStoreSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { ActiveUsers } from "@/features/board/_components/ActiveUsers";
import { ShareModal } from "@/components/ShareModal";
import { useBoardPersistence } from "@/features/board/hooks/use-board-persistence";
import { useStorageStore } from "@/hooks/useStorageStore";
import { Room } from "@/components/Room";

interface BoardData {
  id: string;
  title: string;
  accessMode: "editor" | "viewer";
  createdById: string;
  snapshot: Record<string, unknown> | null;
}

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

// Safely controls tldraw read-only state via instance update (TypeScript safe)
function ReadOnlyControlled({ isReadOnly }: { isReadOnly: boolean }) {
  const editor = useEditor();

  useEffect(() => {
    editor.updateInstanceState({ isReadonly: isReadOnly });
  }, [editor, isReadOnly]);

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
  accessMode,
  isOwner,
  user,
}: {
  boardId: string;
  initialSnapshot: Record<string, unknown> | null;
  accessMode: "editor" | "viewer";
  isOwner: boolean;
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

  // Custom Share Zone with Editor/Viewer ShareModal & Active Users
  const CustomShareZone = () => (
    <div
      className="tlui-share-zone flex shrink-0 items-center gap-3 relative z-[9999]"
      draggable={false}
    >
      <ActiveUsers />
      <ShareModal boardId={boardId} initialAccessMode={accessMode} isOwner={isOwner} />
    </div>
  );

  const tldrawComponents: TLComponents = {
    SharePanel: CustomShareZone,
  };

  const readOnly = !isOwner && accessMode === "viewer";

  // 2. Render tldraw Canvas
  return (
    <Tldraw store={storeWithStatus} components={tldrawComponents}>
      <ThemeSyncPlugin />
      <ReadOnlyControlled isReadOnly={readOnly} />
      <BoardPersistence boardId={boardId} initialSnapshot={initialSnapshot} />
    </Tldraw>
  );
}

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.boardId as string;
  const router = useRouter();

  // Get session status
  const { data: session, isPending: isSessionPending } = useSession();

  const [board, setBoard] = useState<BoardData | null>(null);

  // Strict Membership & Board Fetching Logic
  useEffect(() => {
    if (!boardId || isSessionPending) return;

    if (!session) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    fetch(`/api/boards/${boardId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) setBoard(data);
      })
      .catch((err) => {
        console.error("Failed to load board:", err);
        router.push("/workspace?error=board_not_found");
      });
  }, [boardId, session, isSessionPending, router]);

  // Loading state while verifying user membership & fetching board metadata
  if (isSessionPending || !board || !session) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 h-screen w-full">
        <Skeleton className="h-64 w-full max-w-6xl rounded-2xl" />
      </div>
    );
  }

  const isOwner = board.createdById === session.user.id;

  return (
    <div className="h-full w-full relative">
      <style>{`
        /* Offset top-left controls for app sidebar */
        .tlui-layout__top__left {
          margin-left: 44px !important;
          margin-top: 4px !important;
        }

        /* Share zone: avatars left, share button flush right */
        .tlui-share-zone {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 12px !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          pointer-events: auto !important;
          z-index: 9999 !important;
        }

        /* Remove default tldraw pill background and borders */
        .tlui-share-zone__button,
        .tlui-navigation-zone,
        .tlui-menu-zone,
        .tlui-buttons__horizontal {
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
          accessMode={board.accessMode}
          isOwner={isOwner}
          user={{
            id: session.user.id,
            name: session.user.name || "Anonymous",
            color: "#3b82f6",
          }}
        />
      </Room>
    </div>
  );
}
