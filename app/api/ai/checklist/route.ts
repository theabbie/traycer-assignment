import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AITaskRequest } from "@/lib/ai-types";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(request: Request) {
  try {
    const body: AITaskRequest & { recaptchaToken?: string } = await request.json();
    const { instruction, repoOwner, repoName, branch, currentFilePath, currentFileContent, recaptchaToken } = body;

    if (!instruction) {
      return NextResponse.json(
        { error: "Instruction is required" },
        { status: 400 }
      );
    }

    if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json(
        { error: "reCAPTCHA verification failed" },
        { status: 403 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const contextInfo = currentFilePath && currentFileContent
      ? `\n\nCurrent file being viewed: ${currentFilePath}\n\nFile content:\n${currentFileContent}`
      : "";

    const prompt = `You are an AI code assistant helping with repository: ${repoOwner}/${repoName} (branch: ${branch}).

User instruction: ${instruction}${contextInfo}

Generate a detailed checklist of tasks needed to accomplish this instruction. Each task should be:
- Specific and actionable
- Related to code changes, file modifications, or repository operations
- Ordered logically

Return ONLY a JSON array of tasks in this exact format:
[
  {"id": "1", "task": "Task description here", "completed": false},
  {"id": "2", "task": "Another task", "completed": false}
]

Do not include any markdown formatting, explanations, or additional text. Just the JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (response.text || "").trim();
    

    let jsonText = text;
    if (text.startsWith("```json")) {
      jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (text.startsWith("```")) {
      jsonText = text.replace(/```\n?/g, "").trim();
    }

    const checklist = JSON.parse(jsonText);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      checklist,
      sessionId,
    });
  } catch (error) {
    console.error("Error generating checklist:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate checklist" },
      { status: 500 }
    );
  }
}
