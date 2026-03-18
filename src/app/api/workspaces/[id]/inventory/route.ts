import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../generated/prisma";
import Groq from "groq-sdk";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateProductInsight(
  name: string,
  category: string,
  currentStock: number,
  minimumStock: number,
  costPrice: number,
  sellingPrice: number
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are a business inventory analyst. Generate a single short insight (max 15 words) about a product based on its details. Be specific and actionable.",
        },
        {
          role: "user",
          content: `Product: ${name}, Category: ${category}, Stock: ${currentStock}, Min Stock: ${minimumStock}, Cost: ${costPrice}, Price: ${sellingPrice}`,
        },
      ],
      max_tokens: 50,
    });
    return response.choices[0]?.message?.content ?? "";
  } catch {
    return "";
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
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { workspaceId: id };
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
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

    const body = await request.json() as {
      name: string;
      sku?: string;
      barcode?: string;
      category?: string;
      description?: string;
      unit?: string;
      costPrice: number;
      sellingPrice: number;
      currentStock: number;
      minimumStock: number;
      maximumStock?: number;
      supplierId?: string;
      imageUrl?: string;
    };

    const aiInsight = await generateProductInsight(
      body.name,
      body.category ?? "General",
      body.currentStock,
      body.minimumStock,
      body.costPrice,
      body.sellingPrice
    );

    const product = await prisma.product.create({
      data: {
        workspaceId: id,
        name: body.name,
        sku: body.sku,
        barcode: body.barcode,
        category: body.category,
        description: body.description,
        unit: body.unit ?? "piece",
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        currentStock: body.currentStock,
        minimumStock: body.minimumStock,
        maximumStock: body.maximumStock,
        supplierId: body.supplierId,
        imageUrl: body.imageUrl,
        createdBy: userId,
        aiInsight,
      },
    });

    if (body.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          workspaceId: id,
          productId: product.id,
          type: "purchase",
          quantity: body.currentStock,
          unitCost: body.costPrice,
          totalCost: body.currentStock * body.costPrice,
          reference: "Initial stock",
          createdBy: userId,
        },
      });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (profile) {
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: id,
          type: "project_created",
          title: `Added product "${body.name}"`,
          description: `Stock: ${body.currentStock} ${body.unit ?? "pieces"} · Price: ${body.sellingPrice}`,
          actionUrl: `/workspace/${id}/finance/inventory`,
        },
      });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      productId: string;
      adjustmentType: "add" | "remove" | "set";
      quantity: number;
      notes?: string;
    };

    const product = await prisma.product.findUnique({
      where: { id: body.productId },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let newStock = product.currentStock;
    if (body.adjustmentType === "add") newStock += body.quantity;
    else if (body.adjustmentType === "remove") newStock -= body.quantity;
    else newStock = body.quantity;

    newStock = Math.max(0, newStock);

    await prisma.product.update({
      where: { id: body.productId },
      data: { currentStock: newStock },
    });

    await prisma.stockMovement.create({
      data: {
        workspaceId: id,
        productId: body.productId,
        type: "adjustment",
        quantity: body.adjustmentType === "remove" ? -body.quantity : body.quantity,
        notes: body.notes,
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, newStock });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
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

    const body = await request.json() as { productId: string };

    await prisma.product.update({
      where: { id: body.productId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}