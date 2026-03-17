import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.financeSettings.findUnique({
      where: { workspaceId: id },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
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
      include: { members: true },
    });
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const isOwner =
      workspace.ownerId === userId ||
      member.role === "owner" ||
      member.role === "co-owner";
    if (!isOwner) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await request.json() as {
      fiscalYearStart: string;
      defaultCurrency: string;
      enableInvoicing: boolean;
      enableAccounts: boolean;
      enableBudgets: boolean;
      enableTax: boolean;
      enablePayroll: boolean;
      enablePayables: boolean;
      enableMultiCurrency: boolean;
      enableDoubleEntry: boolean;
      enableJournalEntries: boolean;
      enableAuditTrail: boolean;
      enableAdvancedReports: boolean;
    };

    // Auto-enable dependencies
    if (body.enableJournalEntries) body.enableAccounts = true;
    if (body.enableDoubleEntry) {
      body.enableAccounts = true;
      body.enableJournalEntries = true;
    }
    if (body.enableAdvancedReports) body.enableDoubleEntry = true;

    const settings = await prisma.financeSettings.upsert({
      where: { workspaceId: id },
      update: { ...body, isSetup: true },
      create: { workspaceId: id, ...body, isSetup: true },
    });

    // Log activity
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (profile) {
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: id,
          type: "workspace_updated",
          title: "Finance module configured",
          description: `Finance settings updated for "${workspace.name}"`,
          actionUrl: `/workspace/${id}/finance`,
        },
      });
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}