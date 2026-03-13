import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../generated/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./_components/ProfileClient";

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });

  if (!profile) redirect("/setup-profile");

  return <ProfileClient profile={profile} />;
}