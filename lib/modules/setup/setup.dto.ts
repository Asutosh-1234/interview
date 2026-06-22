import { z } from "zod";
import { Level, InterviewType } from "@/generated/prisma/enums";

export const createSetupDto = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  difficulty: z.nativeEnum(Level).default(Level.Junior),
  yearsOfExperience: z.number().int().min(0).default(0),
  interviewType: z.nativeEnum(InterviewType).default(InterviewType.Technical),
  userId: z.number().int(),
  questionsCount: z.number().int().min(0).default(0),
});
