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
    include: {
      members: true,
    },
  });

  if (!workspace) notFound();

  // Check if user is a member
  const member = workspace.members.find((m) => m.userId === profile.userId);
  if (!member) redirect("/workspaces");

  const isOwner =
    workspace.ownerId === profile.userId || member.role === "co-owner" || member.role === "owner";

  const workspaceNavItems = workspace.type === "business"
    ? [
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
      ]
    : workspace.type === "organization"
    ? [
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
      ]
    : [
        { href: "overview", label: "Overview", icon: "🏠" },
        { href: "team", label: "Team", icon: "👥" },
        { href: "tasks", label: "Tasks", icon: "✅" },
        { href: "documents", label: "Documents", icon: "📁" },
        { href: "calendar", label: "Calendar", icon: "📅" },
        { href: "settings", label: "Settings", icon: "⚙️" },
      ];

  const workspaceMeta: Record<string, { icon: string; color: string }> = {
    business: { icon: "🏢", color: "bg-blue-50 text-blue-600" },
    organization: { icon: "🏛️", color: "bg-purple-50 text-purple-600" },
    project: { icon: "📁", color: "bg-green-50 text-green-600" },
  };

  const meta = workspaceMeta[workspace.type] ?? { icon: "📁", color: "bg-gray-50 text-gray-600" };

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">

      {/* Workspace Sidebar */}
      <aside className="w-56 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Workspace Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">
                  {workspace.name}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {workspace.type}
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-2">
            {workspaceNavItems.map((item) => (
              <Link
                key={item.href}
                href={`/workspace/${id}/${item.href}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content — Overview */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              {workspace.type} · {workspace.industry ?? "No industry set"} · {workspace.country ?? "No country set"}
            </p>
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500 mb-1">Members</div>
            <div className="text-2xl font-bold text-indigo-600">{workspace.members.length}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500 mb-1">Projects</div>
            <div className="text-2xl font-bold text-indigo-600">0</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500 mb-1">Tasks</div>
            <div className="text-2xl font-bold text-indigo-600">0</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500 mb-1">Documents</div>
            <div className="text-2xl font-bold text-indigo-600">0</div>
          </div>
        </div>

        {/* Description */}
        {workspace.description && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{workspace.description}</p>
          </div>
        )}

        {/* Members Preview */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 mb-6">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href={`/workspace/${id}/team`}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:bg-indigo-50 transition text-center"
            >
              <span className="text-2xl">👥</span>
              <span className="text-xs font-medium text-gray-700">Invite Member</span>
            </Link>
            <Link
              href={`/workspace/${id}/projects`}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:bg-indigo-50 transition text-center"
            >
              <span className="text-2xl">📋</span>
              <span className="text-xs font-medium text-gray-700">New Project</span>
            </Link>
            <Link
              href={`/workspace/${id}/documents`}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:bg-indigo-50 transition text-center"
            >
              <span className="text-2xl">📁</span>
              <span className="text-xs font-medium text-gray-700">Add Document</span>
            </Link>
            {workspace.type === "business" && (
              <Link
                href={`/workspace/${id}/details`}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:bg-indigo-50 transition text-center"
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs font-medium text-gray-700">Business Details</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}