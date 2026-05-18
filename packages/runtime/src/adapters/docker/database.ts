import postgres from 'postgres';
import type { DatabaseProvider } from '../../interfaces';

/**
 * Docker/Node.js DatabaseProvider backed by postgres-js.
 *
 * The `postgres` library provides built-in connection pooling, so no
 * separate pool manager (e.g. pgBouncer) is needed for typical workloads.
 * The sql instance returned by `getConnection()` can be passed directly
 * to Drizzle ORM via `drizzle(sql, { schema })`.
 */
export class PostgresDatabaseProvider implements DatabaseProvider {
  private sql: postgres.Sql;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }

  getConnection(): postgres.Sql {
    return this.sql;
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}
