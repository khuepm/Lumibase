export interface StorageObject {
  key: string;
  body: ReadableStream | Buffer;
  contentType?: string;
  size?: number;
  metadata?: Record<string, string>;
}

export interface StorageProvider {
  put(key: string, data: ReadableStream | Buffer, metadata?: Record<string, string>): Promise<void>;
  get(key: string): Promise<StorageObject | null>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<{ keys: string[] }>;
}
