import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import { createSetup } from "@/lib/modules/setup/setup.service";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Authorization Header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // 2. Verify JWT token
    const decoded = await verifyToken(token);
    
    // 3. Look up user by email to get their database ID
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Parse payload
    const body = await req.json();

    // 5. Invoke Setup Service with the userId injected
    const setup = await createSetup({
      ...body,
      userId: user.id,
    });

    return NextResponse.json(setup, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to start interview setup" }, { status: 400 });
  }
}
