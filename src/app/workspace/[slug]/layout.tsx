"use client"

import { useParams } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/features/sidebar/_components/app-sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar currentSlug={slug} />
      </TooltipProvider>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border/50 bg-sidebar/30 px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-foreground/80">{slug}</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
