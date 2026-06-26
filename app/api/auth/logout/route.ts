import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiResponse } from "@/lib/common/api.response";
import { ApiError } from "@/lib/common/api.error";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth");
    
    return ApiResponse.success(null, "Logged out successfully", 200);
  } catch (error: any) {
    return ApiError.handle(error);
  }
}

