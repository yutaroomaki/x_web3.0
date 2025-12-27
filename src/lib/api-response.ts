import { NextResponse } from "next/server";

export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message, details },
    },
    { status }
  );
}

export function notFoundResponse(message = "Not found"): NextResponse<ApiErrorResponse> {
  return errorResponse("NOT_FOUND", message, 404);
}

export function validationErrorResponse(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return errorResponse("VALIDATION_ERROR", message, 400, details);
}

export function serverErrorResponse(
  message = "Internal server error"
): NextResponse<ApiErrorResponse> {
  return errorResponse("INTERNAL_ERROR", message, 500);
}
