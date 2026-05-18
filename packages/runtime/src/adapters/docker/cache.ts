import Redis from 'ioredis';
import type { CacheProvider } from '../../interfaces';

export class RedisCacheProvider implements CacheProvider {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl);
  }

  async get<T = string>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }

  async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
    if (options?.ttl) {
      await this.client.setex(key, options.ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
