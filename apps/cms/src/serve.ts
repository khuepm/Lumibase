import { serve } from '@hono/node-server';
import { createRuntime } from '@lumibase/runtime';
import app from './index';

const port = parseInt(process.env.PORT || '3000', 10);
const runtime = createRuntime(process.env as unknown as Record<string, unknown>);

// Inject runtime into Hono context for all requests.
app.use('*', async (c, next) => {
  c.set('runtime', runtime);
  await next();
});

const server = serve({ fetch: app.fetch, port });
console.log(`[lumibase-cms] Started in ${runtime.runtime} mode on port ${port}`);

// Graceful shutdown with 10s timeout
process.on('SIGTERM', () => {
  console.log('[lumibase-cms] SIGTERM received, shutting down...');

  // Force exit after 10 seconds if graceful shutdown stalls
  const forceTimeout = setTimeout(() => {
    console.error('[lumibase-cms] Graceful shutdown timed out after 10s, forcing exit.');
    process.exit(1);
  }, 10_000);
  forceTimeout.unref();

  server.close(async () => {
    try {
      await runtime.database.close();
    } catch (err) {
      console.error('[lumibase-cms] Error closing database connection:', err);
    }
    clearTimeout(forceTimeout);
    process.exit(0);
  });
});
