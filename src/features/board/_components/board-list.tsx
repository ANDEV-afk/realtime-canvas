"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FileText, MoreHorizontal, Pencil, Trash2, Copy, FolderInput, Download } from "lucide-react";
import { MoveBoardModal } from "@/features/board/_components/MoveBoardModal";
import { toast } from "sonner";
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
  DropdownMenuSeparator,
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
  workspaceId?: string;
  onBoardsChange?: () => void;
}

export function BoardList({ boards, workspaceSlug, workspaceId, onBoardsChange }: BoardListProps) {
  const router = useRouter();
  const params = useParams();
  const currentBoardId = params?.boardId as string | undefined;
  const [search, setSearch] = useState("");
  const [localBoards, setLocalBoards] = useState<Board[]>(boards);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameBoardId, setRenameBoardId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [moveBoardId, setMoveBoardId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [loading,setLoading] = useState(false);

  useEffect(() => {
    setLocalBoards(boards);
  }, [boards]);

  const filtered = localBoards.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));

  const handleRename = async () => {
    if (!renameBoardId || !renameTitle.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/boards/${renameBoardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameTitle }),
    });
    if (res.ok) {
      setLocalBoards((prev) =>prev.map((b) => (b.id === renameBoardId ? { ...b, title: renameTitle } : b)));
      onBoardsChange?.();
    }
    setLoading(false);
    setRenameOpen(false);
    setRenameBoardId(null);
    setRenameTitle("");
  };  

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget.id;
    setLocalBoards((prev) => prev.filter((b) => b.id !== deletedId));
    await fetch(`/api/boards/${deletedId}`, { method: "DELETE" });
    if (deletedId === currentBoardId) {
      router.push(`/workspace/${workspaceSlug}`);
    }
    setDeleteTarget(null);
    onBoardsChange?.();
  };

  const handleDownload = async (boardId: string, boardTitle: string) => {
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error("Failed to fetch board data");
      const data = await res.json();
      const snapshot = data.snapshot || {}; // can be there also cannot be there.
      // 1. Safe title & Blob preparation
      const safeTitle = boardTitle.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "whiteboard";
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      // 2. Direct link trigger (Clean 4-liner download)
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeTitle}.tldraw`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Board downloaded successfully (.tldraw)");
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download board");
    }
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
                    <DropdownMenuContent align="end" sideOffset={4} className="w-52 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl p-1.5 shadow-2xl z-[99999]">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameBoardId(board.id);
                          setRenameTitle(board.title);
                          setRenameOpen(true);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer"
                      >
                        <Pencil className="size-4 text-zinc-400" />
                        Rename
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={async (e) => {e.stopPropagation();
                          try {
                            const res = await fetch(`/api/boards/${board.id}/duplicate`, { method: "POST" });
                            if (res.ok) {
                              const newBoard = await res.json();
                              setLocalBoards((prev) => [newBoard, ...prev]);
                              toast.success("Board duplicated successfully");
                              onBoardsChange?.();
                            } else {
                              toast.error("Failed to duplicate board");
                            }
                          } catch {
                            toast.error("Failed to duplicate board");
                          }
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer"
                      >
                        <Copy className="size-4 text-emerald-400" />
                        Duplicate
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(board.id, board.title);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer"
                      >
                        <Download className="size-4 text-purple-400" />
                        Download
                      </DropdownMenuItem>

                      {workspaceId && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveBoardId(board.id);
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer"
                        >
                          <FolderInput className="size-4 text-blue-400" />
                          Move to workspace
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="bg-zinc-800 my-1.5" />

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: board.id, title: board.title })}}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="size-4 text-red-400" />
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

      {workspaceId && (
        <MoveBoardModal
          boardId={moveBoardId}
          currentWorkspaceId={workspaceId}
          open={!!moveBoardId}
          onOpenChange={(open) => { if (!open) setMoveBoardId(null); }}
          onMoved={(id) => {
            setLocalBoards((prev) => prev.filter((b) => b.id !== id));
            if (id === currentBoardId) {
              router.push(`/workspace/${workspaceSlug}`);
            }
            onBoardsChange?.();
          }}
        />
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl p-6 shadow-2xl z-[99999]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-100">Rename board</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="rename-title" className="text-sm font-medium text-zinc-300">Board name</Label>
              <Input
                id="rename-title"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Board name"
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-xl transition-all" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl p-6 shadow-2xl z-[99999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-zinc-100">Delete board</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-400">
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700 text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-500 text-sm font-medium">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
