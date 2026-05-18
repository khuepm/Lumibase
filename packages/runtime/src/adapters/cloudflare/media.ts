import type { MediaProcessor, TransformOptions } from '../../interfaces';

/**
 * Cloudflare Image Resizing-backed MediaProcessor.
 *
 * Generates URLs using the `/cdn-cgi/image/` path format to leverage
 * Cloudflare's edge-based image transformation service.
 *
 * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */
export class CloudflareMediaProcessor implements MediaProcessor {
  constructor(private baseUrl: string) {}

  getUrl(key: string, options?: TransformOptions): string {
    const params = this.buildParams(options);
    const origin = `${this.baseUrl}/${key}`;

    if (!params) {
      return origin;
    }

    return `${this.baseUrl}/cdn-cgi/image/${params}/${key}`;
  }

  async generateThumbnails(
    key: string,
    sizes: Array<{ width: number; height: number }>,
  ): Promise<string[]> {
    return sizes.map((size) =>
      this.getUrl(key, { ...size, format: 'webp', quality: 80, fit: 'cover' }),
    );
  }

  /**
   * Builds the comma-separated parameter string for CF Image Resizing.
   * Format: `width=300,height=200,format=webp,quality=80,fit=cover`
   */
  private buildParams(options?: TransformOptions): string {
    if (!options) return '';

    const parts: string[] = [];

    if (options.width != null) parts.push(`width=${options.width}`);
    if (options.height != null) parts.push(`height=${options.height}`);
    if (options.format) parts.push(`format=${options.format}`);
    if (options.quality != null) parts.push(`quality=${options.quality}`);
    if (options.fit) parts.push(`fit=${options.fit}`);

    return parts.join(',');
  }
}
