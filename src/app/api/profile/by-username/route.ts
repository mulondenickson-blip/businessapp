import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ profile: null });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { username },
      select: {
        userId: true,
        displayName: true,
        username: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ profile: null });
  }
}