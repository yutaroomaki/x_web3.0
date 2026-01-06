/**
 * GXVIS Prisma Monitoring Extension
 * Automatically tracks all database operations
 */

import { Prisma } from '@prisma/client';
import { trackDbQuery } from './metrics';

/**
 * Prisma middleware to track database query metrics
 */
export const prismaMetricsExtension = Prisma.defineExtension({
  name: 'metrics',
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = Date.now();

      try {
        const result = await query(args);
        const duration = Date.now() - start;

        trackDbQuery(operation, model || 'unknown', 'success', duration);

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        trackDbQuery(operation, model || 'unknown', 'error', duration);

        throw error;
      }
    },
  },
});
