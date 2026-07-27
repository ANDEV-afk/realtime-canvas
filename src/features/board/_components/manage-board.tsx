"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Copy, Check, Crown, Trash2, Users, Settings2, Loader2, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { toast } from "sonner";

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

interface ManageBoardProps {
  workspace: { id: string; name: string; slug: string; inviteCode?: string } | null;
  onWorkspaceUpdate?: (workspace: { id: string; name: string; slug: string; inviteCode?: string }) => void;
}

export default function ManageBoard({ workspace, onWorkspaceUpdate }: ManageBoardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [memberToTransfer, setMemberToTransfer] = useState<Member | null>(null);

  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = workspace && session && members.some(
  (m) => m.user.id === session.user.id && m.role === "OWNER");

  useEffect(() => {
    setWorkspaceName(workspace?.name || "");
  }, [workspace?.name]);

  const fetchMembers = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      toast.error("Failed to load members");
    }
    setLoading(false);
  }, [workspace]);

  useEffect(() => {
    if (open && workspace) {
      fetchMembers();
    }
  }, [open, workspace, fetchMembers]);

  // FIX: Direct Fixed Invite Code Link
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = workspace?.inviteCode
  ? `${origin}/invite/${workspace.inviteCode}`
  : `${origin}/workspace/${workspace?.slug}/invite`;

  const handleCopyInviteLink = async () => {
    if (!workspace) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async () => {
    if (!workspace || !memberToRemove) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberToRemove.id }),
      });
      if (res.ok) {
        toast.success(`${memberToRemove.user.name} has been removed`);
        setMemberToRemove(null);
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleTransferOwnership = async () => {
    if (!workspace || !memberToTransfer) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/transfer-ownership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberToTransfer.id }),
      });
      if (res.ok) {
        toast.success(`Ownership transferred to ${memberToTransfer.user.name}`);
        setMemberToTransfer(null);
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to transfer ownership");
      }
    } catch {
      toast.error("Failed to transfer ownership");
    }
  };

  const handleSaveName = async () => {
    if (!workspace || !workspaceName.trim() || workspaceName === workspace.name) return;
    setNameSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      if (res.ok) {
        toast.success("Workspace name updated");
        onWorkspaceUpdate?.({ ...workspace, name: workspaceName.trim() });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update name");
        setWorkspaceName(workspace.name);
      }
    } catch {
      toast.error("Failed to update name");
      setWorkspaceName(workspace.name);
    }
    setNameSaving(false);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Workspace deleted");
        setDeleteConfirmOpen(false);
        router.push("/workspace");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete workspace");
      }
    } catch {
      toast.error("Failed to delete workspace");
    }
    setDeleteLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER": return "default";
      case "VIEWER": return "outline";
      default: return "secondary";
    }
  };

  return (
    <>
      <SidebarMenu className="mt-2 px-2">
        <SidebarMenuItem>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <SidebarMenuButton className="flex items-center justify-center cursor-pointer font-semibold text-left rounded-full leading-tight font-medium">
                <Settings />
                Manage
              </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Workspace</DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="members" className="flex-1">
                    <Users className="mr-1.5 h-4 w-4" />
                    Members
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1">
                    <Settings2 className="mr-1.5 h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Invite teammates</Label>
                      <Button 
                        onClick={handleCopyInviteLink} 
                        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium flex items-center justify-center gap-2 py-2.5 rounded-lg border-none shadow-none"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Link Copied!
                          </>
                        ) : (
                          <>
                            <span>Copy Invite link</span>
                            <Copy className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>

                  <div className="space-y-3 pt-2">
                    <Label>Members ({members.length})</Label>
                    {loading ? (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading members...
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar size="sm">
                                <AvatarFallback>
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {member.user.name}
                                  {member.user.id === session?.user.id && (
                                    <span className="text-muted-foreground ml-1">(You)</span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {member.user.email}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getRoleBadgeVariant(member.role)}>
                                {member.role}
                              </Badge>
                              {isOwner && member.user.id !== session?.user.id && (
                                <div className="flex gap-1">
                                  {member.role !== "OWNER" && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => setMemberToTransfer(member)}
                                      title="Transfer ownership"
                                    >
                                      <Crown className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setMemberToRemove(member)}
                                    title="Remove member"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="workspace-name"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        disabled={!isOwner}
                      />
                      {isOwner && workspaceName !== workspace?.name && (
                        <Button
                          onClick={handleSaveName}
                          disabled={nameSaving || !workspaceName.trim()}
                          size="sm"
                        >
                          {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={workspace?.slug || ""} disabled />
                  </div>

                  {isOwner && (
                    <div className="space-y-2 pt-4 border-t border-destructive/20">
                      <Label className="text-destructive">Danger Zone</Label>
                      <p className="text-sm text-muted-foreground">
                        Deleting this workspace will permanently remove all boards and data.
                      </p>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Workspace
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Delete / Transfer / Remove Modals */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => { if (!open) setMemberToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user.name} from this workspace?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!memberToTransfer} onOpenChange={(open) => { if (!open) setMemberToTransfer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer ownership to {memberToTransfer?.user.name}? You will become an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransferOwnership}>
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{workspace?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}