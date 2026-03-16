import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      name: string;
      type: string;
      industry?: string;
      country?: string;
      employees?: string;
      currency?: string;
      description?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      inviteEmails?: string[];
    };

    const {
      name, type, industry, country, employees,
      currency, description, status, startDate, endDate, inviteEmails,
    } = body;

    const baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    const workspace = await prisma.workspace.create({
      data: {
        name, type, industry, country, employees,
        currency, description, status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: userId,
        slug: uniqueSlug,
        members: {
          create: { userId, role: "owner" },
        },
      },
    });

    if (inviteEmails && inviteEmails.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.workspaceInvite.createMany({
        data: inviteEmails.map((email: string) => ({
          workspaceId: workspace.id,
          email,
          role: "co-owner",
          expiresAt,
        })),
      });
    }

    // Get user profile for activity logging
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });

    if (profile) {
      // Log workspace creation activity
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: workspace.id,
          type: "workspace_created",
          title: `Created workspace "${name}"`,
          description: `You created a new ${type} workspace called "${name}"`,
          actionUrl: `/workspace/${workspace.id}`,
        },
      });

      // Log invite activity if emails were provided
      if (inviteEmails && inviteEmails.length > 0) {
        await prisma.activity.create({
          data: {
            userId: profile.userId,
            workspaceId: workspace.id,
            type: "invite_sent",
            title: `Sent ${inviteEmails.length} invite${inviteEmails.length > 1 ? "s" : ""}`,
            description: `You invited ${inviteEmails.length} co-owner${inviteEmails.length > 1 ? "s" : ""} to "${name}"`,
            actionUrl: `/workspace/${workspace.id}/team`,
          },
        });
      }

      // Send notification to user
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          type: "workspace_created",
          title: `Workspace "${name}" created`,
          description: `Your ${type} workspace has been created successfully.`,
          actionUrl: `/workspace/${workspace.id}`,
          actionLabel: "Open Workspace",
        },
      });
    }

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
}