"use client";

import { useInboxNotifications, useUnreadInboxNotificationsCount } from "@liveblocks/react/suspense";
import { InboxNotification, InboxNotificationList } from "@liveblocks/react-ui";
import { Bell, BellOff, CheckCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationCenter() {
  const { inboxNotifications } = useInboxNotifications();
  const { count } = useUnreadInboxNotificationsCount();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center h-10 w-10 rounded-lg text transition-colors cursor-pointer outline-none group border-none bg-transparent shadow-none shrink-0"
          title="Notifications"
        >
          {/* Bell Icon matched with Comment Icon scale */}
          <span className="flex items-center justify-center pointer-events-none transition-transform group-hover:scale-105">
            <Bell className="w-6 h-6 stroke-2 mt-1.5" />
          </span>

          {/* Clean Glowing Unread Badge */}
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 z-20 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(37,99,235,0.6)] animate-pulse pointer-events-none">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 z-999999 bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-xl text-popover-foreground overflow-hidden dark:bg-zinc-900/95 dark:border-zinc-800/80 dark:text-zinc-100"
      >
        {/* Header Bar */}
        <div className="px-3.5 py-2.5 border-b border-border bg-muted/50 flex items-center justify-between dark:border-zinc-800/80 dark:bg-zinc-950/40">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <h4 className="text-xs font-semibold tracking-wide text-foreground dark:text-zinc-200">Notifications</h4>
          </div>

          <div className="flex items-center gap-2">
            {count > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-medium">
                {count} new
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground dark:text-zinc-500 font-medium flex items-center gap-1">
                <CheckCheck className="w-3 h-3 text-muted-foreground dark:text-zinc-500" /> Caught up
              </span>
            )}
          </div>
        </div>

        {/* List Content Area */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/50 dark:divide-zinc-800/50">
          {inboxNotifications.length === 0 ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center mb-2.5 text-muted-foreground dark:bg-zinc-800/60 dark:border-zinc-700/40 dark:text-zinc-500">
                <BellOff className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-foreground dark:text-zinc-300">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground dark:text-zinc-500 mt-0.5">
                Mentions and thread replies will appear here
              </p>
            </div>
          ) : (
            <InboxNotificationList>
              {inboxNotifications.map((notification) => (
                <InboxNotification
                  key={notification.id}
                  inboxNotification={notification}
                />
              ))}
            </InboxNotificationList>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}