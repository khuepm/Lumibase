import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export { schema };

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Create a Drizzle client backed by postgres-js.
 *
 * In Cloudflare Workers, pass the Hyperdrive connection string
 * (`env.HYPERDRIVE.connectionString`) so connections are pooled at the edge.
 */
export function createDb(connectionString: string): Database {
  const client = postgres(connectionString, {
    // Hyperdrive handles pooling; keep the per-isolate client minimal.
    max: 5,
    prepare: false,
  });
  return drizzle(client, { schema });
}
