"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center bg-muted/20 p-4">
        <div className="flex h-full w-full max-w-6xl flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
          <p className="text-lg font-medium text-foreground">Canvas placeholder</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Board &quot;{board.title}&quot; is ready. The Tldraw canvas will render here.
          </p>
        </div>
      </div>
    </div>
  );
}
