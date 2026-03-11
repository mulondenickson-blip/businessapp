import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ available: false });
    }

    const existing = await prisma.userProfile.findUnique({
      where: { username },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ available: false });
  }
}