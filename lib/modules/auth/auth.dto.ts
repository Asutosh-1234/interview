import z from "zod";
import { Role } from "@/generated/prisma/enums";

export const createUserDto = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(Role).default(Role.USER),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginUserDto = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});