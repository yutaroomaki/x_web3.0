import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { code: "asc" },
    });

    return successResponse(templates);
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return serverErrorResponse();
  }
}
