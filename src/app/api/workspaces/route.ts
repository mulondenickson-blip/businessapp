import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      name, 
      type, 
      industry, 
      country, 
      employees, 
      currency, 
      description,
      status,
      startDate,
      endDate,
      inviteEmails 
    } = body;

    // Generate a unique slug from the workspace name
    const baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    // Create the workspace
    const workspace = await prisma.workspace.create({
      data: {
        name,
        type,
        industry,
        country,
        employees,
        currency,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: userId,
        slug: uniqueSlug,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
    });

    // Create invites if any emails were provided
    if (inviteEmails && inviteEmails.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

      await prisma.workspaceInvite.createMany({
        data: inviteEmails.map((email: string) => ({
          workspaceId: workspace.id,
          email,
          role: "co-owner",
          expiresAt,
        })),
      });
    }

    return NextResponse.json({ workspace }, { status: 201 });

  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ workspaces });

  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}