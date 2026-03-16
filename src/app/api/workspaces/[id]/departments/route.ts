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
      include: { members: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
    if (member.role === "viewer") return NextResponse.json({ error: "Viewers cannot create departments" }, { status: 403 });

    const body = await request.json() as {
      name: string;
      description?: string;
      headUserId?: string;
      parentDepartmentId?: string;
    };

    const isOwner =
      workspace.ownerId === userId ||
      member.role === "owner" ||
      member.role === "co-owner";

    const department = await prisma.department.create({
      data: {
        workspaceId: id,
        name: body.name,
        description: body.description,
        headUserId: body.headUserId,
        parentDepartmentId: body.parentDepartmentId,
        createdBy: userId,
        status: isOwner ? "active" : "pending",
        approvedBy: isOwner ? userId : undefined,
        approvedAt: isOwner ? new Date() : undefined,
      },
    });

    // Notify owner if not owner creating it
    if (!isOwner) {
      const ownerProfile = await prisma.userProfile.findUnique({
        where: { clerkId: workspace.ownerId },
      });
      const creatorProfile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
      });
      if (ownerProfile && creatorProfile) {
        await prisma.notification.create({
          data: {
            userId: ownerProfile.userId,
            type: "system",
            title: "New Department Pending Approval",
            description: `${creatorProfile.displayName} created a new department "${body.name}" in ${workspace.name}.`,
            actionUrl: `/workspace/${id}/team`,
            actionLabel: "Review",
          },
        });
      }
    }

    // Log activity
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (profile) {
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: id,
          type: "project_created",
          title: `Created department "${body.name}"`,
          description: isOwner
            ? `Department "${body.name}" is now active`
            : `Department "${body.name}" is pending approval`,
          actionUrl: `/workspace/${id}/team`,
        },
      });
    }

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

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
      (d) => d.delegateUserId === userId && d.isActive && d.canApproveDepartments
    );

    if (!isOwner && !isDelegate) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json() as {
      departmentId: string;
      action: "approve" | "reject";
    };

    const department = await prisma.department.update({
      where: { id: body.departmentId },
      data: {
        status: body.action === "approve" ? "active" : "archived",
        approvedBy: userId,
        approvedAt: new Date(),
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
          type: "workspace_updated",
          title: body.action === "approve"
            ? `Approved department "${department.name}"`
            : `Rejected department "${department.name}"`,
          actionUrl: `/workspace/${id}/team`,
        },
      });
    }

    return NextResponse.json({ department });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}