import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      `Analyze this receipt image and extract the following information in JSON format:
      {
        "amount": number (total amount paid),
        "date": "YYYY-MM-DD" (date of transaction),
        "description": "string" (what was purchased or vendor name),
        "vendor": "string" (store or company name),
        "items": ["string"] (list of items if visible),
        "currency": "string" (currency code if visible, e.g. USD, UGX)
      }
      Return only valid JSON, no markdown, no explanation. If you cannot read a field clearly, omit it.`,
    ]);

    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean) as {
      amount?: number;
      date?: string;
      description?: string;
      vendor?: string;
      items?: string[];
      currency?: string;
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Receipt scan error:", error);
    return NextResponse.json({ error: "Failed to scan receipt" }, { status: 500 });
  }
}