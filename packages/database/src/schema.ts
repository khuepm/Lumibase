/**
 * Drizzle schema entry. The actual tables are split by domain under
 * ./schema/ to keep each module under the ~300 LOC threshold. Drizzle Kit
 * still reads this single file via `drizzle.config.ts`.
 */
export * from './schema/index';
export { scopeSite } from './scope';
