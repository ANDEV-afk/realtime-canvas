"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarUserProps {
  user: { name: string; email: string; image?: string | null };
  workspaceSlug: string;
}

export function SidebarUser({ user: initialUser, workspaceSlug }: SidebarUserProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user || initialUser;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const rawImage = user?.image;
    if (!rawImage) {
      setAvatarUrl(null);
      return;
    }

    if (rawImage.startsWith("data:") || rawImage.startsWith("blob:")) {
      setAvatarUrl(rawImage);
      return;
    }

    // Extract S3 key if rawImage is a full URL or relative path
    let key = rawImage;
    if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
      try {
        const urlObj = new URL(rawImage);
        key = urlObj.pathname.startsWith("/")
          ? urlObj.pathname.slice(1)
          : urlObj.pathname;
      } catch {
        key = rawImage;
      }
    }

    // Fetch temporary signed URL for S3 key
    fetch(`/api/upload/presigned/get?key=${encodeURIComponent(key)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.url) {
          setAvatarUrl(data.url);
        } else {
          setAvatarUrl(rawImage);
        }
      })
      .catch(() => {
        setAvatarUrl(rawImage);
      });
  }, [user?.image]);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar size="sm" className="rounded-lg overflow-hidden">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={user.name} className="object-cover h-full w-full" />
                ) : null}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-56">
            <DropdownMenuItem onClick={() => router.push(`/workspace/${workspaceSlug}/settings`)}>
              <Settings2 className="size-4" />
              Workspace settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => authClient.signOut().then(() => router.push("/login"))}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}