"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Upload, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { calculateFileHash } from "@/lib/crypto";

interface WorkspaceSettingsFormProps {
  workspace: { id: string; name: string; slug: string; icon: string | null };
}

// FIX: ek icon value teen tarah ki ho sakti hai -
//  1. data:/blob: (local preview) - directly usable
//  2. http(s) URL jo S3 nahi hai (public/CDN) - directly usable
//  3. raw S3 key (ya S3 URL) - NEEDS presigned URL fetch, kabhi bhi
//     directly <Image src> mein mat daalo, warna broken/blank flash
//     hota hai jab tak presigned fetch resolve na ho.
function isDirectlyUsableUrl(url: string): boolean {
  if (url.startsWith("data:") || url.startsWith("blob:")) return true;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return !url.includes("amazonaws.com") && !url.includes("s3");
  }
  return false;
}

export function WorkspaceSettingsForm({ workspace }: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState(workspace.name);
  const [icon, setIcon] = useState(workspace.icon);

  const initialIcon = workspace.icon || session?.user?.image || null;

  // FIX: displayUrl sirf tab set hoti hai jab woh directly usable ho.
  // Raw S3 key ko yahan kabhi mat daalo - blink isi se hota tha.
  const [displayUrl, setDisplayUrl] = useState<string | null>(
    initialIcon && isDirectlyUsableUrl(initialIcon) ? initialIcon : null
  );

  // FIX: naya loading state - jab tak presigned URL resolve nahi hota,
  // spinner dikhao (blank box ya broken image ki jagah). Ye isUploading
  // se alag hai - ye "existing icon load ho raha hai" ke liye hai.
  const [isResolvingIcon, setIsResolvingIcon] = useState<boolean>(
    !!initialIcon && !isDirectlyUsableUrl(initialIcon)
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Helper function to resolve presigned S3 view URL
  const resolveImageUrl = useCallback(async (rawIcon: string | null) => {
    if (!rawIcon) {
      setDisplayUrl(null);
      setIsResolvingIcon(false);
      return;
    }

    // FIX: agar already directly usable hai (local preview / public URL),
    // turant set karo - koi resolving zaroori nahi.
    if (isDirectlyUsableUrl(rawIcon)) {
      setDisplayUrl(rawIcon);
      setIsResolvingIcon(false);
      return;
    }

    // Yahan se aage rawIcon ek S3 key/URL hai jo bina presign ke load
    // nahi hogi - is dauraan displayUrl ko CHHEDO mat (raw key set mat
    // karo), bas resolving flag on rakho taaki UI spinner dikhaye.
    setIsResolvingIcon(true);

    let key = rawIcon;
    if (rawIcon.startsWith("http://") || rawIcon.startsWith("https://")) {
      try {
        const urlObj = new URL(rawIcon);
        key = urlObj.pathname.startsWith("/")
          ? urlObj.pathname.slice(1)
          : urlObj.pathname;
      } catch {
        key = rawIcon;
      }
    }

    try {
      const res = await fetch(
        `/api/upload/presigned/get?key=${encodeURIComponent(key)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setDisplayUrl(data.url);
          setImageError(false);
          setIsResolvingIcon(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error resolving presigned image URL:", err);
    }

    // FIX: fallback mein raw (unusable) key ko src mat banao - null
    // rakho taaki initials fallback saaf se dikhe, broken image nahi.
    setDisplayUrl(null);
    setIsResolvingIcon(false);
  }, []);

  useEffect(() => {
    setName(workspace.name);
    const currentIcon = workspace.icon || session?.user?.image || null;
    setIcon(currentIcon);
    setImageError(false);

    if (!currentIcon) {
      setDisplayUrl(null);
      setIsResolvingIcon(false);
      return;
    }

    // FIX: sirf directly-usable URLs turant set karo. S3 keys ke liye
    // resolveImageUrl ko hi displayUrl set karne do (spinner dikhega
    // is dauraan, blink nahi).
    if (isDirectlyUsableUrl(currentIcon)) {
      setDisplayUrl(currentIcon);
      setIsResolvingIcon(false);
    } else {
      setIsResolvingIcon(true);
      resolveImageUrl(currentIcon);
    }
  }, [workspace, session, resolveImageUrl]);

  const userName = session?.user?.name || workspace.name;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      file.type.startsWith("video/") ||
      /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v|3gp)$/i.test(file.name)
    ) {
      toast.error("Video files are not allowed for profile photos.");
      return;
    }

    // Immediate preview for snappy UI (blob: URL is directly usable, safe)
    const localPreview = URL.createObjectURL(file);
    setDisplayUrl(localPreview);
    setIsResolvingIcon(false);

    setIsUploading(true);
    setImageError(false);

    try {
      // 🎯 Step 1: Client side SHA-256 Hash generate karo
      const fileHash = await calculateFileHash(file);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileHash", fileHash);//Step 2: Hash backend API route ko bhej do

      const res = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload profile photo");

      const data = await res.json();
      const savedKeyOrUrl = data.key || data.url;

      if (savedKeyOrUrl) {
        setIcon(savedKeyOrUrl);

        await resolveImageUrl(savedKeyOrUrl);

        await fetch(`/api/workspaces/${workspace.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, icon: savedKeyOrUrl }),
        });

        await authClient
          .updateUser({ image: savedKeyOrUrl })
          .catch((err) =>
            console.warn("Failed to update user account image:", err)
          );

        toast.success(data.isDuplicate
            ? "Reused existing image"
            : "Profile photo updated successfully across your account and workspace"
        );
        window.dispatchEvent(new Event("workspaces-changed"));
        router.refresh();
      }
    } catch (err) {
      console.error("Profile photo upload error:", err);
      toast.error("Failed to upload profile photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon }),
      });

      if (!res.ok) throw new Error("Failed to update workspace");

      toast.success("Workspace updated successfully");
      window.dispatchEvent(new Event("workspaces-changed"));
      router.refresh();
      router.push(`/workspace/${workspace.slug}`);
    } catch (err) {
      console.error("Update workspace error:", err);
      toast.error("Failed to update workspace");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Workspace Profile Photo</Label>
          <div className="flex items-center gap-6">
            <div className="h-32 w-32 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-border/60 shadow-lg flex items-center justify-center relative group">
              {isUploading || isResolvingIcon ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : displayUrl && !imageError ? (
                <Image
                  src={displayUrl}
                  alt={userName}
                  fill
                  unoptimized
                  priority
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-primary gap-1">
                  <span className="text-3xl font-extrabold tracking-wider">
                    {initials}
                  </span>
                </div>
              )}
              <label
                htmlFor="workspace-icon-upload"
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
              >
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium">Change</span>
              </label>
            </div>
            <div className="space-y-2">
              <input
                type="file"
                id="workspace-icon-upload"
                className="hidden"
                accept="image/*"
                onChange={handleIconUpload}
                disabled={isUploading}
              />
              <Label
                htmlFor="workspace-icon-upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload profile photo"}
              </Label>
              <p className="text-xs text-muted-foreground">
                Square image, PNG or JPG up to 100MB. Stored securely.Updates your
                account profile across the project.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Workspace name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={workspace.slug} disabled />
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-lg font-medium text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting this workspace will permanently remove all boards and data.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete workspace</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete workspace</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{workspace.name}&rdquo;?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const res = await fetch(`/api/workspaces/${workspace.id}`, {
                    method: "DELETE",
                  });
                  if (res.ok) {
                    window.dispatchEvent(new Event("workspaces-changed"));
                    router.push("/workspace");
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}