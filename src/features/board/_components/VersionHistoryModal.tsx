"use client";

import { useState, useEffect, useMemo } from "react";
import { useEditor } from "tldraw";
import { History, Save, RotateCcw, Clock, Loader2, Search, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  name: string | null;
  image: string | null;
}

interface Version {
  id: string;
  version: number;
  createdAt: string;
  createdBy: User;
}

interface VersionHistoryModalProps {
  boardId: string;
  isOwner: boolean;
}

// Custom Helper component to automatically resolve S3 keys to valid presigned view URLs
function UserAvatar({ image, name, className }: { image?: string | null; name?: string | null; className?: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(image || null);

  const authorName = name || "Unknown User";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  useEffect(() => {
    // Whenever image prop changes, sync immediately
    setAvatarUrl(image || null);

    if (!image) return;

    if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) {
      setAvatarUrl(image);
      return;
    }

    let isMounted = true;
    const cleanKey = image.startsWith("/") ? image.slice(1) : image;

    fetch(`/api/upload/presigned/get?key=${encodeURIComponent(cleanKey)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.url && isMounted) {
          setAvatarUrl(data.url);
        }
      })
      .catch((err) => console.error("Error fetching avatar:", err));

    return () => {
      isMounted = false;
    };
  }, [image]);

  return (
    <Avatar className={className}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={authorName} onError={() => setAvatarUrl(null)} />
      ) : null}
      <AvatarFallback className="rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function VersionHistoryModal({ boardId, isOwner }: VersionHistoryModalProps) {
  const editor = useEditor();
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [restoringVersion, setRestoringVersion] = useState<Version | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch Version History List
  // Fetch Version History List
    const fetchVersions = async () => {
      setLoading(true);
      try {
        // Timestamp + no-store tabhi direct fresh user data laaye ga
        const res = await fetch(`/api/boards/${boardId}/versions?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setVersions(data);
        } else {
          toast.error("Failed to fetch versions");
        }
      } catch {
        toast.error("Something went wrong while fetching versions");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (open) fetchVersions();
  }, [open]);

  // Filtered versions based on search query
  const filteredVersions = useMemo(() => {
    if (!searchQuery.trim()) return versions;
    const q = searchQuery.toLowerCase();
    return versions.filter(
      (v) =>
        `version${v.version}`.includes(q) ||
        v.createdBy?.name?.toLowerCase().includes(q) ||
        new Date(v.createdAt).toLocaleString().toLowerCase().includes(q)
    );
  }, [versions, searchQuery]);

  // Create Snapshot Version
  const handleSaveVersion = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const currentSnapshot = editor.getSnapshot();

      const res = await fetch(`/api/boards/${boardId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: currentSnapshot }),
      });

      if (!res.ok) throw new Error();

      toast.success("New version checkpoint saved successfully!");
      fetchVersions();
    } catch {
      toast.error("Failed to save current version");
    } finally {
      setSaving(false);
    }
  };

  // Restore Snapshot
  const confirmRestoreVersion = async () => {
    if (!restoringVersion) return;
    if (!isOwner) {
      toast.error("Only the board owner can restore versions");
      return;
    }

    setIsRestoring(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/versions/${restoringVersion.id}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error();

      toast.success(`Successfully restored Version ${restoringVersion.version}! Reloading canvas...`);
      setOpen(false);
      setRestoringVersion(null);

      window.location.reload();
    } catch {
      toast.error("Failed to restore version");
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-full text-foreground hover:bg-accent flex items-center gap-1.5 cursor-pointer text-xs font-medium border border-border/40 shadow-xs"
            title="Version History"
          >
            <History className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Versions</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[580px] p-0 z-[99999] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 pb-3 border-b bg-muted/20 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold tracking-tight">Version History</DialogTitle>
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs rounded-full font-semibold">
                    {versions.length} {versions.length === 1 ? "checkpoint" : "checkpoints"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Explore checkpoints, save manual snapshots, or restore previous versions.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-5 pt-3.5 space-y-3">
            {/* Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {isOwner && (
                <Button
                  onClick={handleSaveVersion}
                  disabled={saving}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving Checkpoint..." : "Save Current Version"}
                </Button>
              )}

              {versions.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search versions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-muted/40 border-border/65 focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Versions List Scroll Area */}
            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <p>Loading version checkpoints...</p>
                </div>
              ) : filteredVersions.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-2xl bg-muted/10 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">No versions found</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {searchQuery
                      ? "No checkpoints match your search query."
                      : "Save your first version checkpoint to easily track and restore changes anytime."}
                  </p>
                </div>
              ) : (
                filteredVersions.map((v, idx) => {
                  const isLatest = idx === 0 && !searchQuery;
                  const authorName = v.createdBy?.name || "Unknown User";

                  return (
                    <div
                      key={v.id}
                      className="p-3.5 border border-border/60 rounded-xl bg-card/60 hover:bg-muted/40 transition-all duration-200 flex items-center justify-between group shadow-2xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          image={v.createdBy?.image}
                          name={v.createdBy?.name}
                          className="h-9 w-9 rounded-xl border border-border/50"
                        />

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              Version {v.version}
                            </span>
                            {isLatest && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0 h-4 font-semibold">
                                Latest
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{authorName}</span>
                            <span>•</span>
                            <span>
                              {new Date(v.createdAt).toLocaleDateString()} at{" "}
                              {new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRestoringVersion(v)}
                          className="h-8 text-xs px-3 rounded-lg gap-1.5 border-border/80 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer font-medium shadow-2xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoringVersion} onOpenChange={(open) => !open && setRestoringVersion(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md p-6 shadow-2xl z-[999999]">
          <AlertDialogHeader className="space-y-3 text-left">
            {/* Warning Badge Icon */}
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <AlertDialogTitle className="text-lg font-bold tracking-tight text-foreground">
                Restore Version {restoringVersion?.version}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                This will overwrite your current canvas with the snapshot saved on{" "}
                <span className="font-semibold text-foreground">
                  {restoringVersion &&
                    new Date(restoringVersion.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                  at{" "}
                  {restoringVersion &&
                    new Date(restoringVersion.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </span>
                . Any unsaved changes on the current canvas will be replaced.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-5 flex items-center justify-end gap-2">
            <AlertDialogCancel
              disabled={isRestoring}
              className="rounded-xl h-9 text-xs font-medium px-4 border-border/80 hover:bg-accent cursor-pointer m-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRestoring}
              onClick={(e) => {
                e.preventDefault();
                confirmRestoreVersion();
              }}
              className="rounded-xl h-9 text-xs font-semibold px-4 bg-amber-500 hover:bg-amber-400 text-black dark:text-black gap-2 shadow-sm transition-all cursor-pointer m-0"
            >
              {isRestoring && <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />}
              {isRestoring ? "Restoring..." : "Yes, Restore Version"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}