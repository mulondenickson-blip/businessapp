"use client";

import { useState } from "react";

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  workspaceId: string | null;
  actionUrl: string | null;
  createdAt: Date;
};

type Props = {
  activities: Activity[];
  displayName: string;
};

const TYPE_ICONS: Record<string, string> = {
  profile_updated: "👤",
  workspace_created: "🏢",
  workspace_updated: "✏️",
  member_joined: "👥",
  member_left: "👋",
  project_created: "📋",
  project_updated: "📝",
  task_created: "✅",
  task_completed: "🎯",
  task_updated: "🔄",
  invite_sent: "📨",
  invite_accepted: "🤝",
};

type Filter = "all" | "mine" | "workspace";

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function groupByDate(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  activities.forEach((activity) => {
    const date = new Date(activity.createdAt);
    let label: string;

    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(activity);
  });

  return groups;
}

export default function ActivityClient({ activities: initial, displayName }: Props) {
  const [activities] = useState(initial);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const filtered = activities.filter(() => {
    return true;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Recent Activity</h1>
        <p className="text-sm text-gray-500 mt-1">
          A timeline of everything that has happened in your account.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {(["all", "mine", "workspace"] as Filter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={[
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition capitalize",
              activeFilter === filter
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {filter === "all" ? "All Activity" : filter === "mine" ? "My Actions" : "Workspace"}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-16 text-center">
          <div className="text-4xl mb-3">🕐</div>
          <div className="text-sm font-medium text-gray-500">
            No activity yet. Start by creating a workspace!
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>

              {/* Date Label */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {date}
                </div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Activity Items */}
              <div className="space-y-2">
                {items.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 transition"
                  >
                    {/* Icon */}
                    <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {TYPE_ICONS[activity.type] ?? "🔔"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {activity.title}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {timeAgo(activity.createdAt)}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {activity.description}
                        </p>
                      )}
                      {activity.actionUrl && (
                        
                          href={activity.actionUrl}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 mt-2 inline-block transition"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}