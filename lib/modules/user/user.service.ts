import prisma from "../../db/prisma";
import { updateUserProfileDto } from "./user.dto";
import { zodVerify } from "../../common/zodVeryfication";
import { UpdateUserProfilePayload } from "./user.type";

export const updateUserProfile = async (payload: UpdateUserProfilePayload) => {
  const result = zodVerify(updateUserProfileDto, payload);
  if (!result.success) {
    throw new Error(result.error?.issues.map((err) => err.message).join(", "));
  }

  const {
    userId,
    name,
    phone,
    bio,
    skills,
    experienceYears,
    resumeUrl,
    resumeName,
    resumeText,
  } = result.data;

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      phone: phone ?? null,
      bio: bio ?? null,
      skills: skills ?? [],
      experienceYears: experienceYears ?? 0,
      resumeUrl: resumeUrl ?? null,
      resumeName: resumeName ?? null,
      resumeText: resumeText ?? null,
    },
  });

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    bio: updatedUser.bio,
    skills: updatedUser.skills,
    experienceYears: updatedUser.experienceYears,
    resumeUrl: updatedUser.resumeUrl,
    resumeName: updatedUser.resumeName,
  };
};
