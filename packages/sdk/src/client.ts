/**
 * LumiBase JS SDK — Phase 0 surface.
 *
 * The full type-safe `items('posts').readMany(...)` interface lands once the
 * typegen feature ships (see `docs/features/typegen.md`). For now we expose a
 * minimal fetcher that downstream apps (Studio, Next.js demo) can rely on.
 */
export interface LumiClientOptions {
  /** Base URL of the API, e.g. `http://127.0.0.1:8787` or `https://api.lumibase.dev`. */
  url: string;
  /** Bearer token (Logto access token, or `dev:<logtoId>` in dev mode). */
  token: string;
  /** Active tenant id. Sent as `X-Lumi-Site`. */
  siteId: string;
  /** Override fetch (Node/Workers polyfills). Defaults to `globalThis.fetch`. */
  fetcher?: typeof fetch;
}

export interface LumiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface LumiErrorBody {
  errors: Array<{ code: string; message: string; path?: string[]; trace?: unknown }>;
}

export class LumiError extends Error {
  constructor(public status: number, public body: LumiErrorBody) {
    super(body.errors[0]?.message ?? `LumiBase ${status}`);
    this.name = 'LumiError';
  }
}

export function createLumiClient(opts: LumiClientOptions) {
  const fetcher = opts.fetcher ?? fetch;
  const base = opts.url.replace(/\/$/, '');

  async function request<T>(path: string, init: RequestInit = {}): Promise<LumiResponse<T>> {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${opts.token}`);
    headers.set('x-lumi-site', opts.siteId);
    if (!headers.has('content-type') && init.body) {
      headers.set('content-type', 'application/json');
    }

    const res = await fetcher(`${base}${path}`, { ...init, headers });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;

    if (!res.ok) throw new LumiError(res.status, body as LumiErrorBody);
    return body as LumiResponse<T>;
  }

  return {
    request,
    auth: {
      me: () => request<{ logtoId: string; email?: string; roles: string[]; siteId: string }>(
        '/api/v1/auth/me',
      ),
    },
  };
}

export type LumiClient = ReturnType<typeof createLumiClient>;
