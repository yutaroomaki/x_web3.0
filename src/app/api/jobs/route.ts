import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, validationErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { JobQuerySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = JobQuerySchema.safeParse({
      status: searchParams.get("status"),
      limit: searchParams.get("limit"),
    });

    if (!query.success) {
      return validationErrorResponse("Invalid query parameters", {
        errors: query.error.flatten().fieldErrors,
      });
    }

    const jobs = await prisma.jobRun.findMany({
      where: {
        ...(query.data.status && { status: query.data.status }),
      },
      orderBy: { startedAt: "desc" },
      take: query.data.limit,
    });

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      stats: job.stats,
      error: job.error,
      startedAt: job.startedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
    }));

    return successResponse(formattedJobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return serverErrorResponse();
  }
}
