import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../generated/prisma";
import { redirect } from "next/navigation";
import InboxClient from "./_components/InboxClient";

const prisma = new PrismaClient();

export default async function InboxPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });
  if (!profile) redirect("/setup-profile");

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

  return (
    <InboxClient
      conversations={conversationsWithProfiles}
      currentUserId={profile.userId}
      currentUserName={profile.displayName}
      currentUserPhoto={profile.profilePhoto}
    />
  );
}