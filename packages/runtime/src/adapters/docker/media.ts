import crypto from 'node:crypto';
import type { MediaProcessor, TransformOptions } from '../../interfaces';

export class ImgproxyMediaProcessor implements MediaProcessor {
  constructor(
    private baseUrl: string,
    private key: string,
    private salt: string,
    private storageUrl: string,
  ) {}

  getUrl(key: string, options?: TransformOptions): string {
    const processing = this.buildProcessingString(options);
    const sourceUrl = `${this.storageUrl}/${key}`;
    const encoded = Buffer.from(sourceUrl).toString('base64url');
    const path = `/${processing}/${encoded}`;
    const signature = this.sign(path);
    return `${this.baseUrl}/${signature}${path}`;
  }

  async generateThumbnails(
    key: string,
    sizes: Array<{ width: number; height: number }>,
  ): Promise<string[]> {
    return sizes.map((size) =>
      this.getUrl(key, { ...size, format: 'webp', quality: 80 }),
    );
  }

  private buildProcessingString(options?: TransformOptions): string {
    if (!options) return 'preset:default';
    const parts: string[] = [];
    if (options.width || options.height) {
      parts.push(
        `rs:${options.fit ?? 'fill'}:${options.width ?? 0}:${options.height ?? 0}`,
      );
    }
    if (options.format) parts.push(`f:${options.format}`);
    if (options.quality) parts.push(`q:${options.quality}`);
    return parts.join('/') || 'preset:default';
  }

  private sign(path: string): string {
    const hmac = crypto.createHmac('sha256', Buffer.from(this.key, 'hex'));
    hmac.update(Buffer.from(this.salt, 'hex'));
    hmac.update(path);
    return hmac.digest('base64url').substring(0, 32);
  }
}
