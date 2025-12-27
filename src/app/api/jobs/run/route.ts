import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { RunJobSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = RunJobSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse("Invalid request body", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { dryRun, maxItems, fromHours, onlyPlatforms } = parsed.data;

    // Create job run record
    const jobRun = await prisma.jobRun.create({
      data: {
        jobType: "pipeline",
        status: "running",
        stats: {
          dryRun,
          maxItems,
          fromHours,
          onlyPlatforms: onlyPlatforms ?? ["x", "news", "youtube"],
        },
      },
    });

    // Initialize stats
    const stats = {
      ingested: 0,
      candidates: 0,
      analyzed: 0,
      outlined: 0,
      generated: 0,
      skipped: 0,
    };

    try {
      // Calculate time threshold
      const threshold = new Date();
      threshold.setHours(threshold.getHours() - fromHours);

      // Get enabled sources
      const sources = await prisma.source.findMany({
        where: {
          enabled: true,
          ...(onlyPlatforms && {
            type: {
              in: onlyPlatforms.map((p) => {
                switch (p) {
                  case "x":
                    return "X_SEARCH";
                  case "news":
                    return "RSS";
                  case "youtube":
                    return "YOUTUBE_SEARCH";
                  case "manual":
                    return "MANUAL";
                  default:
                    return "MANUAL";
                }
              }),
            },
          }),
        },
      });

      // If dry run, just return stats without processing
      if (dryRun) {
        await prisma.jobRun.update({
          where: { id: jobRun.id },
          data: {
            status: "success",
            stats: { ...stats, dryRun: true, sourcesFound: sources.length },
            finishedAt: new Date(),
          },
        });

        return successResponse({
          jobRunId: jobRun.id,
          stats: { ...stats, dryRun: true, sourcesFound: sources.length },
        });
      }

      // TODO: Implement actual pipeline stages
      // 1. Ingestion: Fetch from X/News/YouTube APIs
      // 2. Detect: Calculate buzz candidate scores
      // 3. Analyze: LLM analysis for viral patterns
      // 4. Outline: Generate outline using templates
      // 5. Generate: Create draft posts

      // For now, just mark as success with zero stats
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "success",
          stats,
          finishedAt: new Date(),
        },
      });

      return successResponse({
        jobRunId: jobRun.id,
        stats,
      });
    } catch (pipelineError) {
      // Update job as failed
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "failed",
          stats,
          error: {
            message:
              pipelineError instanceof Error
                ? pipelineError.message
                : "Unknown error",
          },
          finishedAt: new Date(),
        },
      });

      throw pipelineError;
    }
  } catch (error) {
    console.error("Failed to run job:", error);
    return serverErrorResponse();
  }
}
