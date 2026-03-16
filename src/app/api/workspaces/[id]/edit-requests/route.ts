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

    const body = await request.json() as { reason: string };

    const editRequest = await prisma.editRequest.create({
      data: {
        workspaceId: id,
        requesterId: userId,
        reason: body.reason,
        status: "pending",
      },
    });

    // Notify workspace owner
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (workspace) {
      const ownerProfile = await prisma.userProfile.findUnique({
        where: { clerkId: workspace.ownerId },
      });

      const requesterProfile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
      });

      if (ownerProfile && requesterProfile) {
        await prisma.notification.create({
          data: {
            userId: ownerProfile.userId,
            type: "system",
            title: "Edit Access Request",
            description: `${requesterProfile.displayName} has requested edit access to business details in ${workspace.name}.`,
            actionUrl: `/workspace/${id}/details`,
            actionLabel: "Review Request",
          },
        });
      }
    }

    return NextResponse.json({ editRequest }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
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

    const body = await request.json() as {
      requestId: string;
      action: "approve" | "deny";
    };

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const editRequest = await prisma.editRequest.update({
      where: { id: body.requestId },
      data: { status: body.action === "approve" ? "approved" : "denied" },
    });

    // Notify requester
    const requesterProfile = await prisma.userProfile.findUnique({
      where: { clerkId: editRequest.requesterId },
    });

    if (requesterProfile) {
      await prisma.notification.create({
        data: {
          userId: requesterProfile.userId,
          type: "system",
          title: body.action === "approve"
            ? "Edit Access Granted"
            : "Edit Access Denied",
          description: body.action === "approve"
            ? `Your request to edit business details in ${workspace.name} has been approved.`
            : `Your request to edit business details in ${workspace.name} has been denied.`,
          actionUrl: `/workspace/${id}/details`,
          actionLabel: "View Details",
        },
      });
    }

    return NextResponse.json({ editRequest });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}