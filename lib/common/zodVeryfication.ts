import { z } from "zod";

export const zodVerify = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};