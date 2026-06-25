import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth");
    
    return NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
}
