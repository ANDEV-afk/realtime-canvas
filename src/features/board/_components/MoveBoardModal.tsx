"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderInput, Loader2, LayoutDashboard, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

interface MoveBoardModalProps {
  boardId: string | null;
  currentWorkspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: (boardId: string) => void;
}

export function MoveBoardModal({
  boardId,
  currentWorkspaceId,
  open,
  onOpenChange,
  onMoved,
}: MoveBoardModalProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>("");
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (open && boardId) {
      setIsLoadingWorkspaces(true);
      fetch("/api/workspaces").then((res) => res.json()).then((data) => {
          if (Array.isArray(data)) {
            const filtered = data.filter((w: Workspace) => w.id !== currentWorkspaceId);
            setWorkspaces(filtered);
            if (filtered.length > 0) {
              setTargetWorkspaceId(filtered[0].id);
            }
          }
        })
        .catch(() => toast.error("Failed to load workspaces"))
        .finally(() => setIsLoadingWorkspaces(false));
    }
  }, [open, boardId, currentWorkspaceId]);

  const handleMove = async () => {
    if (!boardId || !targetWorkspaceId) {
      toast.error("Please select a target workspace");
      return;
    }

    setIsMoving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetWorkspaceId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to move board");
      }

      toast.success("Board moved successfully!");
      if (boardId) onMoved?.(boardId);
      onOpenChange(false);
      router.refresh();
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Failed to move board");
    } finally {
      setIsMoving(false);
    }
  };

  if (!boardId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl p-6 shadow-2xl z-[99999]">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-semibold text-zinc-100 flex items-center gap-2.5">
            <FolderInput className="h-5 w-5 text-blue-500" />
            Move Board
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Select a destination workspace to move this board. All shapes and history will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <label className="text-sm font-medium text-zinc-300 block">Target Workspace</label>
          {isLoadingWorkspaces ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="py-8 text-center bg-zinc-950 border border-zinc-800/80 rounded-xl">
              <p className="text-sm text-zinc-400">No other workspaces available.</p>
              <p className="text-xs text-zinc-500 mt-1">Create another workspace first to move boards.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {workspaces.map((ws) => {
                const isSelected = targetWorkspaceId === ws.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => setTargetWorkspaceId(ws.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500 text-white shadow-sm"
                        : "bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center size-8 rounded-lg ${isSelected ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-400"}`}>
                        <LayoutDashboard className="size-4" />
                      </div>
                      <span className="text-sm font-medium">{ws.name}</span>
                    </div>
                    {isSelected && <Check className="size-4 text-blue-500" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isMoving || workspaces.length === 0 || !targetWorkspaceId}
            onClick={handleMove}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isMoving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Move Board</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
