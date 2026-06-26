import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { questionGeneration } from "@/lib/modules/setup/gemini.service";
import { ApiResponse } from "@/lib/common/api.response";
import { ApiError } from "@/lib/common/api.error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function authenticateRequest(req: NextRequest) {
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
    throw ApiError.unauthorized();
  }

  const decoded = await verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user) {
    throw ApiError.unauthorized();
  }

  return user;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const setupId = parseInt(id);

    if (isNaN(setupId)) {
      throw ApiError.badRequest("Invalid setup ID");
    }

    const setup = await prisma.userInput.findUnique({
      where: { id: setupId },
    });

    if (!setup) {
      throw ApiError.notFound("Setup not found");
    }

    if (setup.userId !== user.id) {
      throw ApiError.forbidden();
    }

    return ApiResponse.success({ questions: setup.questions }, undefined, 200);
  } catch (error: any) {
    return ApiError.handle(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const setupId = parseInt(id);

    if (isNaN(setupId)) {
      throw ApiError.badRequest("Invalid setup ID");
    }

    const setup = await prisma.userInput.findUnique({
      where: { id: setupId },
    });

    if (!setup) {
      throw ApiError.notFound("Setup not found");
    }

    if (setup.userId !== user.id) {
      throw ApiError.forbidden();
    }

    // Parse options from body
    let questionsCount = 5;
    try {
      const body = await req.json();
      if (body && typeof body.questionsCount === "number") {
        questionsCount = body.questionsCount;
      }
    } catch (e) {
      // Body might be empty or invalid
    }

    // Generate questions
    const questionsResult = await questionGeneration({
      jobTitle: setup.jobTitle,
      techStack: setup.techStack,
      difficulty: setup.difficulty,
      yearsOfExperience: setup.yearsOfExperience,
      interviewType: setup.interviewType,
      userId: user.id,
      questionsCount,
    });

    const questions = Array.isArray(questionsResult.questions) ? questionsResult.questions : (Array.isArray(questionsResult) ? questionsResult : []);

    // Save questions to database
    const updatedSetup = await prisma.userInput.update({
      where: { id: setupId },
      data: { questions },
    });

    return ApiResponse.success({ questions: updatedSetup.questions }, undefined, 201);
  } catch (error: any) {
    return ApiError.handle(error);
  }
}

