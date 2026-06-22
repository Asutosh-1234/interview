import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-[-25%] left-[-15%] w-[700px] h-[700px] rounded-full bg-violet-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[700px] h-[700px] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none" />

      <InterviewContainer setup={formattedSetup} />
    </div>
  );
}
