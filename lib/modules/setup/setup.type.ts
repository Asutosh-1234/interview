import { Level, InterviewType } from "@/generated/prisma/enums";

export interface CreateSetupPayload {
  jobTitle: string;
  companyName?: string;
  techStack: string[];
  difficulty: Level;
  yearsOfExperience: number;
  interviewType: InterviewType;
  userId: number;
  questionsCount: number;
}
