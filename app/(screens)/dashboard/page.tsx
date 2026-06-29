import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { DashboardContainer } from "@/components/DashboardContainer";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function DashboardPage() {
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
    decoded = null;
  }

  if (!decoded) {
    redirect("/login");
  }

  // 3. Find user
  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user) {
    redirect("/login");
  }

  // 4. Fetch all userInputs and associated answers
  const userInputs = await prisma.userInput.findMany({
    where: { userId: user.id },
    include: {
      answers: {
        orderBy: { questionIndex: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 5. Map and calculate session summaries
  const sessions = userInputs.map((input) => {
    const answers = input.answers || [];
    const totalQuestions = input.questionsCount;

    // Filter skipped vs answered
    const answeredAnswers = answers.filter((a) => a.answer !== "Skipped" && a.answer.trim() !== "");
    const answeredCount = answeredAnswers.length;
    const skippedCount = totalQuestions - answeredCount;

    // Graded answers (has score and not skipped)
    const gradedAnswers = answeredAnswers.filter((a) => a.score !== null);
    const scoreSum = gradedAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const averageScore = gradedAnswers.length > 0 ? parseFloat((scoreSum / gradedAnswers.length).toFixed(1)) : 0;

    // Determine verdict
    let verdict = "Needs Work";
    if (gradedAnswers.length > 0) {
      if (averageScore >= 8) verdict = "Strong";
      else if (averageScore >= 6) verdict = "Good";
      else if (averageScore >= 4) verdict = "Fair";
    } else if (answers.length === 0) {
      verdict = "Not Started";
    } else if (answers.length < totalQuestions) {
      verdict = "In Progress";
    }

    return {
      id: input.id,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      interviewType: input.interviewType,
      difficulty: input.difficulty,
      questionsCount: totalQuestions,
      answeredCount,
      skippedCount,
      averageScore,
      verdict,
      date: input.createdAt.toISOString(),
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient background element */}
      <div className="ambient-glow" />
      
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <DashboardContainer sessions={sessions} />
      </main>
      
      <Footer />
    </div>
  );
}
