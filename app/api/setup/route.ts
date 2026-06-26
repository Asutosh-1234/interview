import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import { createSetup } from "@/lib/modules/setup/setup.service";
import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { ApiResponse } from "@/lib/common/api.response";
import { ApiError } from "@/lib/common/api.error";

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Token (from Authorization header or auth cookie)
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
      throw ApiError.unauthorized("Missing or invalid authentication");
    }
    
    // 2. Verify JWT token
    const decoded = await verifyToken(token);
    
    // 3. Look up user by email to get their database ID
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // 4. Parse payload
    const body = await req.json();

    // 5. Invoke Setup Service with the userId injected
    const setup = await createSetup({
      ...body,
      userId: user.id,
    });

    return ApiResponse.success(setup, undefined, 201);
  } catch (error: any) {
    return ApiError.handle(error);
  }
}

