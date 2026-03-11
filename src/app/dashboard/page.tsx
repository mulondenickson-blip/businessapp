import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

async function getWorkspaces() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return workspaces;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const user = await currentUser();
  const workspaces = await getWorkspaces();

  const activity: Array<{
    id: string;
    icon: string;
    description: string;
    timestamp: string;
  }> = [];

  const notifications: Array<{
    id: string;
    icon: string;
    message: string;
    timestamp: string;
  }> = [];

  const workspaceMeta: Record<string, { label: string; icon: string }> = {
    business: { label: "Business", icon: "🏢" },
    organization: { label: "Organization", icon: "🏛️" },
    project: { label: "Project", icon: "📁" },
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-indigo-600">MUNIX</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.firstName ?? "User"}
          </span>
          <UserButton />
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {user?.firstName ?? "User"}
          </p>
        </div>

        {/* My Workspaces */}
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">My Workspaces</h2>
            {workspaces.length > 0 && (
              <Link
                href="/create-workspace"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                Create New Workspace <span>+</span>
              </Link>
            )}
          </div>

          {workspaces.length === 0 ? (
            <div className="mt-4 rounded-xl border border-gray-100 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                You have no workspaces yet. Create one to get started.
              </p>
              <Link
                href="/create-workspace"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                Create Your First Workspace
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => {
                const meta = workspaceMeta[ws.type] ?? { label: ws.type, icon: "📁" };
                return (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}`}
                    className="group rounded-xl border border-gray-100 bg-white p-6 transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-xl">
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                            {ws.name}
                          </div>
                          <div className="text-xs text-gray-500">{meta.label}</div>
                        </div>
                      </div>
                      <span className="text-gray-300 group-hover:text-indigo-400 transition">→</span>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      Created {new Date(ws.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Activity + Notifications */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Recent Activity */}
          <section className="md:col-span-2 rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No activity yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-4">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-base">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-700">{item.description}</div>
                      <div className="mt-1 text-xs text-gray-400">{item.timestamp}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notifications */}
          <section className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                You are all caught up!
              </div>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-base">
                      {n.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-700">{n.message}</div>
                      <div className="mt-1 text-xs text-gray-400">{n.timestamp}</div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                    >
                      Dismiss
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}