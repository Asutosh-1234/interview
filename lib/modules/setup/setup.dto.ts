import { z } from "zod";
import { Level, InterviewType } from "@/generated/prisma/enums";

export const createSetupDto = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  techStack: z.array(z.string()).default([]),
  difficulty: z.enum(Level).default(Level.Junior),
  yearsOfExperience: z.number().int().min(0).default(0),
  interviewType: z.enum(InterviewType).default(InterviewType.Technical),
  userId: z.number().int(),
});
