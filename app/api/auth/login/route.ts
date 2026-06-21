import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/modules/auth/auth.service";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await loginUser(body);
    const cookieStore = await cookies();
    cookieStore.set("auth", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 400 });
  }
}
