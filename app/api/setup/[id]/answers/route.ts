import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { reviewAnswerAndSave } from "@/lib/modules/setup/review.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to authenticate request
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

    // Parse body parameters
    const body = await req.json();
    const answer = body.answer || "";
    const skipped = body.skipped === true || answer.trim() === "";
    const questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : -1;

    if (questionIndex < 0 || questionIndex >= setup.questions.length) {
      return NextResponse.json({ error: "Invalid question index" }, { status: 400 });
    }

    const questionText = setup.questions[questionIndex];
    if (!questionText) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    let feedback;
    if (skipped) {
      feedback = {
        overall: 0,
        clarity: 0,
        depth: 0,
        relevance: 0,
        strengths: "Question was skipped by the candidate.",
        improvements: "No answer was provided to evaluate.",
        model_answer_hint: "Skipped question."
      };
      
      const feedbackStr = JSON.stringify(feedback);
      const existingAnswer = await prisma.answers.findFirst({
        where: {
          userInputId: setupId,
          questionIndex: questionIndex,
        },
      });

      if (existingAnswer) {
        await prisma.answers.update({
          where: { id: existingAnswer.id },
          data: {
            answer: "Skipped",
            feedback: feedbackStr,
            score: 0,
          },
        });
      } else {
        await prisma.answers.create({
          data: {
            userInputId: setupId,
            questionIndex: questionIndex,
            answer: "Skipped",
            feedback: feedbackStr,
            score: 0,
          },
        });
      }
    } else {
      // Trigger review service in the background (asynchronously)
      reviewAnswerAndSave(setupId, questionIndex, questionText, answer).catch((err) => {
        console.error("Background evaluation failed:", err);
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to submit answer" }, { status });
  }
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

    const answers = await prisma.answers.findMany({
      where: { userInputId: setupId },
      orderBy: { questionIndex: "asc" },
    });

    // Parse stringified feedback JSON for each answer
    const parsedAnswers = answers.map((ans) => {
      let feedbackParsed = null;
      if (ans.feedback) {
        try {
          feedbackParsed = JSON.parse(ans.feedback);
        } catch (e) {
          // Fallback if not JSON
          feedbackParsed = {
            overall: ans.score || 0,
            clarity: 0,
            depth: 0,
            relevance: 0,
            strengths: ans.feedback,
            improvements: "",
            model_answer_hint: "",
          };
        }
      }
      return {
        id: ans.id,
        answer: ans.answer,
        questionIndex: ans.questionIndex,
        feedback: feedbackParsed,
        score: ans.score,
        createdAt: ans.createdAt,
      };
    });

    return NextResponse.json({ answers: parsedAnswers, setup }, { status: 200 });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch answers" }, { status });
  }
}
