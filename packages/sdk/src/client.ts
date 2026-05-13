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

/**
 * Default schema shape when typegen has not yet been applied. Generated
 * types from `lumibase typegen` should narrow this to the actual collection map.
 */
export type DefaultSchema = Record<string, Record<string, unknown>>;

export interface CollectionResource {
  id: string;
  siteId: string;
  name: string;
  singleton: boolean;
  displayTemplate: string | null;
  sortField: string | null;
  archiveField: string | null;
  archiveValue: string | null;
  meta: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldResource {
  id: string;
  collectionId: string;
  name: string;
  type: string;
  interface: string;
  required: boolean;
  hidden: boolean;
  sortOrder: number;
  [key: string]: unknown;
}

export interface RelationResource {
  id: string;
  siteId: string;
  manyCollection: string;
  manyField: string;
  oneCollection: string;
  oneField: string | null;
  junctionCollection: string | null;
}

export function createLumiClient<TSchema extends DefaultSchema = DefaultSchema>(
  opts: LumiClientOptions,
) {
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

  const schema = {
    listCollections: () => request<CollectionResource[]>('/api/v1/collections'),
    getCollection: (name: string) => request<CollectionResource>(`/api/v1/collections/${name}`),
    createCollection: (input: Partial<CollectionResource> & { name: string }) =>
      request<CollectionResource>('/api/v1/collections', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    updateCollection: (name: string, patch: Partial<CollectionResource>) =>
      request<CollectionResource>(`/api/v1/collections/${name}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    deleteCollection: (name: string) =>
      request<null>(`/api/v1/collections/${name}`, { method: 'DELETE' }),
    listFields: (collectionName: string) =>
      request<FieldResource[]>(`/api/v1/collections/${collectionName}/fields`),
    upsertField: (
      collectionName: string,
      fieldName: string,
      input: Partial<FieldResource> & { type: string; interface: string },
    ) =>
      request<FieldResource>(`/api/v1/collections/${collectionName}/fields/${fieldName}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    deleteField: (collectionName: string, fieldName: string) =>
      request<null>(`/api/v1/collections/${collectionName}/fields/${fieldName}`, {
        method: 'DELETE',
      }),
    listRelations: () => request<RelationResource[]>('/api/v1/relations'),
    createRelation: (input: Omit<RelationResource, 'id' | 'siteId'>) =>
      request<RelationResource>('/api/v1/relations', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    deleteRelation: (id: string) =>
      request<null>(`/api/v1/relations/${id}`, { method: 'DELETE' }),
    diff: (name: string, proposed: Record<string, unknown>) =>
      request<unknown>('/api/v1/collections/diff', {
        method: 'POST',
        body: JSON.stringify({ name, ...proposed }),
      }),
    apply: (name: string, proposed: Record<string, unknown>) =>
      request<CollectionResource>(`/api/v1/collections/${name}/schema`, {
        method: 'PUT',
        body: JSON.stringify(proposed),
      }),
    typegen: (filters?: { include?: string[]; exclude?: string[] }) => {
      const params = new URLSearchParams();
      if (filters?.include?.length) params.set('include', filters.include.join(','));
      if (filters?.exclude?.length) params.set('exclude', filters.exclude.join(','));
      const qs = params.toString();
      return request<unknown>(`/api/v1/typegen/schema${qs ? `?${qs}` : ''}`);
    },
  };

  return {
    request,
    schema,
    auth: {
      me: () => request<{ logtoId: string; email?: string; roles: string[]; siteId: string }>(
        '/api/v1/auth/me',
      ),
    },
    /** Phantom type witness for downstream typed item modules (Phase B). */
    _schemaType: undefined as unknown as TSchema,
  };
}

export type LumiClient<TSchema extends DefaultSchema = DefaultSchema> = ReturnType<
  typeof createLumiClient<TSchema>
>;
