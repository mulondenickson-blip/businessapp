"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  description: string;
  read: boolean;
  pinned: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: Date;
};

type Props = { notifications: Notification[] };

const TYPE_ICONS: Record<string, string> = {
  welcome: "🎉",
  workspace_invite: "📨",
  task_assigned: "✅",
  task_updated: "📝",
  member_joined: "👥",
  member_left: "👋",
  project_created: "📋",
  mention: "💬",
  system: "🔔",
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

type Tab = "all" | "unread" | "system";

export default function NotificationsClient({ notifications: initial }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "system") return n.type === "welcome" || n.type === "system";
    return true;
  });

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
  }

  async function markAllRead() {
    setIsLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setIsLoading(false);
  }

  async function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
  }

  async function clearAll() {
    setIsLoading(true);
    setNotifications((prev) => prev.filter((n) => n.pinned));
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    setIsLoading(false);
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You are all caught up!"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={isLoading}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50 transition"
            >
              Mark all read
            </button>
          )}
          {notifications.filter((n) => !n.pinned).length > 0 && (
            <button
              onClick={clearAll}
              disabled={isLoading}
              className="text-xs font-medium text-gray-500 hover:text-rose-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-rose-50 hover:border-rose-200 transition"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {(["all", "unread", "system"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition capitalize",
              activeTab === tab
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {tab}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-16 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-sm font-medium text-gray-500">
            {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              className={[
                "group rounded-xl border bg-white p-5 transition",
                !notification.read
                  ? "border-indigo-100 bg-indigo-50/30"
                  : "border-gray-100 hover:border-gray-200",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">

                {/* Icon */}
                <div className={[
                  "h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                  !notification.read ? "bg-indigo-100" : "bg-gray-100",
                ].join(" ")}>
                  {TYPE_ICONS[notification.type] ?? "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                      {notification.pinned && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                          Pinned
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {notification.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center gap-3 mt-3">
                    {notification.actionUrl && notification.actionLabel && (
                      <Link
                        href={notification.actionUrl}
                        onClick={() => {
                          if (!notification.read) void markAsRead(notification.id);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition"
                      >
                        {notification.actionLabel} →
                      </Link>
                    )}
                    {!notification.read && (
                      <button
                        onClick={() => void markAsRead(notification.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition"
                      >
                        Mark as read
                      </button>
                    )}
                    {!notification.pinned && (
                      <button
                        onClick={() => void deleteNotification(notification.id)}
                        className="text-xs text-gray-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}