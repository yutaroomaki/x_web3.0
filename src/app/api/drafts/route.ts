import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, validationErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { DraftQuerySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = DraftQuerySchema.safeParse({
      status: searchParams.get("status"),
      minScore: searchParams.get("minScore"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    if (!query.success) {
      return validationErrorResponse("Invalid query parameters", {
        errors: query.error.flatten().fieldErrors,
      });
    }

    const drafts = await prisma.draftPost.findMany({
      where: {
        ...(query.data.status && { status: query.data.status }),
        ...(query.data.minScore !== undefined && {
          trendScore: { gte: query.data.minScore },
        }),
      },
      include: {
        template: {
          select: { code: true, name: true },
        },
        ingestItem: {
          select: { url: true, publishedAt: true },
        },
      },
      orderBy: [{ trendScore: "desc" }, { createdAt: "desc" }],
      take: query.data.limit,
      skip: query.data.offset,
    });

    const formattedDrafts = drafts.map((draft) => ({
      id: draft.id,
      status: draft.status,
      trendScore: draft.trendScore,
      templateType: draft.template.name,
      emotionTriggers: draft.emotionTriggers,
      riskFlags: draft.riskFlags,
      createdAt: draft.createdAt.toISOString(),
      sourceUrl: draft.ingestItem.url,
      publishedAt: draft.ingestItem.publishedAt.toISOString(),
    }));

    return successResponse(formattedDrafts);
  } catch (error) {
    console.error("Failed to fetch drafts:", error);
    return serverErrorResponse();
  }
}
