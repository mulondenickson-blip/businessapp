import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { PrismaClient } from "../../../../generated/prisma";

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

async function getUserProfile() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });

    return profile;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await currentUser();
  const workspaces = await getWorkspaces();
  const profile = await getUserProfile();

  const displayName = profile?.displayName ?? user?.firstName ?? "User";

  const workspaceMeta: Record<string, { label: string; icon: string }> = {
    business: { label: "Business", icon: "🏢" },
    organization: { label: "Organization", icon: "🏛️" },
    project: { label: "Project", icon: "📁" },
  };

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {displayName}
        </p>
      </div>

      {/* My Workspaces */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
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
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="text-sm text-gray-500 mb-1">Total Workspaces</div>
          <div className="text-3xl font-bold text-indigo-600">{workspaces.length}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="text-sm text-gray-500 mb-1">Projects</div>
          <div className="text-3xl font-bold text-indigo-600">0</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="text-sm text-gray-500 mb-1">Tasks</div>
          <div className="text-3xl font-bold text-indigo-600">0</div>
        </div>
      </div>

    </div>
  );
}