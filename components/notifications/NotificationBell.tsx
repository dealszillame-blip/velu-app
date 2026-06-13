"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, string>;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const pathname = usePathname();
  const messagesBase = pathname.startsWith("/builder")
    ? "/builder/messages"
    : "/buyer/messages";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnread(data.unread ?? 0);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((count) => Math.max(0, count - 1));
  }

  function notificationHref(item: NotificationItem): string | null {
    const listingId = item.metadata?.listing_id;
    if (item.type === "new_lead" && listingId) {
      return `/builder/leads/${listingId}`;
    }
    if (item.type === "message_received" && item.metadata?.inquiry_id) {
      return `${messagesBase}?thread=${item.metadata.inquiry_id}`;
    }
    if (item.type === "proposal_received") {
      return "/buyer/compare";
    }
    if (item.type === "proposal_accepted" && item.metadata?.project_id) {
      return `/builder/project/${item.metadata.project_id}`;
    }
    if (item.type === "milestone_update" && item.metadata?.project_id) {
      return `/buyer/project/${item.metadata.project_id}`;
    }
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="size-[18px]" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-card shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]">
            <div className="border-b border-black/[0.06] px-4 py-3">
              <p className="font-semibold tracking-tight">Notifications</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  All caught up
                </p>
              ) : (
                notifications.map((item) => {
                  const href = notificationHref(item);
                  const content = (
                    <div
                      className={cn(
                        "border-b border-black/[0.04] px-4 py-3.5 last:border-b-0 transition-colors hover:bg-muted/50",
                        !item.is_read && "bg-muted/30"
                      )}
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  );

                  return href ? (
                    <Link
                      key={item.id}
                      href={href}
                      onClick={() => {
                        if (!item.is_read) markRead(item.id);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      type="button"
                      className="block w-full text-left"
                      onClick={() => {
                        if (!item.is_read) markRead(item.id);
                      }}
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
