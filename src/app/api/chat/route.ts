import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      console.error("AI Assistant Error: GEMINI_API_KEY is missing in environment.");
    }
    const genAI = new GoogleGenerativeAI(key || "");
    const { prompt, productContext } = await req.json();

    const systemInstruction = `
        You are Noa, the professional AI sales and technical advisor for Saban Building Materials.
        You treat the user as a "Professional Partner" (שותף למקצוע).
        Your goal is to provide expert guidance on building materials and help them complete orders.
        
        Technical Focus:
        - Drying time
        - Coverage
        - Application method
        - Wait periods
        
        Sales Capabilities:
        - If the user wants to buy, order, or checkout, you MUST include the token "START_ORDER" exactly in your response.
        - You should gracefully guide them towards finalizing their purchase.
        
        Language: Hebrew (RTL). You must respond in professional, helpful Hebrew.
        Tone: Sophisticated, premium, knowledgeable, and inviting.
        
        Context: ${productContext || 'General technical inquiries and ordering building materials.'}
        
        If asked about a specific product, emphasize its unique benefits and technical advantages.
        If you don't know the answer, politely suggest contacting Saban's human support.
      `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "Failed to fetch AI response" }, { status: 500 });
  }
}
