"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

type Props = {
  displayName: string;
  username: string;
  profilePhoto: string | null;
  email: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/workspaces", icon: "📁", label: "My Workspaces" },
  { href: "/projects", icon: "📋", label: "Projects" },
  { href: "/tasks", icon: "✅", label: "Tasks" },
  { href: "/reports", icon: "📊", label: "Reports" },
];

export default function AppShell({
  displayName,
  username,
  profilePhoto,
  email,
  children,
}: Props) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className={[
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-30",
        sidebarOpen ? "w-56" : "w-16",
      ].join(" ")}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          {sidebarOpen && (
            <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
              MUNIX
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 overflow-hidden flex-shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-900 truncate">{displayName}</div>
                <div className="text-xs text-gray-400 truncate">@{username}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={[
        "flex-1 flex flex-col transition-all duration-300",
        sidebarOpen ? "ml-56" : "ml-16",
      ].join(" ")}>

        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm text-gray-500">
            {navItems.find((n) => n.href === pathname)?.label ?? "MUNIX"}
          </div>

          <div className="flex items-center gap-3">

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
              >
                🔔
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500" />
              </button>

              {/* Notifications Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="p-4 text-center text-sm text-gray-400 py-8">
                    You are all caught up!
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 overflow-hidden hover:ring-2 hover:ring-indigo-400 transition"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                  {/* User Info */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 overflow-hidden">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
                        <div className="text-xs text-gray-400 truncate">{email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>👤</span> View Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>⚙️</span> Account Settings
                    </Link>
                    <Link
                      href="/settings/notifications"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>🔔</span> Notification Preferences
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={() => void signOut({ redirectUrl: "/" })}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Overlay to close dropdowns */}
      {(profileOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setProfileOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </div>
  );
}