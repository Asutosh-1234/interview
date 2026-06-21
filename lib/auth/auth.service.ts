import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { DecodedUser } from "./auth.type";
import { zodVerify } from "../common/zodVeryfication";
import prisma from "../db/prisma";
import { createUserDto } from "./auth.dto";


const generateTokens = (payload: DecodedUser) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ email: payload.email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};


const createUser = async (payload: unknown) => {
  const result = zodVerify(createUserDto, payload);
  if (!result.success) {
    throw new Error(result.error?.issues.map((err) => err.message).join(", "));
  }

  const { email, role, name, password } = result.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { accessToken, refreshToken } = generateTokens({
    email,
    role,
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      refreshToken,
      expiry_date: expiryDate,
    },
  });

  return { user, accessToken };
};

export{
  createUser,
}
