import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SummaryContainer } from "@/components/SummaryContainer";

interface PageProps {
  searchParams: Promise<{ currentSetupId?: string }>;
}

export default async function SummaryPage({ searchParams }: PageProps) {
  const { currentSetupId } = await searchParams;

  if (!currentSetupId) {
    redirect("/setup");
  }

  const setupId = parseInt(currentSetupId);
  if (isNaN(setupId)) {
    redirect("/setup?error=Invalid setup ID");
  }

  // 1. Retrieve the auth cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;

  if (!token) {
    redirect("/login");
  }

  // 2. Validate the JWT token
  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    redirect("/login");
  }

  // 3. Find user and check setup ownership
  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user) {
    redirect("/login");
  }

  const setup = await prisma.userInput.findUnique({
    where: { id: setupId },
    include: {
      answers: {
        orderBy: { questionIndex: "asc" },
      },
    },
  });

  if (!setup) {
    redirect("/setup?error=Setup session not found");
  }

  if (setup.userId !== user.id) {
    redirect("/setup?error=Access denied");
  }

  const formattedSetup = {
    id: setup.id,
    jobTitle: setup.jobTitle,
    companyName: setup.companyName,
    questionsCount: setup.questionsCount,
    techStack: setup.techStack,
    difficulty: setup.difficulty,
    yearsOfExperience: setup.yearsOfExperience,
    interviewType: setup.interviewType,
    questions: setup.questions,
  };

  const formattedAnswers = setup.answers.map((ans) => {
    let feedbackParsed = null;
    if (ans.feedback) {
      try {
        feedbackParsed = JSON.parse(ans.feedback);
      } catch (e) {
        feedbackParsed = {
          overall: ans.score || 0,
          clarity: 0,
          depth: 0,
          relevance: 0,
          strengths: ans.feedback || "",
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
      createdAt: ans.createdAt.toISOString(),
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient background element */}
      <div className="ambient-glow" />
      
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <SummaryContainer setup={formattedSetup} initialAnswers={formattedAnswers} />
      </main>
      
      <Footer />
    </div>
  );
}
