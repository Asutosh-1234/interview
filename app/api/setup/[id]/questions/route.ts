import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { questionGeneration } from "@/lib/modules/setup/gemini.service";

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
    throw new Error("Unauthorized");
  }

  const decoded = await verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const setupId = parseInt(id);

    if (isNaN(setupId)) {
      return NextResponse.json({ error: "Invalid setup ID" }, { status: 400 });
    }

    const setup = await prisma.userInput.findUnique({
      where: { id: setupId },
    });

    if (!setup) {
      return NextResponse.json({ error: "Setup not found" }, { status: 404 });
    }

    if (setup.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ questions: setup.questions }, { status: 200 });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch questions" }, { status });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const setupId = parseInt(id);

    if (isNaN(setupId)) {
      return NextResponse.json({ error: "Invalid setup ID" }, { status: 400 });
    }

    const setup = await prisma.userInput.findUnique({
      where: { id: setupId },
    });

    if (!setup) {
      return NextResponse.json({ error: "Setup not found" }, { status: 404 });
    }

    if (setup.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    return NextResponse.json({ questions: updatedSetup.questions }, { status: 201 });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to generate questions" }, { status });
  }
}
