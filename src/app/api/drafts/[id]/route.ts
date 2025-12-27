import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { UpdateDraftSchema } from "@/lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const draft = await prisma.draftPost.findUnique({
      where: { id },
      include: {
        template: true,
        ingestItem: {
          include: {
            source: { select: { type: true, name: true } },
            viralAnalysis: true,
            outline: true,
          },
        },
        reviewDecisions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!draft) {
      return notFoundResponse("Draft not found");
    }

    const response = {
      draft: {
        id: draft.id,
        postText: draft.postText,
        status: draft.status,
        trendScore: draft.trendScore,
        templateType: draft.template.name,
        emotionTriggers: draft.emotionTriggers,
        riskFlags: draft.riskFlags,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
      ingestItem: {
        url: draft.ingestItem.url,
        publishedAt: draft.ingestItem.publishedAt.toISOString(),
        platform: draft.ingestItem.source.type,
        language: draft.ingestItem.language,
        text: draft.ingestItem.text,
      },
      analysis: draft.ingestItem.viralAnalysis
        ? {
            hookType: draft.ingestItem.viralAnalysis.hookType,
            ctaType: draft.ingestItem.viralAnalysis.ctaType,
            emotionProfile: draft.ingestItem.viralAnalysis.emotionProfile,
            templateGuess: draft.ingestItem.viralAnalysis.templateGuess,
            summary: draft.ingestItem.viralAnalysis.summary,
            risks: draft.ingestItem.viralAnalysis.risks,
          }
        : null,
      outline: draft.ingestItem.outline
        ? {
            templateType: draft.ingestItem.outline.templateType,
            hookDraft: draft.ingestItem.outline.hookDraft,
            keyPoints: draft.ingestItem.outline.keyPoints,
            ctaDraft: draft.ingestItem.outline.ctaDraft,
            emotionPlan: draft.ingestItem.outline.emotionPlan,
          }
        : null,
      recentDecisions: draft.reviewDecisions,
    };

    return successResponse(response);
  } catch (error) {
    console.error("Failed to fetch draft:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateDraftSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse("Invalid request body", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const draft = await prisma.draftPost.findUnique({ where: { id } });
    if (!draft) {
      return notFoundResponse("Draft not found");
    }

    await prisma.draftPost.update({
      where: { id },
      data: { postText: parsed.data.postText },
    });

    return successResponse({ ok: true });
  } catch (error) {
    console.error("Failed to update draft:", error);
    return serverErrorResponse();
  }
}
