"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSwitcher } from "@/features/workspace/_components/workspace-switcher";
import { BoardList } from "@/features/board/_components/board-list";
import { CreateBoardButton } from "@/features/board/_components/create-board-button";
import { SidebarUser } from "./sidebar-user";
import { Separator } from "@/components/ui/separator";
import ManageBoard from "@/features/board/_components/manage-board";

interface AppSidebarProps {
  currentSlug: string;
}

type Workspace = { id: string; name: string; slug: string };
type Board = { id: string; title: string; updatedAt: string; createdBy: { name: string } | null };

export function AppSidebar({ currentSlug }: AppSidebarProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshBoards = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener("workspaces-changed", handler);
    return () => window.removeEventListener("workspaces-changed", handler);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.replace("/login"); return; }

    fetch("/api/workspaces")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        setWorkspaces(data);
        const current = data.find((w: Workspace) => w.slug === currentSlug);
        if (current) {
          fetch(`/api/workspaces/${current.id}/boards`)
            .then(r2 => r2.json())
            .then(b => setBoards(Array.isArray(b) ? b : []));
        }
      });
  }, [session, isPending, currentSlug, router, refreshKey]);

  if (isPending) {
    return (
      <Sidebar>
        <SidebarContent className="p-4 space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </SidebarContent>
      </Sidebar>
    );
  }

  if (!session) return null;

  const currentWorkspace = workspaces.find((w) => w.slug === currentSlug) || null;

  const handleWorkspaceUpdate = (updated: Workspace) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <WorkspaceSwitcher workspaces={workspaces} currentSlug={currentSlug} />
      </SidebarHeader>
      <Separator className="md-2"/>
      <SidebarContent>
        <ManageBoard workspace={currentWorkspace} onWorkspaceUpdate={handleWorkspaceUpdate}/>
        <Separator/>
        <BoardList boards={boards} workspaceSlug={currentSlug} workspaceId={currentWorkspace?.id} onBoardsChange={refreshBoards} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <CreateBoardButton workspaceSlug={currentSlug} onCreated={refreshBoards} />
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator/>
        <SidebarUser user={session.user} workspaceSlug={currentSlug} />
      </SidebarFooter>
    </Sidebar>
  );
}
