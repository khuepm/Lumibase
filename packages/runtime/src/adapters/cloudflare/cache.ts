import type { CacheProvider } from '../../interfaces';

/**
 * Minimal KVNamespace interface matching Cloudflare Workers KV API.
 * Declared locally to avoid a hard dependency on @cloudflare/workers-types.
 */
export interface KVNamespace {
  get(key: string, type: 'json'): Promise<unknown>;
  get(key: string, type?: 'text'): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Cloudflare KV-backed CacheProvider.
 *
 * Wraps a Cloudflare Workers KVNamespace binding to implement the
 * CacheProvider interface for edge deployments.
 */
export class CloudflareCacheProvider implements CacheProvider {
  constructor(private kv: KVNamespace) {}

  async get<T = string>(key: string): Promise<T | null> {
    return this.kv.get(key, 'json') as Promise<T | null>;
  }

  async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
    await this.kv.put(
      key,
      value,
      options?.ttl ? { expirationTtl: options.ttl } : undefined,
    );
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
