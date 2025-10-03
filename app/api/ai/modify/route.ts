import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { AIModificationRequest } from "@/lib/ai-types";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(request: Request) {
  try {
    const body: AIModificationRequest & { recaptchaToken?: string } = await request.json();
    const { sessionId, checklist, fileTree, fileContents, recaptchaToken } = body;

    if (!sessionId || !checklist || !fileTree) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const modifyFileDeclaration = {
      name: "modify_file",
      description: "Modifies the content of a file. Provide the complete new content for the file.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          path: {
            type: Type.STRING,
            description: "The file path to modify",
          },
          content: {
            type: Type.STRING,
            description: "The complete new content for the file",
          },
          explanation: {
            type: Type.STRING,
            description: "Brief explanation of what was changed and why",
          },
        },
        required: ["path", "content", "explanation"],
      },
    };
    const checklistText = checklist.map((item, idx) => `${idx + 1}. ${item.task}`).join("\n");
    const fileTreeText = fileTree.slice(0, 100).join("\n");
    

    const fileContentsText = Object.entries(fileContents || {})
      .filter(([, content]) => content && content.trim().length > 0)
      .map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``)
      .join("\n\n");

    const prompt = `You are an AI code assistant. You need to accomplish these tasks:

${checklistText}
Available files in repository (first 100):
${fileTreeText}

${fileContentsText ? `\nFile contents that have been loaded:\n\n${fileContentsText}\n` : ''}

Instructions:
1. Analyze the tasks and the provided file contents
2. Use modify_file function for each file you want to change
3. Provide the COMPLETE new file content in modify_file, not just diffs or partial changes
4. Make all necessary changes to accomplish ALL the tasks in the checklist
5. If a file needs to be modified but its content wasn't provided, you can still call modify_file with your best understanding

IMPORTANT: You must call modify_file for EVERY file that needs changes. Do not skip any tasks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [modifyFileDeclaration],
        }],
      },
    });

    const modifications: Array<{
      path: string;
      originalContent: string;
      modifiedContent: string;
    }> = [];
    
    let explanation = "";

    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const functionCall of response.functionCalls) {
        if (functionCall.name === "modify_file") {
          const args = functionCall.args as { path: string; content: string; explanation: string };
          const originalContent = fileContents[args.path] || "";
          
          modifications.push({
            path: args.path,
            originalContent,
            modifiedContent: args.content,
          });
          
          explanation += `${args.explanation}\n`;
        }
      }
    } else {

      explanation = response.text || "No modifications suggested";
    }

    return NextResponse.json({
      modifications,
      explanation: explanation.trim() || "Files modified according to checklist tasks",
    });
  } catch (error) {
    console.error("Error generating modifications:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate modifications" },
      { status: 500 }
    );
  }
}
