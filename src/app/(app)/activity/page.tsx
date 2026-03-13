import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../generated/prisma";
import { redirect } from "next/navigation";
import ActivityClient from "./_components/ActivityClient";

const prisma = new PrismaClient();

export default async function ActivityPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });
  if (!profile) redirect("/setup-profile");

  const activities = await prisma.activity.findMany({
    where: { userId: profile.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <ActivityClient activities={activities} displayName={profile.displayName} />;
}