import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { CreateDecisionSchema } from "@/lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = CreateDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse("Invalid request body", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const draft = await prisma.draftPost.findUnique({ where: { id } });
    if (!draft) {
      return notFoundResponse("Draft not found");
    }

    // Map action to status
    const statusMap = {
      approve: "approved",
      reject: "rejected",
      posted: "posted",
    } as const;

    await prisma.$transaction([
      // Create the decision record
      prisma.reviewDecision.create({
        data: {
          draftPostId: id,
          action: parsed.data.action,
          editedText: parsed.data.editedText,
          note: parsed.data.note,
        },
      }),
      // Update the draft status
      prisma.draftPost.update({
        where: { id },
        data: {
          status: statusMap[parsed.data.action],
          ...(parsed.data.editedText && { postText: parsed.data.editedText }),
        },
      }),
    ]);

    return successResponse({ ok: true });
  } catch (error) {
    console.error("Failed to create decision:", error);
    return serverErrorResponse();
  }
}
