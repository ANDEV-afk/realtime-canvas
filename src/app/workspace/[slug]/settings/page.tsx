"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSettingsForm } from "./workspace-settings-form";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { data: session, isPending } = useSession();
  const [workspace, setWorkspace] = useState<{ id: string; name: string; slug: string; icon: string | null } | null>(null);

  // Ensure dark mode is active on mount to prevent white flash
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.replace("/login"); return; }
    if (!slug) return;

    fetch("/api/workspaces")
      .then(r => r.json())
      .then(workspaces => {
        if (!Array.isArray(workspaces)) { router.replace("/workspace"); return; }
        const ws = workspaces.find((w: { slug: string }) => w.slug === slug);
        if (!ws) router.replace("/workspace");
        else setWorkspace(ws);
      });
  }, [session, isPending, slug, router]);

  if (isPending || !workspace) {
    return (
      <div className="mx-auto max-w-2xl p-6 bg-zinc-950 min-h-screen">
        <Skeleton className="h-8 w-48 mb-6 bg-zinc-900" />
        <Skeleton className="h-32 w-full bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 bg-zinc-950 min-h-screen text-foreground">
      <h1 className="text-2xl font-semibold mb-6">Workspace settings</h1>
      <WorkspaceSettingsForm workspace={workspace} />
    </div>
  );
}
