import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../../../generated/prisma";
import { redirect, notFound } from "next/navigation";
import TeamClient from "./_components/TeamClient";

const prisma = new PrismaClient();

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: true,
      departments: { where: { status: "active" } },
      delegates: { where: { isActive: true } },
    },
  });

  if (!workspace) notFound();

  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) redirect("/workspaces");

  const isOwner =
    workspace.ownerId === userId ||
    member.role === "owner" ||
    member.role === "co-owner";

  const isDelegate = workspace.delegates.some(
    (d) => d.delegateUserId === userId && d.isActive
  );

  const canApprove = isOwner || isDelegate;
  const canInvite = member.role !== "viewer";

  // Get profiles for all members
  const memberProfiles = await Promise.all(
    workspace.members.map(async (m) => {
      const profile = await prisma.userProfile.findFirst({
        where: { clerkId: m.userId },
        select: {
          userId: true,
          displayName: true,
          username: true,
          profilePhoto: true,
          primaryEmail: true,
        },
      });
      return { ...m, profile };
    })
  );

  // Get pending member approvals
  const pendingMembers = canApprove
    ? workspace.members.filter((m) => m.approvalStatus === "pending")
    : [];

  const pendingMemberProfiles = await Promise.all(
    pendingMembers.map(async (m) => {
      const profile = await prisma.userProfile.findFirst({
        where: { clerkId: m.userId },
        select: {
          userId: true,
          displayName: true,
          username: true,
          profilePhoto: true,
          primaryEmail: true,
        },
      });
      return { ...m, profile };
    })
  );

  // Get pending departments
  const pendingDepartments = canApprove
    ? await prisma.department.findMany({
        where: { workspaceId: id, status: "pending" },
      })
    : [];

  // Get pending invites
  const pendingInvites = await prisma.workspaceInvite.findMany({
    where: { workspaceId: id, accepted: false },
    orderBy: { createdAt: "desc" },
  });

  return (
    <TeamClient
      workspace={{
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
        ownerId: workspace.ownerId,
      }}
      members={memberProfiles}
      departments={workspace.departments}
      delegates={workspace.delegates}
      pendingMembers={pendingMemberProfiles}
      pendingDepartments={pendingDepartments}
      pendingInvites={pendingInvites}
      currentUserId={userId}
      isOwner={isOwner}
      canApprove={canApprove}
      canInvite={canInvite}
      currentMemberRole={member.role}
    />
  );
}