import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/modules/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await loginUser(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 400 });
  }
}
