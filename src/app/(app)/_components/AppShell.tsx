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

const mainNavItems = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/workspaces", icon: "📁", label: "My Workspaces" },
  { href: "/calendar", icon: "📅", label: "Calendar" },
  { href: "/inbox", icon: "📨", label: "Inbox" },
  { href: "/activity", icon: "🕐", label: "Recent Activity" },
  { href: "/notifications", icon: "🔔", label: "Notifications" },
];

const bottomNavItems = [
  { href: "/settings", icon: "⚙️", label: "Settings" },
  { href: "/help", icon: "❓", label: "Help" },
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const allNavItems = [...mainNavItems, ...bottomNavItems];
  const currentPage = allNavItems.find((n) => n.href === pathname)?.label ?? "MUNIX";

  function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={[
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        ].join(" ")}
      >
        <span className="text-lg flex-shrink-0">{icon}</span>
        {sidebarOpen && <span>{label}</span>}
      </Link>
    );
  }

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

        {/* Main Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Bottom Nav — Settings & Help */}
        <div className="px-2 py-2 border-t border-gray-100 space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        {/* User Profile Strip */}
        <div className={[
          "border-t border-gray-100 px-3 py-3 flex items-center gap-3",
          !sidebarOpen && "justify-center",
        ].join(" ")}>
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 overflow-hidden flex-shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{displayName}</div>
              <div className="text-xs text-gray-400 truncate">@{username}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={[
        "flex-1 flex flex-col transition-all duration-300",
        sidebarOpen ? "ml-56" : "ml-16",
      ].join(" ")}>

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm font-medium text-gray-700">{currentPage}</div>

          <div className="flex items-center gap-3">

            {/* Profile Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
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
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 overflow-hidden flex-shrink-0">
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
                      href="/account-settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>🔐</span> Account Settings
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

      {/* Overlay to close dropdown */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}