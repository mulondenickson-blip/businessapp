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
    if (!profile) return NextResponse.json({ conversations: [] });

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });

      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: profile.userId },
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json({ messages });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantOne: profile.userId },
          { participantTwo: profile.userId },
        ],
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const conversationsWithProfiles = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.participantOne === profile.userId
            ? conv.participantTwo
            : conv.participantOne;

        const otherProfile = await prisma.userProfile.findUnique({
          where: { userId: otherUserId },
          select: {
            userId: true,
            displayName: true,
            username: true,
            profilePhoto: true,
          },
        });

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: profile.userId },
            read: false,
          },
        });

        return { ...conv, otherProfile, unreadCount };
      })
    );

    return NextResponse.json({ conversations: conversationsWithProfiles });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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
      receiverId: string;
      content: string;
    };

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participantOne: profile.userId, participantTwo: body.receiverId },
          { participantOne: body.receiverId, participantTwo: profile.userId },
        ],
      },
    });

    let conversation = existingConversation;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participantOne: profile.userId,
          participantTwo: body.receiverId,
          lastMessage: body.content,
          lastMessageAt: new Date(),
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: body.content,
          lastMessageAt: new Date(),
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: profile.userId,
        content: body.content,
        read: false,
      },
    });

    return NextResponse.json({ message, conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}