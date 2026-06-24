import z from "zod";

export const updateUserProfileDto = z.object({
  userId: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
  resumeName: z.string().optional().nullable(),
  resumeText: z.string().optional().nullable(),
});
