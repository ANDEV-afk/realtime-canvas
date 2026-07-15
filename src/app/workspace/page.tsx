"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function WorkspacePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.replace("/login"); return; }

    fetch("/api/workspaces")
      .then(r => r.json())
      .then(async (workspaces) => {
        if (!Array.isArray(workspaces)) { router.replace("/login"); return; }

        const ws = workspaces[0] as { id: string; slug: string };

        if (workspaces.length === 0) {
          const res = await fetch("/api/workspaces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `${session.user.name}'s Workspace` }),
          });
          if (!res.ok) return;
          const { workspaceSlug, boardId } = await res.json();
          router.replace(`/workspace/${workspaceSlug}/board/${boardId}`);
          return;
        }

        const boards = await fetch(`/api/workspaces/${ws.id}/boards`).then(r => r.json());
        if (Array.isArray(boards) && boards.length > 0) {
          router.replace(`/workspace/${ws.slug}/board/${boards[0].id}`);
        } else {
          router.replace(`/workspace/${ws.slug}`);
        }
      });
  }, [session, isPending, router]);

  return null;
}
