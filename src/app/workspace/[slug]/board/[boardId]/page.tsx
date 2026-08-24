"use client";

import "@liveblocks/react-ui/styles.css";
import { useEffect, useState, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { TLComponents, Tldraw, useEditor, type TLStoreSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { motion, AnimatePresence } from "motion/react";
import { ActiveUsers } from "@/features/board/_components/ActiveUsers";
import { ShareModal } from "@/components/ShareModal";
import { useBoardPersistence } from "@/features/board/hooks/use-board-persistence";
import { useStorageStore } from "@/hooks/useStorageStore";
import { Room } from "@/components/Room";
import { VersionHistoryModal } from "@/features/board/_components/VersionHistoryModal";
import { PresenceSync } from "@/features/board/_components/PresenceSync";
import { CommentsCanvas } from "@/features/board/_components/CommentsCanvas";
import { NotificationCenter } from "@/features/board/_components/NotificationCenter";

// Move License Key outside component tree so reference remains completely static across renders
const TLDRAW_LICENSE_KEY = process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY || undefined;

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

function TopLeftThemeToggle() {
  const editor = useEditor();
  const [wipeTheme, setWipeTheme] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(editor.user.getIsDarkMode());
    const dispose = editor.store.listen(() => {
      setIsDark(editor.user.getIsDarkMode());
    });
    return () => dispose();
  }, [editor]);

  const handleThemeToggle = () => {
    setWipeTheme(true);
    setTimeout(() => {
      const currentDark = editor.user.getIsDarkMode();
      const nextDark = !currentDark;
      editor.user.updateUserPreferences({ colorScheme: nextDark ? "dark" : "light" });
      setIsDark(nextDark);
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }, 350);

    setTimeout(() => {
      setWipeTheme(false);
    }, 700);
  };

  return (
    <>
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {wipeTheme && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-[99999999] bg-[#4d49fc] pointer-events-none"
              />
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Button placed right after the three dots icon in top-left toolbar */}
      <div className="absolute top-2 left-86 z-9999 flex items-center">
        <button
          onClick={handleThemeToggle}
          className="flex size-8 items-center justify-center rounded-lg border border-black/10 bg-white/90 text-amber-500 shadow-sm transition-colors hover:bg-black/5 dark:border-zinc-700/60 dark:bg-zinc-900/90 dark:text-amber-400 dark:hover:bg-zinc-800 cursor-pointer"
          title="Toggle theme"
        >
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-amber-400">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-zinc-700">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
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
      <Tldraw 
      store={storeWithStatus} 
      components={tldrawComponents} autoFocus
      licenseKey={TLDRAW_LICENSE_KEY}>
        <ThemeSyncPlugin />
        <TopLeftThemeToggle />
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
