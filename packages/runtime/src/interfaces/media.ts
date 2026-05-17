export interface TransformOptions {
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface MediaProcessor {
  getUrl(key: string, options?: TransformOptions): string;
  generateThumbnails(key: string, sizes: Array<{ width: number; height: number }>): Promise<string[]>;
}
