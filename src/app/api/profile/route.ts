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
      userId: string;
      firstName: string;
      lastName: string;
      otherNames?: string;
      displayName: string;
      username: string;
      primaryEmail: string;
      profilePhoto?: string;
      alternateEmail?: string;
      phoneNumber?: string;
      workPhone?: string;
      alternatePhone?: string;
      country?: string;
      stateRegion?: string;
      cityTown?: string;
      streetAddress?: string;
      postalCode?: string;
      emergencyName?: string;
      emergencyPhone?: string;
      emergencyRelation?: string;
    };

    // Check username availability
    const existing = await prisma.userProfile.findUnique({
      where: { username: body.username },
    });

    if (existing && existing.clerkId !== userId) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Check if this is a brand new profile (first time setup)
    const existingProfile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    const isNewProfile = !existingProfile;

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
        alternateEmail: body.alternateEmail,
        phoneNumber: body.phoneNumber,
        workPhone: body.workPhone,
        alternatePhone: body.alternatePhone,
        country: body.country,
        stateRegion: body.stateRegion,
        cityTown: body.cityTown,
        streetAddress: body.streetAddress,
        postalCode: body.postalCode,
        emergencyName: body.emergencyName,
        emergencyPhone: body.emergencyPhone,
        emergencyRelation: body.emergencyRelation,
      },
      create: {
        clerkId: userId,
        userId: body.userId,
        firstName: body.firstName,
        lastName: body.lastName,
        otherNames: body.otherNames,
        displayName: body.displayName,
        username: body.username,
        primaryEmail: body.primaryEmail,
        profilePhoto: body.profilePhoto,
        alternateEmail: body.alternateEmail,
        phoneNumber: body.phoneNumber,
        workPhone: body.workPhone,
        alternatePhone: body.alternatePhone,
        country: body.country,
        stateRegion: body.stateRegion,
        cityTown: body.cityTown,
        streetAddress: body.streetAddress,
        postalCode: body.postalCode,
        emergencyName: body.emergencyName,
        emergencyPhone: body.emergencyPhone,
        emergencyRelation: body.emergencyRelation,
      },
    });

    // Send welcome notification only for brand new profiles
    if (isNewProfile) {
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          type: "welcome",
          title: `Welcome to MUNIX, ${body.displayName}! 🎉`,
          description:
            "Your account is set up and ready. Start by creating your first workspace or completing your profile.",
          pinned: true,
          actionUrl: "/create-workspace",
          actionLabel: "Create Workspace",
        },
      });

      // Also log it as first activity
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          type: "profile_updated",
          title: "Account created",
          description: `${body.displayName} joined MUNIX`,
        },
      });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}