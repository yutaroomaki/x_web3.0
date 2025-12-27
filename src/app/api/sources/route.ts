import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { CreateSourceSchema, SourceQuerySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledParam = searchParams.get("enabled");
    const typeParam = searchParams.get("type");

    const query = SourceQuerySchema.safeParse({
      ...(enabledParam !== null && { enabled: enabledParam }),
      ...(typeParam !== null && { type: typeParam }),
    });

    if (!query.success) {
      return validationErrorResponse("Invalid query parameters", {
        errors: query.error.flatten().fieldErrors,
      });
    }

    const sources = await prisma.source.findMany({
      where: {
        ...(query.data.enabled !== undefined && { enabled: query.data.enabled }),
        ...(query.data.type && { type: query.data.type }),
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(sources);
  } catch (error) {
    console.error("Failed to fetch sources:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSourceSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse("Invalid request body", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const source = await prisma.source.create({
      data: {
        type: parsed.data.type,
        name: parsed.data.name,
        config: parsed.data.config as object,
        enabled: parsed.data.enabled,
      },
    });

    return successResponse({ id: source.id }, 201);
  } catch (error) {
    console.error("Failed to create source:", error);
    return serverErrorResponse();
  }
}
