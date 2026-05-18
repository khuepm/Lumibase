import postgres from 'postgres';
import type { DatabaseProvider } from '../../interfaces';

/**
 * Minimal Hyperdrive interface matching Cloudflare Workers Hyperdrive binding.
 * Declared locally to avoid a hard dependency on @cloudflare/workers-types.
 */
export interface Hyperdrive {
  connectionString: string;
}

/**
 * Cloudflare Hyperdrive-backed DatabaseProvider.
 *
 * Uses the Hyperdrive binding's connection string to create a postgres-js
 * SQL client. On Cloudflare Workers, Hyperdrive handles connection pooling
 * at the edge, so the client is created per-request with minimal pool settings.
 *
 * The `close()` method is a no-op because Cloudflare Workers connections are
 * scoped to the request isolate lifetime and cleaned up automatically.
 */
export class CloudflareDatabaseProvider implements DatabaseProvider {
  private sql: postgres.Sql;

  constructor(hyperdrive: Hyperdrive) {
    this.sql = postgres(hyperdrive.connectionString, {
      // Hyperdrive handles pooling; keep the per-isolate client minimal.
      max: 5,
      prepare: false,
    });
  }

  getConnection(): postgres.Sql {
    return this.sql;
  }

  async close(): Promise<void> {
    // No-op for Cloudflare — connections are per-request and scoped
    // to the Worker isolate lifetime. Hyperdrive manages the pool.
  }
}
