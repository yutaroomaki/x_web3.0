/**
 * GXVIS Monitoring Middleware
 * Implements automatic instrumentation for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
  trackHttpRequest,
} from './metrics';

/**
 * Middleware to track HTTP metrics for API routes
 */
export function withMetrics<T>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const start = Date.now();
    activeConnections.inc();

    // Extract route from URL (remove query params)
    const url = new URL(request.url);
    const route = url.pathname;
    const method = request.method;

    let response: NextResponse<T>;
    let statusCode = 200;

    try {
      response = await handler(request, context);
      statusCode = response.status;
      return response;
    } catch (error) {
      statusCode = 500;
      throw error;
    } finally {
      const duration = Date.now() - start;
      trackHttpRequest(method, route, statusCode, duration);
      activeConnections.dec();
    }
  };
}

/**
 * Track operation timing with automatic error handling
 */
export async function trackOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  onSuccess?: (result: T, durationMs: number) => void,
  onError?: (error: Error, durationMs: number) => void
): Promise<T> {
  const start = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - start;

    if (onSuccess) {
      onSuccess(result, duration);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    if (onError) {
      onError(error as Error, duration);
    }

    throw error;
  }
}
