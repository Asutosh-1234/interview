import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InterviewContainer } from "@/components/InterviewContainer";

interface PageProps {
  searchParams: Promise<{ currentSetupId?: string; timerDuration?: string }>;
}

export default async function InterviewPage({ searchParams }: PageProps) {
  const { currentSetupId, timerDuration } = await searchParams;
  const timerSecs = timerDuration ? parseInt(timerDuration) : 0;

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
    timerDuration: timerSecs,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient background element */}
      <div className="ambient-glow" />
      
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <InterviewContainer setup={formattedSetup} />
      </main>
      
      <Footer />
    </div>
  );
}
