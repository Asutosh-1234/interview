import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import ENV from "@/lib/common/env";
import fs from "fs";
import path from "path";
import { ApiResponse } from "@/lib/common/api.response";
import { ApiError } from "@/lib/common/api.error";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Token
    let token = "";
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get("auth")?.value;
      if (cookieToken) {
        token = cookieToken;
      }
    }

    if (!token) {
      throw ApiError.unauthorized("Missing or invalid authentication");
    }

    // 2. Verify JWT
    const decoded = await verifyToken(token);

    // 3. Look up user
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // 4. Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw ApiError.badRequest("No resume file provided");
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique file name
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${user.id}_${Date.now()}_${sanitizedFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Save file locally
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/resumes/${uniqueFileName}`;

    // 5. Send file buffer to Gemini for processing
    const response = await ai.models.generateContent({
      model: ENV.QUESTION_MODEL || "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type || "application/pdf",
          },
        },
        `You are an expert AI resume parsing assistant. 
        Analyze the uploaded resume file and extract the following information. 
        Note: The resume text transcript should be a clean, markdown-friendly textual content of the resume, including experience and education.

        Respond strictly in valid JSON format matching the following structure:
        {
          "name": "Candidate Full Name",
          "phone": "Candidate Phone Number",
          "bio": "A professional bio or summary of the candidate, around 2-3 sentences",
          "skills": ["Skill1", "Skill2", "Skill3"],
          "experienceYears": 3,
          "resumeText": "Clean formatted text transcript of the resume content..."
        }
        
        Ensure you only return valid JSON. Do not include markdown code block markers (e.g. \`\`\`json) or any other conversational text.`,
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response || !response.text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedData = JSON.parse(response.text.trim());

    return ApiResponse.success({
      resumeUrl: relativeUrl,
      resumeName: file.name,
      extractedData: parsedData,
    });
  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return ApiError.handle(error);
  }
}

