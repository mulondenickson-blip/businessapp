import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../generated/prisma";
import { redirect } from "next/navigation";
import NotificationsClient from "./_components/NotificationsClient";

const prisma = new PrismaClient();

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });
  if (!profile) redirect("/setup-profile");

  const notifications = await prisma.notification.findMany({
    where: { userId: profile.userId },
    orderBy: { createdAt: "desc" },
  });

  return <NotificationsClient notifications={notifications} />;
}