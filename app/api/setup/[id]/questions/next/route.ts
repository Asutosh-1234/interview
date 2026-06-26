import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { generateNextQuestionStream } from "@/lib/modules/setup/gemini.service";
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

    // Safely parse body parameters
    let questionIndex = 0;
    try {
      const body = await req.json();
      questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : 0;
    } catch (e) {
      // Body may be empty or missing for first question
    }

    if (questionIndex < 0) {
      return NextResponse.json({ error: "Invalid questionIndex" }, { status: 400 });
    }

    // Build history for dynamic adaptive prompt
    const pastAnswers = await prisma.answers.findMany({
      where: { userInputId: setupId },
      orderBy: { questionIndex: "asc" },
    });

    const history = pastAnswers.map((ans) => ({
      question: setup.questions[ans.questionIndex] || "Question",
      answer: ans.answer,
    }));

    // Trigger next question streaming
    const responseStream = await generateNextQuestionStream({
      jobTitle: setup.jobTitle,
      companyName: setup.companyName || undefined,
      techStack: setup.techStack,
      difficulty: setup.difficulty,
      yearsOfExperience: setup.yearsOfExperience,
      interviewType: setup.interviewType,
      questionIndex,
      history,
    });

    // Create ReadableStream to proxy Gemini stream chunks and write to database when complete
    let fullQuestionText = "";
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            // Intercept triggerCodingChallenge function call
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              const call = chunk.functionCalls[0];
              if (call.name === "triggerCodingChallenge" && call.args) {
                const langArgs = call.args as { programmingLanguage?: string };
                const lang = (langArgs.programmingLanguage || "javascript").toLowerCase();
                controller.enqueue(new TextEncoder().encode(`[TRIGGER_CODE_EDITOR:${lang}]`));
              }
            }

            const text = chunk.text;
            if (text) {
              fullQuestionText += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();

          // Stream successfully completed, persist the full question text in the setup record
          const updatedQuestions = [...setup.questions];
          updatedQuestions[questionIndex] = fullQuestionText.trim();

          await prisma.userInput.update({
            where: { id: setupId },
            data: { questions: updatedQuestions },
          });
        } catch (err) {
          console.error("Error during streaming generation:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to generate next question" }, { status });
  }
}
