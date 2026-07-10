import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import prisma from "@/lib/db/prisma";
import { ApiResponse } from "@/lib/common/api.response";
import { ApiError } from "@/lib/common/api.error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function authenticateRequest(req: NextRequest) {
  let token = "";
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth")?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    throw ApiError.unauthorized();
  }

  const decoded = await verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user) {
    throw ApiError.unauthorized();
  }

  return user;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const setupId = parseInt(id);

    if (isNaN(setupId)) {
      throw ApiError.badRequest("Invalid setup ID");
    }

    const setup = await prisma.userInput.findUnique({
      where: { id: setupId },
    });

    if (!setup) {
      throw ApiError.notFound("Setup not found");
    }

    if (setup.userId !== user.id) {
      throw ApiError.forbidden();
    }

    const body = await req.json();
    const { tabSwitchesCount, tabSwitchLogs } = body;

    if (typeof tabSwitchesCount !== "number" || typeof tabSwitchLogs !== "string") {
      throw ApiError.badRequest("Invalid request body. Requires tabSwitchesCount (number) and tabSwitchLogs (string)");
    }

    const updatedSetup = await prisma.userInput.update({
      where: { id: setupId },
      data: {
        tabSwitchesCount,
        tabSwitchLogs,
      },
    });

    return ApiResponse.success({ 
      success: true, 
      tabSwitchesCount: updatedSetup.tabSwitchesCount 
    }, undefined, 200);
  } catch (error: any) {
    return ApiError.handle(error);
  }
}
