"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { TLComponents, Tldraw, useEditor, type TLStoreSnapshot } from "tldraw";

import "tldraw/tldraw.css";
import { CustomShareZone } from "@/components/tldrawcomponents/customfunctions";
import { useBoardPersistence } from "@/features/board/hooks/use-board-persistence";

const tldrawComponents: TLComponents = {
  SharePanel: CustomShareZone,
};

 //Handles automatic dark mode sync between TLDraw state and the App root.
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

//Connects persistence logic cleanly inside the Tldraw Context tree.

function BoardPersistence({boardId,initialSnapshot}: {
  boardId: string;
  initialSnapshot: Record<string, unknown> | null;
}) {
  const editor = useEditor();

  useBoardPersistence({ // this hook is used to persist the board snapshot to the database
    editor,
    boardId,
    initialSnapshot: initialSnapshot as unknown as TLStoreSnapshot | null,
  });

  return null;
}

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const boardId = params?.boardId as string;
  const { data: session, isPending } = useSession();
  const [board, setBoard] = useState<{title: string;snapshot: Record<string, unknown> | null} | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!boardId) return;

    fetch(`/api/boards/${boardId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) router.replace(`/workspace/${slug}`);
        else setBoard(data);
      });
  }, [session, isPending, boardId, slug, router]);

  if (isPending || !board) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
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

      <Tldraw components={tldrawComponents}>
        <ThemeSyncPlugin />
        <BoardPersistence
          boardId={boardId}
          initialSnapshot={board.snapshot}
        />
      </Tldraw>
    </div>
  );
}