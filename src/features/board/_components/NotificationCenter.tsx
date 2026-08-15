"use client";

import {useInboxNotifications,useUnreadInboxNotificationsCount} from "@liveblocks/react/suspense";
import {InboxNotification,InboxNotificationList} from "@liveblocks/react-ui";
import { Bell } from "lucide-react";
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
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-800 transition isolate shrink-0 select-none"
          title="Notifications"
        >
          {/* Bell Icon Wrapper to block Liveblocks CSS injection */}
          <span className="flex items-center justify-center pointer-events-none">
            <Bell className="w-4 h-4 stroke-2" />
          </span>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 z-10 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md pointer-events-none">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-95 p-0 bg-zinc-900 border-zinc-800 shadow-xl"
      >
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-zinc-200">Notifications</h4>
          <span className="text-[10px] text-zinc-500">{count} unread</span>
        </div>

        <div className="max-h-90 overflow-y-auto">
          {inboxNotifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No notifications yet
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