import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../generated/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function WorkspacesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });
  if (!profile) redirect("/setup-profile");

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const workspaceMeta: Record<string, { label: string; icon: string; color: string }> = {
    business: { label: "Business", icon: "🏢", color: "bg-blue-50 text-blue-600" },
    organization: { label: "Organization", icon: "🏛️", color: "bg-purple-50 text-purple-600" },
    project: { label: "Project", icon: "📁", color: "bg-green-50 text-green-600" },
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workspaces.length === 0
              ? "You have no workspaces yet"
              : `You have ${workspaces.length} workspace${workspaces.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/create-workspace"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <span className="text-lg">+</span> New Workspace
        </Link>
      </div>

      {/* Empty State */}
      {workspaces.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No workspaces yet
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
            Workspaces are where you and your team collaborate.
            Create one for your business, organization, or project.
          </p>
        </div>
      ) : (
        <>
          {/* Workspace Type Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {["business", "organization", "project"].map((type) => {
              const count = workspaces.filter((w) => w.type === type).length;
              const meta = workspaceMeta[type]!;
              return (
                <div key={type} className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">{meta.label}{count !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workspace Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => {
              const meta = workspaceMeta[ws.type] ?? { label: ws.type, icon: "📁", color: "bg-gray-50 text-gray-600" };
              return (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-indigo-200 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mb-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition truncate">
                      {ws.name}
                    </h3>
                  </div>
                  {ws.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                      {ws.description}
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      {ws.industry && <span className="text-xs text-gray-400">{ws.industry}</span>}
                      {ws.country && <span className="text-xs text-gray-400">{ws.country}</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">
                        Created {new Date(ws.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs font-medium text-indigo-500 group-hover:text-indigo-600 mt-1">
                        Open →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}