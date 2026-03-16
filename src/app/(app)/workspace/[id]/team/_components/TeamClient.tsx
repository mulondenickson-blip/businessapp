"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  userId: string;
  displayName: string;
  username: string;
  profilePhoto: string | null;
  primaryEmail: string;
} | null;

type Member = {
  id: string;
  userId: string;
  role: string;
  departmentId: string | null;
  invitedBy: string | null;
  approvalStatus: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  profile: Profile;
};

type Department = {
  id: string;
  name: string;
  description: string | null;
  headUserId: string | null;
  status: string;
  createdAt: Date;
};

type Delegate = {
  id: string;
  delegateUserId: string;
  canApproveMembers: boolean;
  canApproveDepartments: boolean;
  canApproveChanges: boolean;
  canInviteMembers: boolean;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
};

type Props = {
  workspace: {
    id: string;
    name: string;
    type: string;
    ownerId: string;
  };
  members: Member[];
  departments: Department[];
  delegates: Delegate[];
  pendingMembers: Member[];
  pendingDepartments: Department[];
  pendingInvites: PendingInvite[];
  currentUserId: string;
  isOwner: boolean;
  canApprove: boolean;
  canInvite: boolean;
  currentMemberRole: string;
};

const ROLES = ["admin", "member", "viewer"];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-indigo-100 text-indigo-700",
  "co-owner": "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-600",
};

function Avatar({
  photo,
  name,
  size = "md",
}: {
  photo: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 overflow-hidden flex-shrink-0`}
    >
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

type Tab = "members" | "departments" | "invites" | "delegates";

export default function TeamClient({
  workspace,
  members,
  departments,
  delegates,
  pendingMembers,
  pendingDepartments,
  pendingInvites,
  currentUserId,
  isOwner,
  canApprove,
  canInvite,
  currentMemberRole,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("members");

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteDepartment, setInviteDepartment] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Department form
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  const [deptHead, setDeptHead] = useState("");
  const [deptParent, setDeptParent] = useState("");
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  // Delegate form
  const [showDelegateForm, setShowDelegateForm] = useState(false);
  const [delegateUsername, setDelegateUsername] = useState("");
  const [delegatePermissions, setDelegatePermissions] = useState({
    canApproveMembers: true,
    canApproveDepartments: true,
    canApproveChanges: true,
    canInviteMembers: true,
  });
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegateError, setDelegateError] = useState("");

  const approvedMembers = members.filter((m) => m.approvalStatus === "approved");

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteError("");
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          departmentId: inviteDepartment || undefined,
          personalMessage: inviteMessage || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to send invite");
      }
      setInviteSuccess(true);
      setInviteEmail("");
      setInviteMessage("");
      setShowInviteForm(false);
      router.refresh();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleApproveMember(memberId: string) {
    await fetch(`/api/workspaces/${workspace.id}/team`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action: "approve" }),
    });
    router.refresh();
  }

  async function handleRejectMember(memberId: string) {
    await fetch(`/api/workspaces/${workspace.id}/team`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action: "reject" }),
    });
    router.refresh();
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    await fetch(`/api/workspaces/${workspace.id}/team`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    router.refresh();
  }

  async function handleCreateDepartment() {
    if (!deptName.trim()) return;
    setIsCreatingDept(true);
    try {
      await fetch(`/api/workspaces/${workspace.id}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deptName,
          description: deptDescription || undefined,
          headUserId: deptHead || undefined,
          parentDepartmentId: deptParent || undefined,
        }),
      });
      setShowDeptForm(false);
      setDeptName("");
      setDeptDescription("");
      router.refresh();
    } catch {
      console.error("Failed to create department");
    } finally {
      setIsCreatingDept(false);
    }
  }

  async function handleApproveDepartment(deptId: string) {
    await fetch(`/api/workspaces/${workspace.id}/departments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: deptId, action: "approve" }),
    });
    router.refresh();
  }

  async function handleDelegate() {
    if (!delegateUsername.trim()) return;
    setIsDelegating(true);
    setDelegateError("");
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/delegates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: delegateUsername.trim(),
          ...delegatePermissions,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to delegate");
      }
      setShowDelegateForm(false);
      setDelegateUsername("");
      router.refresh();
    } catch (err) {
      setDelegateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsDelegating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            {approvedMembers.length} member{approvedMembers.length !== 1 ? "s" : ""} · {workspace.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setShowDelegateForm(!showDelegateForm)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              🔑 Delegate
            </button>
          )}
          {canInvite && (
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              + Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {inviteSuccess && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 font-medium">
          ✓ Invite sent successfully!
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && (
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="text-sm font-semibold text-indigo-900 mb-4">Invite a New Member</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Email Address</label>
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@email.com"
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Department (Optional)</label>
              <select
                value={inviteDepartment}
                onChange={(e) => setInviteDepartment(e.target.value)}
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Personal Message (Optional)</label>
              <input
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal note..."
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
              />
            </div>
          </div>
          {inviteError && (
            <p className="text-xs text-rose-600 mt-2">{inviteError}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => void handleInvite()}
              disabled={isInviting || !inviteEmail.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isInviting ? "Sending..." : "Send Invite"}
            </button>
            <button
              onClick={() => setShowInviteForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delegate Form */}
      {showDelegateForm && isOwner && (
        <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h3 className="text-sm font-semibold text-purple-900 mb-1">Delegate Approval Authority</h3>
          <p className="text-xs text-purple-600 mb-4">
            Assign a trusted member to handle approvals on your behalf.
          </p>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Member Username</label>
            <input
              value={delegateUsername}
              onChange={(e) => setDelegateUsername(e.target.value)}
              placeholder="@username"
              className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Permissions</label>
            <div className="space-y-2">
              {[
                { key: "canApproveMembers", label: "Approve member requests" },
                { key: "canApproveDepartments", label: "Approve department creation" },
                { key: "canApproveChanges", label: "Approve business detail changes" },
                { key: "canInviteMembers", label: "Invite new members" },
              ].map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={delegatePermissions[perm.key as keyof typeof delegatePermissions]}
                    onChange={(e) =>
                      setDelegatePermissions((prev) => ({
                        ...prev,
                        [perm.key]: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
          {delegateError && (
            <p className="text-xs text-rose-600 mb-2">{delegateError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => void handleDelegate()}
              disabled={isDelegating || !delegateUsername.trim()}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              {isDelegating ? "Saving..." : "Assign Delegate"}
            </button>
            <button
              onClick={() => setShowDelegateForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {canApprove && pendingMembers.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-900 mb-4">
            ⏳ {pendingMembers.length} Member{pendingMembers.length > 1 ? "s" : ""} Awaiting Approval
          </h3>
          <div className="space-y-3">
            {pendingMembers.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-amber-100 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    photo={m.profile?.profilePhoto ?? null}
                    name={m.profile?.displayName ?? "Unknown"}
                    size="md"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {m.profile?.displayName ?? "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{m.profile?.username} · {m.role}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleApproveMember(m.id)}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => void handleRejectMember(m.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Departments */}
      {canApprove && pendingDepartments.length > 0 && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-sm font-semibold text-blue-900 mb-4">
            ⏳ {pendingDepartments.length} Department{pendingDepartments.length > 1 ? "s" : ""} Awaiting Approval
          </h3>
          <div className="space-y-3">
            {pendingDepartments.map((dept) => (
              <div key={dept.id} className="bg-white rounded-xl border border-blue-100 p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{dept.name}</div>
                  {dept.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{dept.description}</div>
                  )}
                </div>
                <button
                  onClick={() => void handleApproveDepartment(dept.id)}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
                >
                  ✓ Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {(["members", "departments", "invites", "delegates"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition capitalize",
              activeTab === tab
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-3">
          {approvedMembers.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
              <div className="text-4xl mb-3">👥</div>
              <div className="text-sm text-gray-500">No approved members yet.</div>
            </div>
          ) : (
            approvedMembers.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    photo={m.profile?.profilePhoto ?? null}
                    name={m.profile?.displayName ?? "Unknown"}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {m.profile?.displayName ?? "Unknown"}
                        {m.userId === currentUserId && (
                          <span className="ml-1 text-xs text-gray-400">(You)</span>
                        )}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[m.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {m.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      @{m.profile?.username} · {m.profile?.primaryEmail}
                    </div>
                  </div>
                </div>
                {isOwner && m.userId !== currentUserId && (
                  <button
                    onClick={() => void handleRemoveMember(m.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              {departments.length} active department{departments.length !== 1 ? "s" : ""}
            </span>
            {currentMemberRole !== "viewer" && (
              <button
                onClick={() => setShowDeptForm(!showDeptForm)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition"
              >
                + New Department
              </button>
            )}
          </div>

          {showDeptForm && (
            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Department Name</label>
                  <input
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Marketing"
                    className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Parent Department (Optional)</label>
                  <select
                    value={deptParent}
                    onChange={(e) => setDeptParent(e.target.value)}
                    className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Department Head (Optional)</label>
                  <select
                    value={deptHead}
                    onChange={(e) => setDeptHead(e.target.value)}
                    className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="">Select head</option>
                    {approvedMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.profile?.displayName ?? m.userId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Description (Optional)</label>
                  <input
                    value={deptDescription}
                    onChange={(e) => setDeptDescription(e.target.value)}
                    placeholder="Brief description"
                    className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => void handleCreateDepartment()}
                  disabled={isCreatingDept || !deptName.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isCreatingDept ? "Creating..." : "Create Department"}
                </button>
                <button
                  onClick={() => setShowDeptForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {departments.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-sm text-gray-500">No departments yet.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-xl border border-gray-100 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{dept.name}</div>
                      {dept.description && (
                        <div className="text-xs text-gray-500 mt-0.5">{dept.description}</div>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    {approvedMembers.filter((m) => m.departmentId === dept.id).length} members
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === "invites" && (
        <div className="space-y-3">
          {pendingInvites.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
              <div className="text-4xl mb-3">📨</div>
              <div className="text-sm text-gray-500">No pending invites.</div>
            </div>
          ) : (
            pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="rounded-xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">{invite.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5 capitalize">
                    Role: {invite.role} · Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Pending
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delegates Tab */}
      {activeTab === "delegates" && (
        <div className="space-y-3">
          {delegates.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
              <div className="text-4xl mb-3">🔑</div>
              <div className="text-sm text-gray-500">
                No delegates assigned yet.
                {isOwner && " Use the Delegate button to assign someone."}
              </div>
            </div>
          ) : (
            delegates.map((delegate) => (
              <div
                key={delegate.id}
                className="rounded-xl border border-gray-100 bg-white p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-900">
                    {delegate.delegateUserId}
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    Delegate
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {delegate.canApproveMembers && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Approve Members
                    </span>
                  )}
                  {delegate.canApproveDepartments && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Approve Departments
                    </span>
                  )}
                  {delegate.canApproveChanges && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Approve Changes
                    </span>
                  )}
                  {delegate.canInviteMembers && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Invite Members
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}