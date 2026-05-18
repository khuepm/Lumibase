export interface SearchResult<T = Record<string, unknown>> {
  hits: T[];
  totalHits: number;
  processingTimeMs: number;
}

export interface SearchOptions {
  filter?: string;
  sort?: string[];
  limit?: number;
  offset?: number;
  attributesToRetrieve?: string[];
}

export interface SearchProvider {
  index(collection: string, documents: Record<string, unknown>[]): Promise<void>;
  search<T = Record<string, unknown>>(collection: string, query: string, options?: SearchOptions): Promise<SearchResult<T>>;
  delete(collection: string, documentIds: string[]): Promise<void>;
  getIndex(collection: string): Promise<{ numberOfDocuments: number }>;
}
