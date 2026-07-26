// components/ActiveUsers.tsx
"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ActiveUsers = () => {
  // Current Liveblocks room mein connected saare doosre users
  const others = useOthers();
  // Current logged-in user
  const self = useSelf();

  const maxVisibleAvatars = 3;
  const visibleOthers = others.slice(0, maxVisibleAvatars);
  const remainingCount = others.length - maxVisibleAvatars;

  return (
    <div className="flex shrink-0 items-center gap-1 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-sm relative z-[9999]">
      <TooltipProvider delayDuration={100}>
        <div className="flex items-center -space-x-2 overflow-visible">
          {/* Current Self Avatar */}
          {self && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-background uppercase transition-transform hover:z-10 hover:scale-105 pointer-events-auto"
                  style={{ backgroundColor: self.info?.color || "#3b82f6" }}
                >
                  {self.info?.name?.[0] || "U"}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs z-[9999]">
                You ({self.info?.name || "Anonymous"})
              </TooltipContent>
            </Tooltip>
          )}

          {/* Active Peers / Other Users Avatars */}
          {visibleOthers.map(({ connectionId, info }) => (
            <Tooltip key={connectionId}>
              <TooltipTrigger asChild>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-background uppercase transition-transform hover:z-10 hover:scale-105 pointer-events-auto"
                  style={{ backgroundColor: info?.color || "#10b981" }}
                >
                  {info?.name?.[0] || "G"}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs z-[9999]">
                {info?.name || "Guest User"}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Excess Users Counter Badge */}
          {remainingCount > 0 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background pointer-events-auto">
              +{remainingCount}
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Online Counter Text */}
      <span className="ml-2 text-xs font-medium text-muted-foreground">
        {others.length + 1} online
      </span>
    </div>
  );
};