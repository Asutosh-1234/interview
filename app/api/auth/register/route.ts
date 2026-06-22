import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/modules/auth/auth.service";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createUser(body);
    const cookieStore = await cookies();
    cookieStore.set("auth", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 400 });
  }
}
