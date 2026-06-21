import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { DecodedUser, LoginUserPayload } from "./auth.type";
import { zodVerify } from "../../common/zodVeryfication";
import prisma from "../../db/prisma";
import { createUserDto, loginUserDto } from "./auth.dto";


const generateTokens = (payload: DecodedUser) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ email: payload.email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
}

const verifyToken = async (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as DecodedUser;
  } catch (error) {
    throw new Error("Invalid token");
  }
}


const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
}


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

  const hashedPassword = await hashPassword(password);

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

const loginUser = async (payload: unknown) => {
  const result = zodVerify(loginUserDto, payload);
  if (!result.success) {
    throw new Error(result.error?.issues.map((err) => err.message).join(", "));
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const { accessToken, refreshToken } = generateTokens({
    email: user.email,
    role: user.role,
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      expiry_date: expiryDate,
    },
  });

  return { user: updatedUser, accessToken };
};


export {
  createUser,
  loginUser,
};
