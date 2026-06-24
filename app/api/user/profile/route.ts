import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import { updateUserProfile } from "@/lib/modules/user/user.service";
import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Token
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
      return NextResponse.json({ error: "Missing or invalid authentication" }, { status: 401 });
    }

    // 2. Verify JWT
    const decoded = await verifyToken(token);

    // 3. Look up user
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Parse payload
    const body = await req.json();

    // 5. Invoke service with userId
    const updated = await updateUserProfile({
      ...body,
      userId: user.id,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 400 }
    );
  }
}
