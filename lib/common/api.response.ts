import { NextResponse } from "next/server";

export class ApiResponse<T = any> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly message?: string
  ) {}

  public toResponse(status = 200): NextResponse {
    const payload: Record<string, any> = {
      success: this.success,
    };
    
    if (this.message !== undefined) {
      payload.message = this.message;
    }

    if (this.data !== undefined && this.data !== null) {
      if (typeof this.data === "object" && !Array.isArray(this.data)) {
        Object.assign(payload, this.data);
      } else {
        payload.data = this.data;
      }
    }

    return NextResponse.json(payload, { status });
  }

  public static success<T>(data?: T, message?: string, status = 200): NextResponse {
    return new ApiResponse(true, data, message).toResponse(status);
  }
}
