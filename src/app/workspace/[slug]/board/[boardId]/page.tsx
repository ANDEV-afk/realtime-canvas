"use client";

import "@liveblocks/react-ui/styles.css";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { TLComponents, Tldraw, useEditor, type TLStoreSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { ActiveUsers } from "@/features/board/_components/ActiveUsers";
import { ShareModal } from "@/components/ShareModal";
import { useBoardPersistence } from "@/features/board/hooks/use-board-persistence";
import { useStorageStore } from "@/hooks/useStorageStore";
import { Room } from "@/components/Room";
import { VersionHistoryModal } from "@/features/board/_components/VersionHistoryModal";
import { PresenceSync } from "@/features/board/_components/PresenceSync";
import { CommentsCanvas } from "@/features/board/_components/CommentsCanvas";
import { NotificationCenter } from "@/features/board/_components/NotificationCenter";

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

// Safely controls tldraw read-only state via official editor method
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
  isReadOnly,
}: {
  boardId: string;
  initialSnapshot: Record<string, unknown> | null;
  isReadOnly: boolean;
}) {
  const editor = useEditor();

  useBoardPersistence({
    editor,
    boardId,
    initialSnapshot: initialSnapshot as unknown as TLStoreSnapshot | null,
    isReadOnly,
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
  const readOnly = !isOwner && accessMode === "viewer";

  // Pass readOnly flag to prevent liveblocks write storage error for viewers
  const storeWithStatus = useStorageStore({ user, isReadOnly: readOnly });

  // Memoize custom Tldraw UI components to prevent unmounting on state updates
  const tldrawComponents: TLComponents = useMemo(
    () => ({
      SharePanel: () => (
        <div
          className="tlui-share-zone flex shrink-0 items-center gap-3 relative z-9999"
          draggable={false}
        >
          {/* 👈 2. Notification Center Added Here inside Suspense */}
          <Suspense
            fallback={
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 animate-pulse" />
            }
          >
            <NotificationCenter />
          </Suspense>
          <ActiveUsers />
          <VersionHistoryModal boardId={boardId} isOwner={isOwner} />
          <ShareModal boardId={boardId} initialAccessMode={accessMode} isOwner={isOwner} />
        </div>
      ),
    }),
    [boardId, accessMode, isOwner]
  );

  if (storeWithStatus.status === "loading") {
    return <div className="h-full w-full bg-zinc-950" />;
  }

  return (
    <div className="absolute inset-0 h-full w-full">
      <Tldraw store={storeWithStatus} components={tldrawComponents} autoFocus>
        <ThemeSyncPlugin />
        <ReadOnlyControlled isReadOnly={readOnly} />
        <BoardPersistence
          boardId={boardId}
          initialSnapshot={initialSnapshot}
          isReadOnly={readOnly}
        />
        <PresenceSync />

        {/* 2. Comments Canvas Layer Rendered Here */}
        <CommentsCanvas/>
      </Tldraw>
    </div>
  );
}

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.boardId as string;
  const router = useRouter();

  // Ensure dark mode is active on mount to prevent white flash
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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
    return <div className="h-screen w-full bg-zinc-950" />;
  }

  const isOwner = board.createdById === session.user.id;

  return (
    <div className="h-full w-full relative bg-zinc-950">
      <style>{`
        /* Offset top-left controls for app sidebar */
        .tlui-layout__top__left {
          margin-left: 44px !important;
          margin-top: 4px !important;
        }

        /* Share zone styling */
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