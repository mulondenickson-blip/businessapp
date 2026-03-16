import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../../generated/prisma";
import { redirect, notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!workspace) notFound();

  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) redirect("/workspaces");

  redirect(`/workspace/${id}/overview`);
}