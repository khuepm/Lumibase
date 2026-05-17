export interface CacheProvider {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: string, options?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
