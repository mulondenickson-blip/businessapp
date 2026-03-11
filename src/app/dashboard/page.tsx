import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-indigo-600">MUNIX</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.firstName ?? "User"}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome to your MUNIX workspace</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Active Projects", value: "0", icon: "📋" },
            { label: "Team Members", value: "0", icon: "👥" },
            { label: "Pending Tasks", value: "0", icon: "⏳" },
            { label: "Completed Tasks", value: "0", icon: "✅" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Recent Activity */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-sm text-gray-400 text-center py-10">
              No activity yet. Start by creating a workspace.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: "Create Workspace", icon: "🏢" },
                { label: "Invite Members", icon: "👥" },
                { label: "Create Project", icon: "📋" },
                { label: "Add Task", icon: "✅" },
              ].map((action, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition text-sm text-gray-700"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
