import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

// GET — fetch all notifications for current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (!profile) return NextResponse.json({ notifications: [] });

    const notifications = await prisma.notification.findMany({
      where: { userId: profile.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST — create a new notification
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await request.json() as {
      type: string;
      title: string;
      description: string;
      pinned?: boolean;
      actionUrl?: string;
      actionLabel?: string;
      targetUserId?: string;
    };

    // Allow sending notification to another user (e.g. workspace invite)
    const targetId = body.targetUserId ?? profile.userId;

    const notification = await prisma.notification.create({
      data: {
        userId: targetId,
        type: body.type,
        title: body.title,
        description: body.description,
        pinned: body.pinned ?? false,
        actionUrl: body.actionUrl,
        actionLabel: body.actionLabel,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

// PATCH — mark notifications as read
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await request.json() as {
      notificationId?: string;
      markAllRead?: boolean;
    };

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: profile.userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      await prisma.notification.update({
        where: { id: body.notificationId },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

// DELETE — delete a notification (only non-pinned)
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await request.json() as {
      notificationId?: string;
      clearAll?: boolean;
    };

    if (body.clearAll) {
      // Only delete non-pinned notifications
      await prisma.notification.deleteMany({
        where: { userId: profile.userId, pinned: false },
      });
      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      const notification = await prisma.notification.findUnique({
        where: { id: body.notificationId },
      });
      if (notification?.pinned) {
        return NextResponse.json({ error: "Cannot delete pinned notification" }, { status: 400 });
      }
      await prisma.notification.delete({
        where: { id: body.notificationId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}