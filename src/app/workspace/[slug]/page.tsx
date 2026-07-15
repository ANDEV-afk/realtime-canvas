"use client"

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function WorkspaceSlugPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending || !slug) return;
    if (!session) { router.replace("/login"); return; }

    fetch("/api/workspaces")
      .then(r => r.json())
      .then(async (workspaces) => {
        if (!Array.isArray(workspaces)) { router.replace("/workspace"); return; }
        const workspace = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!workspace) { router.replace("/workspace"); return; }

        const boards = await fetch(`/api/workspaces/${workspace.id}/boards`).then(r => r.json());
        if (Array.isArray(boards) && boards.length > 0) {
          router.replace(`/workspace/${slug}/board/${boards[0].id}`);
        }
      });
  }, [session, isPending, slug, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">No boards in this workspace. Create one from the sidebar.</p>
    </div>
  );
}
