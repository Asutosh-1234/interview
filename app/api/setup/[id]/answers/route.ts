import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { reviewAnswerAndSave } from "@/lib/modules/setup/review.service";
import { ApiResponse } from "@/lib/common/api.response";
import { ApiError } from "@/lib/common/api.error";

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

    // Parse body parameters
    const body = await req.json();
    const answer = body.answer || "";
    const skipped = body.skipped === true || answer.trim() === "";
    const questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : -1;

    if (questionIndex < 0 || questionIndex >= setup.questions.length) {
      throw ApiError.badRequest("Invalid question index");
    }

    const questionText = setup.questions[questionIndex];
    if (!questionText) {
      throw ApiError.notFound("Question not found");
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

    return ApiResponse.success({ success: true }, undefined, 200);
  } catch (error: any) {
    return ApiError.handle(error);
  }
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

    return ApiResponse.success({ answers: parsedAnswers, setup }, undefined, 200);
  } catch (error: any) {
    return ApiError.handle(error);
  }
}

