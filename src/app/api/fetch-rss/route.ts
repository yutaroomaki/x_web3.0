import { fetchRSSFeeds } from "@/lib/rss-fetcher";
import { generateDraftsFromRSS } from "@/lib/draft-generator";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function POST() {
  try {
    console.log("🔄 Fetching RSS feeds...");
    const results = await fetchRSSFeeds();

    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum, r) => sum + r.new, 0);
    const errors = results.flatMap((r) => r.errors);

    console.log(`✅ Fetched ${totalFetched} items, ${totalNew} new`);

    // Auto-generate drafts from new items
    let generateResult = null;
    if (totalNew > 0) {
      console.log("🔄 Generating drafts from new items...");
      generateResult = await generateDraftsFromRSS(Math.min(totalNew, 30));
      console.log(`✅ Generated ${generateResult.generated} drafts`);
    }

    return successResponse({
      results,
      summary: {
        totalFetched,
        totalNew,
        errorCount: errors.length,
      },
      draftsGenerated: generateResult,
    });
  } catch (error) {
    console.error("Failed to fetch RSS:", error);
    return serverErrorResponse();
  }
}

export async function GET() {
  // GET method for easy testing
  return POST();
}
