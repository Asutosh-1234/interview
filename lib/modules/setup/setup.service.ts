import prisma from "../../db/prisma";
import { createSetupDto } from "./setup.dto";
import { zodVerify } from "../../common/zodVeryfication";
import { CreateSetupPayload } from "./setup.type";

export const createSetup = async (payload: CreateSetupPayload) => {
  const result = zodVerify(createSetupDto, payload);
  if (!result.success) {
    throw new Error(result.error?.issues.map((err) => err.message).join(", "));
  }

  const { jobTitle, companyName, questionsCount, techStack, difficulty, yearsOfExperience, interviewType, userId } = result.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const setup = await prisma.userInput.create({
    data: {
      jobTitle,
      companyName,
      questionsCount,
      techStack,
      difficulty,
      yearsOfExperience,
      interviewType,
      userId,
    },
  });

  return setup;
};
