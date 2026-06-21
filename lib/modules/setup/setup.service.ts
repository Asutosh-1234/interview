import prisma from "../../db/prisma";
import { createSetupDto } from "./setup.dto";
import { zodVerify } from "../../common/zodVeryfication";

export const createSetup = async (payload: unknown) => {
  const result = zodVerify(createSetupDto, payload);
  if (!result.success) {
    throw new Error(result.error?.issues.map((err) => err.message).join(", "));
  }

  const { jobTitle, techStack, difficulty, yearsOfExperience, interviewType, userId } = result.data;

  // Verify that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const setup = await prisma.userInput.create({
    data: {
      jobTitle,
      techStack,
      difficulty,
      yearsOfExperience,
      interviewType,
      userId,
    },
  });

  return setup;
};
