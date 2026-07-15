"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Workspace = { id: string; name: string; slug: string };

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentSlug: string;
}

export function WorkspaceSwitcher({ workspaces, currentSlug }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const current = workspaces.find((w) => w.slug === currentSlug);
  const [open, setOpen] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{current?.name ?? "Select workspace"}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)" sideOffset={4}>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.slug}`)}
                className={ws.slug === currentSlug ? "bg-accent" : ""}
              >
                <LayoutDashboard className="size-4" />
                {ws.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="size-4" />
                  Create workspace
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create workspace</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const name = form.get("name") as string;
                    if (!name?.trim()) return;
                    setOpen(false);
                    const res = await fetch("/api/workspaces", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name }),
                    });
                    if (res.ok) {
                      const { workspaceSlug, boardId } = await res.json();
                      router.push(`/workspace/${workspaceSlug}/board/${boardId}`);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Workspace name</Label>
                    <Input id="name" name="name" placeholder="My workspace" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Create
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
