"use client"

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Board = { id: string; title: string; updatedAt: string; createdBy: { name: string } | null };

interface BoardListProps {
  boards: Board[];
  workspaceSlug: string;
  onBoardsChange?: () => void;
}

export function BoardList({ boards, workspaceSlug, onBoardsChange }: BoardListProps) {
  const router = useRouter();
  const params = useParams();
  const currentBoardId = params?.boardId as string | undefined;
  const [search, setSearch] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameBoardId, setRenameBoardId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [loading,setLoading] = useState(false);

  const filtered = boards.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleRename = async () => {
    if (!renameBoardId || !renameTitle.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/boards/${renameBoardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameTitle }),
    });
    if (res.ok) {
      const board = await res.json();
      onBoardsChange?.();
      router.push(`/workspace/${workspaceSlug}/board/${renameBoardId}`);
    }
    setLoading(false);
    setRenameOpen(false);
    setRenameBoardId(null);
    setRenameTitle("");
    onBoardsChange?.(); // TODO: check if this is needed to be called here  
  };  

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/boards/${deleteTarget.id}`, { method: "DELETE" });
    if (deleteTarget.id === currentBoardId) {
      router.push(`/workspace/${workspaceSlug}`);
    }
    setDeleteTarget(null);
    onBoardsChange?.();
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Boards</SidebarGroupLabel>
        <SidebarInput
          placeholder="Search boards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <SidebarGroupContent>
          <SidebarMenu>
            {filtered.length === 0 && (
              <p className="px-3 text-xs text-muted-foreground">No boards found</p>
            )}
            {filtered.map((board) => (
              <SidebarMenuItem key={board.id}>
                <SidebarMenuButton
                  isActive={board.id === currentBoardId}
                  onClick={() => router.push(`/workspace/${workspaceSlug}/board/${board.id}`)}
                  className="group pr-1"
                >
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">{board.title}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click(); }}
                        className="ml-auto flex size-6 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent transition-opacity"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4} className="w-36">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameBoardId(board.id);
                          setRenameTitle(board.title);
                          setRenameOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: board.id, title: board.title });
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename board</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="rename-title">Board name</Label>
              <Input
                id="rename-title"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Board name"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
