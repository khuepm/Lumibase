export interface DatabaseProvider {
  getConnection(): unknown; // Drizzle instance
  close(): Promise<void>;
}
