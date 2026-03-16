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

    const body = await request.json() as {
      changes: {
        fieldName: string;
        oldValue: string | null;
        newValue: string;
      }[];
    };

    const pendingChanges = await Promise.all(
      body.changes.map((change) =>
        prisma.pendingChange.create({
          data: {
            workspaceId: id,
            submittedBy: userId,
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
            status: "pending",
          },
        })
      )
    );

    // Notify workspace owner
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (workspace) {
      const ownerProfile = await prisma.userProfile.findUnique({
        where: { clerkId: workspace.ownerId },
      });

      const submitterProfile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
      });

      if (ownerProfile && submitterProfile) {
        await prisma.notification.create({
          data: {
            userId: ownerProfile.userId,
            type: "system",
            title: "Changes Pending Your Approval",
            description: `${submitterProfile.displayName} has submitted ${body.changes.length} change(s) to business details in ${workspace.name}.`,
            actionUrl: `/workspace/${id}/details`,
            actionLabel: "Review Changes",
          },
        });
      }
    }

    return NextResponse.json({ pendingChanges }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit changes" }, { status: 500 });
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
      changeId: string;
      action: "approve" | "reject";
    };

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { businessDetails: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const change = await prisma.pendingChange.findUnique({
      where: { id: body.changeId },
    });
    if (!change) return NextResponse.json({ error: "Change not found" }, { status: 404 });

    if (body.action === "approve") {
      // Apply the change to business details
      await prisma.businessDetails.upsert({
        where: { workspaceId: id },
        update: { [change.fieldName]: change.newValue },
        create: { workspaceId: id, [change.fieldName]: change.newValue },
      });

      await prisma.pendingChange.update({
        where: { id: body.changeId },
        data: { status: "approved" },
      });

      // Notify submitter
      const submitterProfile = await prisma.userProfile.findUnique({
        where: { clerkId: change.submittedBy },
      });

      if (submitterProfile) {
        await prisma.notification.create({
          data: {
            userId: submitterProfile.userId,
            type: "system",
            title: "Your Change Was Approved",
            description: `Your update to "${change.fieldName}" in ${workspace.name} has been approved and is now live.`,
            actionUrl: `/workspace/${id}/details`,
            actionLabel: "View Details",
          },
        });
      }
    } else {
      await prisma.pendingChange.update({
        where: { id: body.changeId },
        data: { status: "rejected" },
      });

      // Notify submitter
      const submitterProfile = await prisma.userProfile.findUnique({
        where: { clerkId: change.submittedBy },
      });

      if (submitterProfile) {
        await prisma.notification.create({
          data: {
            userId: submitterProfile.userId,
            type: "system",
            title: "Your Change Was Rejected",
            description: `Your update to "${change.fieldName}" in ${workspace.name} was not approved by the owner.`,
            actionUrl: `/workspace/${id}/details`,
            actionLabel: "View Details",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process change" }, { status: 500 });
  }
}