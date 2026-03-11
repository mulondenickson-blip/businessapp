import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      firstName: string;
      lastName: string;
      otherNames?: string;
      displayName: string;
      username: string;
      primaryEmail: string;
      profilePhoto?: string;
    };

    // Check username availability
    const existing = await prisma.userProfile.findUnique({
      where: { username: body.username },
    });

    if (existing && existing.clerkId !== userId) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const profile = await prisma.userProfile.upsert({
      where: { clerkId: userId },
      update: {
        firstName: body.firstName,
        lastName: body.lastName,
        otherNames: body.otherNames,
        displayName: body.displayName,
        username: body.username,
        primaryEmail: body.primaryEmail,
        profilePhoto: body.profilePhoto,
      },
      create: {
        clerkId: userId,
        userId: userId,
        firstName: body.firstName,
        lastName: body.lastName,
        otherNames: body.otherNames,
        displayName: body.displayName,
        username: body.username,
        primaryEmail: body.primaryEmail,
        profilePhoto: body.profilePhoto,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}