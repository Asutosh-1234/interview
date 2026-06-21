import { Role } from "@/generated/prisma/enums";

export interface DecodedUser {
  email: string;
  role: Role;
}

export interface CreateUserPayload {
  email: string;
  role: Role;
  name: string;
  password: string;
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

