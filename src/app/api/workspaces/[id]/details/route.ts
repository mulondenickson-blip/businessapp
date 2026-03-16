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

    const isOwner =
      workspace.ownerId === userId ||
      member.role === "owner" ||
      member.role === "co-owner";

    if (!isOwner) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await request.json() as {
      registrationNumber?: string;
      legalStructure?: string;
      yearFounded?: string;
      businessEmail?: string;
      businessPhone?: string;
      websiteUrl?: string;
      physicalAddress?: string;
      mission?: string;
      vision?: string;
      coreValues?: string;
      operatingHours?: string;
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
      otherSocial?: string;
    };

    const details = await prisma.businessDetails.upsert({
      where: { workspaceId: id },
      update: { ...body },
      create: { workspaceId: id, ...body },
    });

    return NextResponse.json({ details }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save details" }, { status: 500 });
  }
}