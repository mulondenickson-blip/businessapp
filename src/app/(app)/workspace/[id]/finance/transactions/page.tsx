import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../../../../generated/prisma";
import { redirect, notFound } from "next/navigation";
import TransactionsClient from "./_components/TransactionsClient";

const prisma = new PrismaClient();

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: true,
      financeSettings: true,
    },
  });

  if (!workspace) notFound();

  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) redirect("/workspaces");

  if (!workspace.financeSettings?.isSetup) {
    redirect(`/workspace/${id}/finance`);
  }

  const [transactions, accounts, departments] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId: id },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.financeAccount.findMany({
      where: { workspaceId: id, isActive: true },
    }),
    prisma.department.findMany({
      where: { workspaceId: id, status: "active" },
    }),
  ]);

  return (
    <TransactionsClient
      workspace={{
        id: workspace.id,
        name: workspace.name,
        currency: workspace.financeSettings.defaultCurrency,
      }}
      transactions={transactions}
      accounts={accounts}
      departments={departments}
      financeSettings={workspace.financeSettings}
    />
  );
}