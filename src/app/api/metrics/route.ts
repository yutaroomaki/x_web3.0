/**
 * GXVIS Metrics Endpoint
 * Exposes Prometheus metrics for scraping
 * Endpoint: GET /api/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { register, updateBusinessMetrics } from '@/lib/monitoring/metrics';
import prisma from '@/lib/prisma';

/**
 * GET /api/metrics
 * Returns Prometheus metrics in text format
 */
export async function GET(request: NextRequest) {
  try {
    // Update business metrics before exposing
    await updateBusinessMetrics(prisma);

    // Get metrics in Prometheus text format
    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate metrics:', error);

    return new NextResponse('Failed to generate metrics', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
