"use client"

import { useParams } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
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
      
      {/* 1. Added relative to SidebarInset so absolute children anchor to it */}
      <SidebarInset className="p-0 relative h-screen w-full">
        
        {/* 2. Moved the trigger inside SidebarInset and changed fixed to absolute */}
        <div className="absolute top-1.5 left-2 z-[9999]">
          <SidebarTrigger className="rounded-lg h-9 w-9 flex items-center justify-center mr-3 cursor-pointer" />
        </div>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
