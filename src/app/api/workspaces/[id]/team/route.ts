import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../generated/prisma";

const prisma = new PrismaClient();

// POST — invite a member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { members: true, delegates: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
    if (member.role === "viewer") return NextResponse.json({ error: "Viewers cannot invite" }, { status: 403 });

    const body = await request.json() as {
      email: string;
      role: string;
      departmentId?: string;
      personalMessage?: string;
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        email: body.email,
        role: body.role,
        departmentId: body.departmentId,
        invitedBy: userId,
        personalMessage: body.personalMessage,
        expiresAt,
      },
    });

    // Log activity
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (profile) {
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: id,
          type: "invite_sent",
          title: `Invited ${body.email} to join`,
          description: `You invited ${body.email} as ${body.role} to "${workspace.name}"`,
          actionUrl: `/workspace/${id}/team`,
        },
      });
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}

// PATCH — approve or reject a member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { delegates: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const isOwner = workspace.ownerId === userId;
    const isDelegate = workspace.delegates.some(
      (d) => d.delegateUserId === userId && d.isActive && d.canApproveMembers
    );

    if (!isOwner && !isDelegate) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json() as {
      memberId: string;
      action: "approve" | "reject";
    };

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: body.memberId },
      data: {
        approvalStatus: body.action === "approve" ? "approved" : "rejected",
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    // Notify the member
    const memberProfile = await prisma.userProfile.findFirst({
      where: { clerkId: updatedMember.userId },
    });

    if (memberProfile) {
      await prisma.notification.create({
        data: {
          userId: memberProfile.userId,
          type: "member_joined",
          title: body.action === "approve"
            ? "Workspace Access Approved"
            : "Workspace Access Rejected",
          description: body.action === "approve"
            ? `Your membership in "${workspace.name}" has been approved.`
            : `Your membership in "${workspace.name}" was not approved.`,
          actionUrl: `/workspace/${id}`,
          actionLabel: "Open Workspace",
        },
      });

      // Log activity
      const approverProfile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
      });
      if (approverProfile) {
        await prisma.activity.create({
          data: {
            userId: approverProfile.userId,
            workspaceId: id,
            type: body.action === "approve" ? "member_joined" : "member_left",
            title: body.action === "approve"
              ? `Approved ${memberProfile.displayName} as member`
              : `Rejected ${memberProfile.displayName}'s membership`,
            actionUrl: `/workspace/${id}/team`,
          },
        });
      }
    }

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// DELETE — remove a member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Only owner can remove members" }, { status: 403 });
    }

    const body = await request.json() as { memberId: string };

    await prisma.workspaceMember.delete({
      where: { id: body.memberId },
    });

    // Log activity
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (profile) {
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: id,
          type: "member_left",
          title: "Removed a member from workspace",
          actionUrl: `/workspace/${id}/team`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}