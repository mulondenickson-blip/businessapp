import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../../../generated/prisma";
import { redirect, notFound } from "next/navigation";
import FinanceClient from "./_components/FinanceClient";

const prisma = new PrismaClient();

export default async function FinancePage({
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

  const isOwner =
    workspace.ownerId === userId ||
    member.role === "owner" ||
    member.role === "co-owner";

  // If finance is set up, get dashboard data
  let dashboardData = null;
  if (workspace.financeSettings?.isSetup) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [transactions, invoices, budgets, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: { workspaceId: id },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: { workspaceId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.budget.findMany({
        where: { workspaceId: id },
      }),
      prisma.financeAccount.findMany({
        where: { workspaceId: id, isActive: true },
      }),
    ]);

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = transactions
      .filter((t) => t.type === "income" && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const outstandingInvoices = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + i.total, 0);

    const cashBalance = accounts
      .filter((a) => a.type === "cash" || a.type === "bank")
      .reduce((sum, a) => sum + a.balance, 0);

    dashboardData = {
      totalIncome,
      totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      netProfit: totalIncome - totalExpenses,
      outstandingInvoices,
      cashBalance,
      recentTransactions: transactions,
      recentInvoices: invoices,
      budgets,
      accounts,
    };
  }

  return (
    <FinanceClient
      workspace={{
        id: workspace.id,
        name: workspace.name,
        currency: workspace.currency ?? "USD",
      }}
      financeSettings={workspace.financeSettings}
      dashboardData={dashboardData}
      isOwner={isOwner}
      currentUserId={userId}
    />
  );
}