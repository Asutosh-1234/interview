import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode = 400,
    public readonly details?: any
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public toResponse(): NextResponse {
    const payload: Record<string, any> = {
      success: false,
      error: this.message,
    };
    
    if (this.details !== undefined) {
      payload.details = this.details;
    }
    
    return NextResponse.json(payload, { status: this.statusCode });
  }

  public static handle(error: any): NextResponse {
    if (error instanceof ApiError) {
      return error.toResponse();
    }

    const message = error?.message || "An unexpected error occurred";
    let statusCode = 400; // Default client error/bad request

    if (message === "Unauthorized") {
      statusCode = 401;
    } else if (message === "Forbidden") {
      statusCode = 403;
    } else if (message === "Setup not found" || message === "User not found") {
      statusCode = 404;
    } else if (error?.status && typeof error.status === "number") {
      statusCode = error.status;
    } else if (error?.statusCode && typeof error.statusCode === "number") {
      statusCode = error.statusCode;
    }

    return new ApiError(message, statusCode).toResponse();
  }

  public static badRequest(message: string, details?: any): ApiError {
    return new ApiError(message, 400, details);
  }

  public static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(message, 401);
  }

  public static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(message, 403);
  }

  public static notFound(message = "Resource not found"): ApiError {
    return new ApiError(message, 404);
  }

  public static internal(message = "Internal server error"): ApiError {
    return new ApiError(message, 500);
  }
}
