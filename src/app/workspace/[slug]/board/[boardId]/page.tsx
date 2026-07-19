"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { TLComponents, Tldraw, useEditor } from 'tldraw';

import 'tldraw/tldraw.css'
import { CustomShareZone } from "@/components/tldrawcomponents/customfunctions";

const tldrawComponents: TLComponents = {
  SharePanel: CustomShareZone,
};

// 1. Ek chhota helper component banayein jo Tldraw instance ke state ko listen karega
function ThemeSyncPlugin() {
  const editor = useEditor();

  useEffect(() => {
    // Ek function jo check karega ki Tldraw ka active theme kya hai
    const syncTheme = () => {
      const isDark = editor.user.getIsDarkMode();
      
      // Pure HTML root element par class append karein taki Shadcn sidebar instantly background badal le
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // First initial render par sync karein
    syncTheme();

    // Jab bhi user preference change ho, ye listen karega
    const dispose = editor.store.listen((e) => {if (e.source === "user") syncTheme()});

    return () => dispose();
  }, [editor]);

  return null;
}

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const boardId = params?.boardId as string;
  const { data: session, isPending } = useSession();
  const [board, setBoard] = useState<{ title: string } | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.replace("/login"); return; }
    if (!boardId) return;

    fetch(`/api/boards/${boardId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
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
      /* Top-left bar ko proper alignment dene ke liye */
      .tlui-layout__top__left {
        margin-left: 44px !important;
        margin-top: 4px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }

      /* Dono internal containers ka background aur borders poori tarah saaf karne ke liye */
      .tlui-buttons__horizontal,
      .tlui-menu-zone {
        background: transparent !important;
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
    `}</style>

      <Tldraw persistenceKey={boardId} components={tldrawComponents}>
        {/* 2. Is wrapper plugin ko Tldraw children tree ke andar render karein */}
        <ThemeSyncPlugin />
      </Tldraw>
    </div>
  );
}