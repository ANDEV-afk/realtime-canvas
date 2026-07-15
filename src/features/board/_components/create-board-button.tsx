"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
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

interface CreateBoardButtonProps {
  workspaceSlug: string;
}

export function CreateBoardButton({ workspaceSlug }: CreateBoardButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleCreate = async (formData: FormData) => {
    const title = formData.get("title") as string;
    setOpen(false);

    const wsRes = await fetch("/api/workspaces");
    if (!wsRes.ok) return;
    const workspaces = await wsRes.json();
    const workspace = workspaces.find((w: { slug: string }) => w.slug === workspaceSlug);
    if (!workspace) return;

    const res = await fetch(`/api/workspaces/${workspace.id}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const board = await res.json();
      router.push(`/workspace/${workspaceSlug}/board/${board.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton className="bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20 data-[active=true]:bg-sidebar-primary/20 font-medium">
          <Plus className="size-4" />
          <span>Create board</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
        </DialogHeader>
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-title">Board name</Label>
            <Input id="board-title" name="title" placeholder="Untitled" autoFocus />
          </div>
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
