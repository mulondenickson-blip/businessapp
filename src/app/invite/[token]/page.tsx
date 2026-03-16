import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../generated/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  // Invalid or already accepted invite
  if (!invite) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-gray-500 mb-6">
            This invitation link is invalid or has already been used.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Go to MUNIX
          </Link>
        </div>
      </main>
    );
  }

  // Expired invite
  if (new Date() > invite.expiresAt) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation Expired</h1>
          <p className="text-sm text-gray-500 mb-6">
            This invitation has expired. Please ask the workspace owner to send a new one.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Go to MUNIX
          </Link>
        </div>
      </main>
    );
  }

  // Already accepted
  if (invite.accepted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Already Accepted</h1>
          <p className="text-sm text-gray-500 mb-6">
            You have already accepted this invitation.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // If user is not logged in redirect to sign up then come back
  if (!userId) {
    redirect(`/sign-up?redirect=/invite/${token}`);
  }

  // Accept the invite automatically
  // Mark invite as accepted
  await prisma.workspaceInvite.update({
    where: { token },
    data: { accepted: true },
  });

  // Add user as workspace member
  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId,
      },
    },
  });

  if (!existingMember) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
        invitedBy: invite.invitedBy,
        approvalStatus: "pending",
      },
    });
  }

  // Notify workspace owner
  const ownerProfile = await prisma.userProfile.findUnique({
    where: { clerkId: invite.workspace.ownerId },
  });

  const newMemberProfile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });

  if (ownerProfile && newMemberProfile) {
    await prisma.notification.create({
      data: {
        userId: ownerProfile.userId,
        type: "member_joined",
        title: "New Member Joined",
        description: `${newMemberProfile.displayName} accepted their invitation to join "${invite.workspace.name}" as ${invite.role}.`,
        actionUrl: `/workspace/${invite.workspaceId}/team`,
        actionLabel: "View Team",
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: newMemberProfile.userId,
        workspaceId: invite.workspaceId,
        type: "invite_accepted",
        title: `Joined "${invite.workspace.name}"`,
        description: `You accepted an invitation to join "${invite.workspace.name}" as ${invite.role}`,
        actionUrl: `/workspace/${invite.workspaceId}`,
      },
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Invitation Accepted!
        </h1>
        <p className="text-sm text-gray-500 mb-2">
          You have joined <strong>{invite.workspace.name}</strong> as{" "}
          <strong className="capitalize">{invite.role}</strong>.
        </p>
        <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3 mb-6">
          ⏳ Your membership is pending approval from the workspace owner before you get full access.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Go to Dashboard →
        </Link>
      </div>
    </main>
  );
}