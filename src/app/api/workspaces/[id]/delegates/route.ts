import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../generated/prisma";

const prisma = new PrismaClient();

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
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Only owner can assign delegates" }, { status: 403 });
    }

    const body = await request.json() as {
      username: string;
      canApproveMembers: boolean;
      canApproveDepartments: boolean;
      canApproveChanges: boolean;
      canInviteMembers: boolean;
    };

    // Find the user by username
    const delegateProfile = await prisma.userProfile.findUnique({
      where: { username: body.username.replace("@", "") },
    });
    if (!delegateProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Make sure they are a member of the workspace
    const isMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: delegateProfile.clerkId,
        },
      },
    });
    if (!isMember) {
      return NextResponse.json({ error: "User is not a member of this workspace" }, { status: 400 });
    }

    const delegate = await prisma.workspaceDelegate.upsert({
      where: {
        workspaceId_delegateUserId: {
          workspaceId: id,
          delegateUserId: delegateProfile.clerkId,
        },
      },
      update: {
        canApproveMembers: body.canApproveMembers,
        canApproveDepartments: body.canApproveDepartments,
        canApproveChanges: body.canApproveChanges,
        canInviteMembers: body.canInviteMembers,
        isActive: true,
      },
      create: {
        workspaceId: id,
        delegateUserId: delegateProfile.clerkId,
        delegatedBy: userId,
        canApproveMembers: body.canApproveMembers,
        canApproveDepartments: body.canApproveDepartments,
        canApproveChanges: body.canApproveChanges,
        canInviteMembers: body.canInviteMembers,
      },
    });

    // Notify the delegate
    await prisma.notification.create({
      data: {
        userId: delegateProfile.userId,
        type: "system",
        title: "You Have Been Assigned as Delegate",
        description: `You have been given approval authority in "${workspace.name}".`,
        actionUrl: `/workspace/${id}/team`,
        actionLabel: "View Team",
      },
    });

    // Log activity
    const ownerProfile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (ownerProfile) {
      await prisma.activity.create({
        data: {
          userId: ownerProfile.userId,
          workspaceId: id,
          type: "workspace_updated",
          title: `Assigned ${delegateProfile.displayName} as delegate`,
          description: `${delegateProfile.displayName} can now approve requests in "${workspace.name}"`,
          actionUrl: `/workspace/${id}/team`,
        },
      });
    }

    return NextResponse.json({ delegate }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to assign delegate" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Only owner can remove delegates" }, { status: 403 });
    }

    const body = await request.json() as { delegateId: string };

    await prisma.workspaceDelegate.update({
      where: { id: body.delegateId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove delegate" }, { status: 500 });
  }
}