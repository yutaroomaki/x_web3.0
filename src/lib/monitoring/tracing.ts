/**
 * GXVIS Distributed Tracing Configuration
 * OpenTelemetry setup for Cloud Run environment
 *
 * Note: Tracing is disabled by default and can be enabled when needed
 * Set ENABLE_TRACING=true to enable distributed tracing
 */

// Tracing SDK instance (null when disabled)
let tracingInitialized = false;

/**
 * Initialize OpenTelemetry tracing
 * Should be called once at application startup
 *
 * Tracing requires OpenTelemetry dependencies and a collector endpoint
 * See monitoring/README.md for full setup instructions
 */
export function initializeTracing(serviceName: string = 'gxvis') {
  if (tracingInitialized) {
    console.warn('Tracing already initialized');
    return null;
  }

  // Only enable in production or when explicitly configured
  const enableTracing = process.env.ENABLE_TRACING === 'true';

  if (!enableTracing) {
    console.log('Tracing disabled (set ENABLE_TRACING=true to enable)');
    return null;
  }

  // Dynamic import to avoid loading heavy dependencies when disabled
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

    const jaegerEndpoint =
      process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces';

    const sdk = new NodeSDK({
      serviceName,
      traceExporter: new JaegerExporter({ endpoint: jaegerEndpoint }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    tracingInitialized = true;
    console.log(`OpenTelemetry tracing initialized (endpoint: ${jaegerEndpoint})`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown();
        console.log('Tracing terminated gracefully');
      } catch (error) {
        console.error('Error terminating tracing:', error);
      }
    });

    return sdk;
  } catch (error) {
    console.warn('Failed to initialize tracing:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Check if tracing is initialized
 */
export function isTracingInitialized(): boolean {
  return tracingInitialized;
}

/**
 * Shutdown tracing (for testing or manual cleanup)
 * Note: For full shutdown, the application should exit
 */
export async function shutdownTracing(): Promise<void> {
  if (tracingInitialized) {
    tracingInitialized = false;
    console.log('Tracing marked as shut down');
  }
}
