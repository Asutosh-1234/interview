"use server";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { createSetup } from "@/lib/modules/setup/setup.service";
import { redirect } from "next/navigation";
import { Level, InterviewType } from "@/generated/prisma/enums";

export async function submitSetupAction(formData: FormData) {
  // 1. Get auth token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  if (!token) {
    redirect("/login");
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (error) {
    redirect("/login");
  }

  // 3. Find user
  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });
  if (!user) {
    redirect("/login");
  }

  // 4. Extract form data
  const jobTitle = formData.get("jobTitle") as string;
  const companyName = formData.get("companyName") as string;
  const yearsOfExperienceRaw = formData.get("yearsOfExperience");
  const yearsOfExperience = yearsOfExperienceRaw ? Number(yearsOfExperienceRaw) : 0;
  const interviewType = formData.get("interviewType") as InterviewType;
  const difficulty = formData.get("difficulty") as Level;
  const questionsCountRaw = formData.get("questionsCount");
  const questionsCount = questionsCountRaw ? Number(questionsCountRaw) : 5;
  
  // For techStack, parse it from JSON string
  const techStackRaw = formData.get("techStack") as string;
  let techStack: string[] = [];
  try {
    techStack = techStackRaw ? JSON.parse(techStackRaw) : [];
  } catch (e) {
    techStack = [];
  }

  let setup;
  try {
    setup = await createSetup({
      jobTitle,
      techStack,
      difficulty,
      yearsOfExperience,
      interviewType,
      userId: user.id,
      questionsCount,
    });
  } catch (error: any) {
    const errorMsg = error.message || "Failed to create setup";
    redirect(`/setup?error=${encodeURIComponent(errorMsg)}`);
  }

  // 5. Redirect to interview screen with query parameters
  redirect(`/interview?currentSetupId=${setup.id}&questionsCount=${questionsCount}&jobTitle=${encodeURIComponent(jobTitle)}&companyName=${encodeURIComponent(companyName)}`);
}
