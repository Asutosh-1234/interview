import prisma from "../../db/prisma";
import { GoogleGenAI } from "@google/genai";
import ENV from "@/lib/common/env";
import { Level, InterviewType } from "@/generated/prisma/enums";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export async function getUserProfileData(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bio: true,
      skills: true,
      experienceYears: true,
      resumeName: true,
      resumeText: true,
    },
  });
  return user;
}

export async function startProfileBasedInterview(userId: number) {
  // 1. Fetch user profile data
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const hasProfile = user.bio || (user.skills && user.skills.length > 0) || user.resumeText;
  if (!hasProfile) {
    throw new Error("Profile is empty. Please upload your resume or complete your profile details first.");
  }

  // 2. Use Gemini to analyze the profile and recommend interview setup params
  const prompt = `You are an expert AI interview system coordinator.
Given the candidate's profile:
- Name: ${user.name}
- Bio: ${user.bio || "N/A"}
- Skills: ${user.skills.join(", ") || "N/A"}
- Experience Years: ${user.experienceYears || 0}
- Resume Name: ${user.resumeName || "N/A"}
- Resume Transcript: ${user.resumeText ? user.resumeText.substring(0, 4000) : "N/A"}

Please analyze the resume/profile and determine the best parameters for a practice interview simulation.
Extract or recommend:
1. "jobTitle": The target job role (e.g. Frontend Engineer, Product Manager, Data Scientist) that best fits their skills and experience.
2. "techStack": A list of 3-6 key technologies/skills that are highly relevant to their profile and the recommended job title, which should be tested during the interview.
3. "difficulty": Select the most appropriate experience tier from this list: "Fresher", "Junior", "Mid", "Senior". (Rule of thumb: 0 years = Fresher, 1-2 years = Junior, 3-5 years = Mid, 5+ years = Senior).
4. "interviewType": Select the most appropriate interview category from this list: "Technical", "Behavioral", "System", "Design", "Mixed".

Respond strictly in JSON format matching this structure:
{
  "jobTitle": "Job Title",
  "techStack": ["Skill1", "Skill2", "Skill3"],
  "difficulty": "Junior",
  "interviewType": "Technical"
}

Do not include any conversational filler, markdown formatting (e.g. no \`\`\`json blocks), or extra notes.`;

  const response = await ai.models.generateContent({
    model: ENV.QUESTION_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  if (!response || !response.text) {
    throw new Error("Failed to analyze candidate profile with Gemini");
  }

  let config;
  try {
    config = JSON.parse(response.text.trim());
  } catch (error) {
    // Attempt fallback parsing
    const match = response.text.match(/\{[\s\S]*\}/);
    if (match) {
      config = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse Gemini profile analysis response");
    }
  }

  // Validate Gemini outputs
  const jobTitle = config.jobTitle || "Software Engineer";
  const techStack = Array.isArray(config.techStack) ? config.techStack : [];
  
  // Map string difficulty to Level enum
  let difficulty: Level = Level.Junior;
  const rawDifficulty = String(config.difficulty).toLowerCase();
  if (rawDifficulty.includes("fresh")) difficulty = Level.Fresher;
  else if (rawDifficulty.includes("mid")) difficulty = Level.Mid;
  else if (rawDifficulty.includes("sen")) difficulty = Level.Senior;

  // Map string interviewType to InterviewType enum
  let interviewType: InterviewType = InterviewType.Technical;
  const rawType = String(config.interviewType).toLowerCase();
  if (rawType.includes("behav")) interviewType = InterviewType.Behavioral;
  else if (rawType.includes("system")) interviewType = InterviewType.System;
  else if (rawType.includes("design")) interviewType = InterviewType.Design;
  else if (rawType.includes("mix")) interviewType = InterviewType.Mixed;

  const questionsCount = 5; // Default questions count

  // 3. Create userInput record (the interview setup)
  const setup = await prisma.userInput.create({
    data: {
      jobTitle,
      companyName: "Profile Customized",
      questionsCount,
      techStack,
      difficulty,
      yearsOfExperience: user.experienceYears || 0,
      interviewType,
      userId: user.id,
    },
  });

  return setup;
}
