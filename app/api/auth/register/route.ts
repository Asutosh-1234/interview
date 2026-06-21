import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/modules/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createUser(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 400 });
  }
}
