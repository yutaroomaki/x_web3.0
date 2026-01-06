/**
 * GXVIS Health Check Endpoint
 * Used by Prometheus blackbox exporter and Cloud Run health checks
 * Endpoint: GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/health
 * Returns health status of the application and dependencies
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, { status: string; latencyMs?: number; error?: string }>,
  };

  // 1. Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'healthy',
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // 2. Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  health.checks.memory = {
    status: heapUsedPercent < 90 ? 'healthy' : 'degraded',
    latencyMs: Math.round(heapUsedPercent),
  };

  if (heapUsedPercent >= 95) {
    health.status = 'unhealthy';
  }

  // 3. Overall latency
  const totalLatency = Date.now() - startTime;
  health.checks.overall = {
    status: totalLatency < 1000 ? 'healthy' : 'degraded',
    latencyMs: totalLatency,
  };

  // Determine HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
