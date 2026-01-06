import { NextRequest } from "next/server";
import { generateDraftsFromRSS } from "@/lib/draft-generator";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

async function generateDrafts(limit: number = 20) {
  console.log(`🔄 Generating drafts from RSS (limit: ${limit})...`);
  const result = await generateDraftsFromRSS(limit);
  console.log(`✅ Generated ${result.generated} drafts`);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 20;
    const result = await generateDrafts(limit);
    return successResponse(result);
  } catch (error) {
    console.error("Failed to generate drafts:", error);
    return serverErrorResponse();
  }
}

export async function GET() {
  // GET method for easy testing - generate 10 drafts
  try {
    const result = await generateDrafts(10);
    return successResponse(result);
  } catch (error) {
    console.error("Failed to generate drafts:", error);
    return serverErrorResponse();
  }
}
