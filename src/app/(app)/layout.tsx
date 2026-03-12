import { auth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../generated/prisma";
import { redirect } from "next/navigation";
import AppShell from "./_components/AppShell";

const prisma = new PrismaClient();

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
  });

  if (!profile) redirect("/setup-profile");

  return (
    <AppShell
      displayName={profile.displayName}
      username={profile.username}
      profilePhoto={profile.profilePhoto ?? null}
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
    >
      {children}
    </AppShell>
  );
}