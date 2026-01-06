import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, validationErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { DraftQuerySchema } from "@/lib/schemas";

// Length category helper
function getLengthCategory(text: string): "short" | "medium" | "long" {
  const len = text.length;
  if (len < 500) return "short";
  if (len < 1000) return "medium";
  return "long";
}

function getLengthLabel(category: "short" | "medium" | "long"): string {
  switch (category) {
    case "short": return "200-400字";
    case "medium": return "500-1000字";
    case "long": return "1000字以上";
  }
}

// Extract base title without length suffix
function getBaseTitle(title: string): string {
  return title.replace(/【(200-400字|500-1000字|1000字以上|short|medium|long)】$/, "").trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const minScoreParam = searchParams.get("minScore");
    const lengthCategoryParam = searchParams.get("lengthCategory");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const query = DraftQuerySchema.safeParse({
      ...(statusParam !== null && { status: statusParam }),
      ...(minScoreParam !== null && { minScore: minScoreParam }),
      ...(lengthCategoryParam !== null && { lengthCategory: lengthCategoryParam }),
      ...(limitParam !== null && { limit: limitParam }),
      ...(offsetParam !== null && { offset: offsetParam }),
    });

    if (!query.success) {
      return validationErrorResponse("Invalid query parameters", {
        errors: query.error.flatten().fieldErrors,
      });
    }

    // Get total count first
    const totalCount = await prisma.draftPost.count({
      where: {
        ...(query.data.status && { status: query.data.status }),
        ...(query.data.minScore !== undefined && {
          trendScore: { gte: query.data.minScore },
        }),
      },
    });

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
          select: { url: true, publishedAt: true, text: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: query.data.limit * 3, // Fetch more for filtering
      skip: query.data.offset,
    });

    // Filter by length category if specified
    let filteredDrafts = drafts;
    if (query.data.lengthCategory) {
      filteredDrafts = drafts.filter(
        (d) => getLengthCategory(d.postText) === query.data.lengthCategory
      );
    }

    // Group drafts by source URL
    const groupedMap = new Map<string, typeof drafts>();
    for (const draft of filteredDrafts) {
      const key = draft.ingestItem.url;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key)!.push(draft);
    }

    // Format grouped drafts
    const groupedDrafts = Array.from(groupedMap.values()).map((group) => {
      // Sort by length: short, medium, long
      const sorted = group.sort((a, b) => {
        const order = { short: 0, medium: 1, long: 2 };
        return order[getLengthCategory(a.postText)] - order[getLengthCategory(b.postText)];
      });

      const primary = sorted[0];
      const baseTitle = getBaseTitle(primary.title || primary.ingestItem.text?.slice(0, 50) || "No title");

      const versions = sorted.map((draft) => {
        const lengthCat = getLengthCategory(draft.postText);
        return {
          id: draft.id,
          lengthCategory: lengthCat,
          lengthLabel: getLengthLabel(lengthCat),
          charCount: draft.postText.length,
          trendScore: draft.trendScore,
          status: draft.status,
        };
      });

      // Use the highest trend score for the group
      const maxScore = Math.max(...sorted.map((d) => d.trendScore));

      return {
        id: primary.id, // Primary ID for linking
        groupId: primary.ingestItem.url, // Group identifier
        title: baseTitle,
        status: primary.status,
        trendScore: maxScore,
        templateType: primary.template.name,
        emotionTriggers: primary.emotionTriggers,
        riskFlags: primary.riskFlags,
        versions,
        createdAt: primary.createdAt.toISOString(),
        sourceUrl: primary.ingestItem.url,
        publishedAt: primary.ingestItem.publishedAt.toISOString(),
      };
    });

    // Limit grouped results
    const limitedGrouped = groupedDrafts.slice(0, query.data.limit);

    return successResponse(limitedGrouped, { total: groupedMap.size, totalDrafts: totalCount });
  } catch (error) {
    console.error("Failed to fetch drafts:", error);
    return serverErrorResponse();
  }
}
