import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../generated/prisma";
import Groq from "groq-sdk";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TRANSACTION_CATEGORIES = [
  "Sales Revenue", "Service Revenue", "Other Income",
  "Rent & Utilities", "Salaries & Wages", "Office Supplies",
  "Marketing & Advertising", "Travel & Transport",
  "Equipment & Technology", "Maintenance & Repairs",
  "Insurance", "Taxes & Licenses", "Professional Services",
  "Bank Charges", "Loan Repayment", "Miscellaneous",
];

async function aiCategorize(description: string): Promise<{ category: string; insight: string }> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are a financial transaction categorizer. Given a transaction description, return a JSON object with:
          - category: one of these exact categories: ${TRANSACTION_CATEGORIES.join(", ")}
          - insight: a one sentence financial insight about this transaction
          Return only valid JSON, no markdown, no explanation.`,
        },
        {
          role: "user",
          content: `Transaction description: "${description}"`,
        },
      ],
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as { category: string; insight: string };
    return parsed;
  } catch {
    return {
      category: "Miscellaneous",
      insight: "Transaction recorded successfully.",
    };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: Record<string, unknown> = { workspaceId: id };
    if (type && type !== "all") where.type = type;
    if (category) where.category = category;
    if (search) where.description = { contains: search, mode: "insensitive" };
    if (from ?? to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { members: true, financeSettings: true },
    });
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const body = await request.json() as {
      type: string;
      amount: number;
      currency: string;
      category?: string;
      subCategory?: string;
      description: string;
      reference?: string;
      date: string;
      accountId?: string;
      taxAmount?: number;
      taxRate?: number;
      departmentId?: string;
      attachmentUrl?: string;
    };

    // AI categorization if no category provided
    let category = body.category;
    let aiInsight = "";
    let aiCategorized = false;

    if (!category || category === "auto") {
      const aiResult = await aiCategorize(body.description);
      category = aiResult.category;
      aiInsight = aiResult.insight;
      aiCategorized = true;
    }

    const transaction = await prisma.transaction.create({
      data: {
        workspaceId: id,
        type: body.type,
        amount: body.amount,
        currency: body.currency ?? workspace.financeSettings?.defaultCurrency ?? "USD",
        category: category ?? "Miscellaneous",
        subCategory: body.subCategory,
        description: body.description,
        reference: body.reference,
        date: new Date(body.date),
        accountId: body.accountId,
        taxAmount: body.taxAmount,
        taxRate: body.taxRate,
        departmentId: body.departmentId,
        attachmentUrl: body.attachmentUrl,
        createdBy: userId,
        aiCategorized,
        aiInsight,
      },
    });

    // Update account balance if account specified
    if (body.accountId) {
      const balanceChange =
        body.type === "income" ? body.amount :
        body.type === "expense" ? -body.amount : 0;

      await prisma.financeAccount.update({
        where: { id: body.accountId },
        data: { balance: { increment: balanceChange } },
      });
    }

    // Update budget spending if category matches a budget
    const matchingBudget = await prisma.budget.findFirst({
      where: {
        workspaceId: id,
        category: category ?? "Miscellaneous",
      },
    });
    if (matchingBudget && body.type === "expense") {
      await prisma.budget.update({
        where: { id: matchingBudget.id },
        data: { spent: { increment: body.amount } },
      });
    }

    // Audit trail
    if (workspace.financeSettings?.enableAuditTrail) {
      await prisma.auditLog.create({
        data: {
          workspaceId: id,
          userId,
          action: "created",
          entityType: "Transaction",
          entityId: transaction.id,
          newValues: JSON.stringify(transaction),
        },
      });
    }

    // Log activity
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (profile) {
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: id,
          type: body.type === "income" ? "project_updated" : "project_updated",
          title: `Recorded ${body.type}: ${body.description}`,
          description: `${body.type === "income" ? "+" : "-"}${body.amount} ${body.currency} · ${category}`,
          actionUrl: `/workspace/${id}/finance`,
        },
      });
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { transactionId: string };

    const transaction = await prisma.transaction.findUnique({
      where: { id: body.transactionId },
    });
    if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Reverse account balance
    if (transaction.accountId) {
      const balanceChange =
        transaction.type === "income" ? -transaction.amount :
        transaction.type === "expense" ? transaction.amount : 0;

      await prisma.financeAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      });
    }

    await prisma.transaction.delete({
      where: { id: body.transactionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}