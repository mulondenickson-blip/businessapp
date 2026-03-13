import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (!profile) return NextResponse.json({ activities: [] });

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "all";
    const workspaceId = searchParams.get("workspaceId");

    const where: {
      userId?: string;
      workspaceId?: string;
    } = {};

    if (filter === "mine") {
      where.userId = profile.userId;
    } else if (filter === "workspace" && workspaceId) {
      where.workspaceId = workspaceId;
    } else {
      where.userId = profile.userId;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

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
      description?: string;
      workspaceId?: string;
      actionUrl?: string;
      metadata?: string;
    };

    const activity = await prisma.activity.create({
      data: {
        userId: profile.userId,
        type: body.type,
        title: body.title,
        description: body.description,
        workspaceId: body.workspaceId,
        actionUrl: body.actionUrl,
        metadata: body.metadata,
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}