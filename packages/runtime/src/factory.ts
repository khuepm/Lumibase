import type { RuntimeContext } from './interfaces';
import { createCloudflareRuntime } from './adapters/cloudflare';
import { createDockerRuntime } from './adapters/docker';

/**
 * Creates a RuntimeContext based on the `LUMIBASE_RUNTIME` environment variable.
 *
 * - `'cloudflare'` → Cloudflare Workers adapter (KV, R2, Hyperdrive)
 * - `'docker'` (default) → Docker/Node.js adapter (Redis, MinIO, PostgreSQL)
 *
 * @param env - Environment variables (process.env or Worker env bindings)
 * @returns Fully configured RuntimeContext for the target platform
 */
export function createRuntime(env: Record<string, unknown>): RuntimeContext {
  const mode = (env.LUMIBASE_RUNTIME as string) || 'docker';

  if (mode === 'cloudflare') {
    return createCloudflareRuntime(env);
  }
  return createDockerRuntime(env);
}
