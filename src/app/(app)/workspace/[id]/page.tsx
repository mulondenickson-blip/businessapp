import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../../generated/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });
  if (!profile) redirect("/setup-profile");

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!workspace) notFound();

  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) redirect("/workspaces");

  const isOwner =
    workspace.ownerId === userId ||
    member.role === "co-owner" ||
    member.role === "owner";

  const businessNav = [
    { href: "overview", label: "Overview", icon: "🏠" },
    { href: "details", label: "Business Details", icon: "📋" },
    { href: "team", label: "Team", icon: "👥" },
    { href: "projects", label: "Projects & Tasks", icon: "✅" },
    { href: "products", label: "Products & Services", icon: "📦" },
    { href: "customers", label: "Customers", icon: "👤" },
    { href: "sales", label: "Sales & Orders", icon: "💼" },
    { href: "finance", label: "Finance", icon: "💰" },
    { href: "documents", label: "Documents", icon: "📁" },
    { href: "analytics", label: "Analytics", icon: "📊" },
    { href: "reports", label: "Reports", icon: "📄" },
    { href: "calendar", label: "Calendar", icon: "📅" },
    { href: "settings", label: "Settings", icon: "⚙️" },
  ];

  const organizationNav = [
    { href: "overview", label: "Overview", icon: "🏠" },
    { href: "details", label: "Organization Details", icon: "📋" },
    { href: "team", label: "Team", icon: "👥" },
    { href: "projects", label: "Projects & Tasks", icon: "✅" },
    { href: "documents", label: "Documents", icon: "📁" },
    { href: "finance", label: "Finance", icon: "💰" },
    { href: "analytics", label: "Analytics", icon: "📊" },
    { href: "reports", label: "Reports", icon: "📄" },
    { href: "calendar", label: "Calendar", icon: "📅" },
    { href: "settings", label: "Settings", icon: "⚙️" },
  ];

  const projectNav = [
    { href: "overview", label: "Overview", icon: "🏠" },
    { href: "team", label: "Team", icon: "👥" },
    { href: "tasks", label: "Tasks", icon: "✅" },
    { href: "documents", label: "Documents", icon: "📁" },
    { href: "calendar", label: "Calendar", icon: "📅" },
    { href: "settings", label: "Settings", icon: "⚙️" },
  ];

  const navItems =
    workspace.type === "business"
      ? businessNav
      : workspace.type === "organization"
      ? organizationNav
      : projectNav;

  const workspaceMeta: Record<string, { icon: string; color: string; bg: string }> = {
    business: { icon: "🏢", color: "text-blue-600", bg: "bg-blue-50" },
    organization: { icon: "🏛️", color: "text-purple-600", bg: "bg-purple-50" },
    project: { icon: "📁", color: "text-green-600", bg: "bg-green-50" },
  };

  const meta = workspaceMeta[workspace.type] ?? {
    icon: "📁", color: "text-gray-600", bg: "bg-gray-50",
  };

  return (
    <div className="max-w-7xl mx-auto">

      {/* Workspace Header */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${meta.bg}`}>
              {meta.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{workspace.name}</h1>
              <p className="text-xs text-gray-400 capitalize">
                {workspace.type}
                {workspace.industry ? ` · ${workspace.industry}` : ""}
                {workspace.country ? ` · ${workspace.country}` : ""}
              </p>
            </div>
          </div>
          {isOwner && (
            <Link
              href={`/workspace/${id}/settings`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              ⚙️ Settings
            </Link>
          )}
        </div>

        {/* Horizontal Tab Navigation */}
        <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/workspace/${id}/${item.href}`}
              className="flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-gray-500 hover:text-indigo-600 whitespace-nowrap border-b-2 border-transparent hover:border-indigo-600 transition"
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Overview Content */}
      <div className="space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="text-xs text-gray-500 mb-1">Members</div>
            <div className="text-3xl font-bold text-indigo-600">{workspace.members.length}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="text-xs text-gray-500 mb-1">Projects</div>
            <div className="text-3xl font-bold text-indigo-600">0</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="text-xs text-gray-500 mb-1">Tasks</div>
            <div className="text-3xl font-bold text-indigo-600">0</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="text-xs text-gray-500 mb-1">Documents</div>
            <div className="text-3xl font-bold text-indigo-600">0</div>
          </div>
        </div>

        {/* About */}
        {workspace.description && (
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{workspace.description}</p>
          </div>
        )}

        {/* Members Preview + Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Members Preview */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
              <Link
                href={`/workspace/${id}/team`}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition"
              >
                View all →
              </Link>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {workspace.members.slice(0, 8).map((m) => (
                <div
                  key={m.id}
                  className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600"
                  title={m.role}
                >
                  {m.userId.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {workspace.members.length > 8 && (
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                  +{workspace.members.length - 8}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/workspace/${id}/team`}
                className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50 transition"
              >
                <span className="text-xl">👥</span>
                <span className="text-xs font-medium text-gray-700">Invite Member</span>
              </Link>
              <Link
                href={`/workspace/${id}/projects`}
                className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50 transition"
              >
                <span className="text-xl">📋</span>
                <span className="text-xs font-medium text-gray-700">New Project</span>
              </Link>
              <Link
                href={`/workspace/${id}/documents`}
                className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50 transition"
              >
                <span className="text-xl">📁</span>
                <span className="text-xs font-medium text-gray-700">Add Document</span>
              </Link>
              {workspace.type === "business" && (
                <Link
                  href={`/workspace/${id}/details`}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50 transition"
                >
                  <span className="text-xl">🏢</span>
                  <span className="text-xs font-medium text-gray-700">Business Details</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}