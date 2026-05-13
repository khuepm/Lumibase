import {
  collections,
  fields,
  relations,
  scopeSite,
  schema,
  type Database,
} from '@lumibase/database';
import { and, asc, eq } from 'drizzle-orm';
import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * SchemaService — owns the no-code collection/field/relation lifecycle.
 *
 * Reads go through a KV "compiled schema" cache (`schema:<siteId>:<name>`)
 * so per-request item endpoints don't pay the JOIN cost. Writes invalidate
 * the cache by key. Permission checks live one layer above
 * (PermissionService, Phase C) — this class only enforces tenancy via
 * `scopeSite()` and machine-name validity.
 */

const NAME_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;

export interface CompiledCollection {
  id: string;
  name: string;
  singleton: boolean;
  displayTemplate: string | null;
  sortField: string | null;
  archiveField: string | null;
  archiveValue: string | null;
  meta: Record<string, unknown>;
  fields: CompiledField[];
}

export interface CompiledField {
  id: string;
  name: string;
  type: string;
  interface: string;
  display: string | null;
  options: Record<string, unknown>;
  displayOptions: Record<string, unknown>;
  validation: Record<string, unknown>;
  conditions: unknown[];
  required: boolean;
  readonly: boolean;
  hidden: boolean;
  encrypted: boolean;
  versioned: boolean;
  rawEnabled: boolean;
  width: 'half' | 'full' | 'fill';
  group: string | null;
  sortOrder: number;
}

export interface CollectionInput {
  name: string;
  singleton?: boolean;
  icon?: string | null;
  color?: string | null;
  note?: string | null;
  displayTemplate?: string | null;
  sortField?: string | null;
  archiveField?: string | null;
  archiveValue?: string | null;
  accountability?: 'all' | 'activity' | 'none';
  versioning?: boolean;
  meta?: Record<string, unknown>;
}

export interface FieldInput {
  name: string;
  type: string;
  interface: string;
  display?: string | null;
  options?: Record<string, unknown>;
  displayOptions?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  conditions?: unknown[];
  required?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  encrypted?: boolean;
  versioned?: boolean;
  rawEnabled?: boolean;
  width?: 'half' | 'full' | 'fill';
  group?: string | null;
  sortOrder?: number;
}

export interface RelationInput {
  manyCollection: string;
  manyField: string;
  oneCollection: string;
  oneField?: string | null;
  junctionCollection?: string | null;
  sortField?: string | null;
  onDelete?: 'restrict' | 'cascade' | 'set null' | 'no action';
  meta?: Record<string, unknown>;
}

export class SchemaServiceError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
    this.name = 'SchemaServiceError';
  }
}

const ensureName = (name: string, kind: 'collection' | 'field') => {
  if (!NAME_PATTERN.test(name)) {
    throw new SchemaServiceError(
      'INVALID_NAME',
      `${kind} name must match ${NAME_PATTERN}; received "${name}".`,
    );
  }
};

const cacheKey = (siteId: string, name: string) => `schema:${siteId}:${name}`;

export interface SchemaServiceDeps {
  db: Database;
  siteId: string;
  cache?: KVNamespace;
}

export class SchemaService {
  constructor(private readonly deps: SchemaServiceDeps) {}

  // ---------- Collections ----------

  async listCollections() {
    const { db, siteId } = this.deps;
    return db
      .select()
      .from(collections)
      .where(scopeSite(collections.siteId, siteId))
      .orderBy(asc(collections.name));
  }

  async getCollection(name: string) {
    const { db, siteId } = this.deps;
    const [row] = await db
      .select()
      .from(collections)
      .where(and(scopeSite(collections.siteId, siteId), eq(collections.name, name)))
      .limit(1);
    return row ?? null;
  }

  async createCollection(input: CollectionInput) {
    ensureName(input.name, 'collection');
    const existing = await this.getCollection(input.name);
    if (existing) {
      throw new SchemaServiceError(
        'COLLECTION_EXISTS',
        `Collection "${input.name}" already exists.`,
        409,
      );
    }
    const [row] = await this.deps.db
      .insert(collections)
      .values({ ...input, siteId: this.deps.siteId })
      .returning();
    await this.invalidate(input.name);
    return row;
  }

  async updateCollection(name: string, patch: Partial<CollectionInput>) {
    const current = await this.getCollection(name);
    if (!current) {
      throw new SchemaServiceError('NOT_FOUND', `Collection "${name}" not found.`, 404);
    }
    const [row] = await this.deps.db
      .update(collections)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(collections.id, current.id))
      .returning();
    await this.invalidate(name);
    return row;
  }

  async deleteCollection(name: string) {
    const current = await this.getCollection(name);
    if (!current) {
      throw new SchemaServiceError('NOT_FOUND', `Collection "${name}" not found.`, 404);
    }
    // Block deletion when relations still reference this collection.
    const referencing = await this.deps.db
      .select()
      .from(relations)
      .where(
        and(
          scopeSite(relations.siteId, this.deps.siteId),
          eq(relations.oneCollection, name),
        ),
      )
      .limit(1);
    if (referencing.length > 0) {
      throw new SchemaServiceError(
        'COLLECTION_IN_USE',
        `Collection "${name}" is referenced by relations; remove them first.`,
        409,
      );
    }
    await this.deps.db.delete(collections).where(eq(collections.id, current.id));
    await this.invalidate(name);
    return { ok: true } as const;
  }

  // ---------- Fields ----------

  async listFields(collectionName: string) {
    const collection = await this.getCollection(collectionName);
    if (!collection) {
      throw new SchemaServiceError('NOT_FOUND', `Collection "${collectionName}" not found.`, 404);
    }
    return this.deps.db
      .select()
      .from(fields)
      .where(eq(fields.collectionId, collection.id))
      .orderBy(asc(fields.sortOrder), asc(fields.name));
  }

  async upsertField(collectionName: string, input: FieldInput) {
    ensureName(input.name, 'field');
    const collection = await this.getCollection(collectionName);
    if (!collection) {
      throw new SchemaServiceError('NOT_FOUND', `Collection "${collectionName}" not found.`, 404);
    }
    const [existing] = await this.deps.db
      .select()
      .from(fields)
      .where(and(eq(fields.collectionId, collection.id), eq(fields.name, input.name)))
      .limit(1);

    if (existing) {
      const [row] = await this.deps.db
        .update(fields)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(fields.id, existing.id))
        .returning();
      await this.invalidate(collection.name);
      return row;
    }

    const [row] = await this.deps.db
      .insert(fields)
      .values({ ...input, collectionId: collection.id, siteId: this.deps.siteId })
      .returning();
    await this.invalidate(collection.name);
    return row;
  }

  async deleteField(collectionName: string, fieldName: string) {
    const collection = await this.getCollection(collectionName);
    if (!collection) {
      throw new SchemaServiceError('NOT_FOUND', `Collection "${collectionName}" not found.`, 404);
    }
    const result = await this.deps.db
      .delete(fields)
      .where(and(eq(fields.collectionId, collection.id), eq(fields.name, fieldName)))
      .returning({ id: fields.id });
    if (result.length === 0) {
      throw new SchemaServiceError('NOT_FOUND', `Field "${fieldName}" not found.`, 404);
    }
    await this.invalidate(collection.name);
    return { ok: true } as const;
  }

  // ---------- Relations ----------

  async listRelations() {
    const { db, siteId } = this.deps;
    return db
      .select()
      .from(relations)
      .where(scopeSite(relations.siteId, siteId))
      .orderBy(asc(relations.manyCollection), asc(relations.manyField));
  }

  async createRelation(input: RelationInput) {
    const { db, siteId } = this.deps;
    const [row] = await db
      .insert(relations)
      .values({ ...input, siteId })
      .returning();
    // Invalidate both sides of the relation.
    await this.invalidate(input.manyCollection);
    if (input.oneCollection) await this.invalidate(input.oneCollection);
    if (input.junctionCollection) await this.invalidate(input.junctionCollection);
    return row;
  }

  async deleteRelation(id: string) {
    const { db, siteId } = this.deps;
    const [existing] = await db
      .select()
      .from(relations)
      .where(and(scopeSite(relations.siteId, siteId), eq(relations.id, id)))
      .limit(1);
    if (!existing) {
      throw new SchemaServiceError('NOT_FOUND', `Relation "${id}" not found.`, 404);
    }
    await db.delete(relations).where(eq(relations.id, id));
    await this.invalidate(existing.manyCollection);
    if (existing.oneCollection) await this.invalidate(existing.oneCollection);
    if (existing.junctionCollection) await this.invalidate(existing.junctionCollection);
    return { ok: true } as const;
  }

  // ---------- Cache ----------

  /** Build the compiled schema for a collection (used by ItemService). */
  async compile(collectionName: string): Promise<CompiledCollection | null> {
    const collection = await this.getCollection(collectionName);
    if (!collection) return null;
    const fieldRows = await this.listFields(collectionName);
    const compiled: CompiledCollection = {
      id: collection.id,
      name: collection.name,
      singleton: collection.singleton,
      displayTemplate: collection.displayTemplate,
      sortField: collection.sortField,
      archiveField: collection.archiveField,
      archiveValue: collection.archiveValue,
      meta: (collection.meta as Record<string, unknown>) ?? {},
      fields: fieldRows.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        interface: f.interface,
        display: f.display,
        options: (f.options as Record<string, unknown>) ?? {},
        displayOptions: (f.displayOptions as Record<string, unknown>) ?? {},
        validation: (f.validation as Record<string, unknown>) ?? { rules: [] },
        conditions: (f.conditions as unknown[]) ?? [],
        required: f.required,
        readonly: f.readonly,
        hidden: f.hidden,
        encrypted: f.encrypted,
        versioned: f.versioned,
        rawEnabled: f.rawEnabled,
        width: f.width as 'half' | 'full' | 'fill',
        group: f.group,
        sortOrder: f.sortOrder,
      })),
    };
    if (this.deps.cache) {
      await this.deps.cache.put(cacheKey(this.deps.siteId, collectionName), JSON.stringify(compiled), {
        expirationTtl: 300,
      });
    }
    return compiled;
  }

  /** SWR-style cache read; falls back to live DB compile on miss. */
  async getCompiled(collectionName: string): Promise<CompiledCollection | null> {
    if (this.deps.cache) {
      const cached = await this.deps.cache.get(cacheKey(this.deps.siteId, collectionName));
      if (cached) return JSON.parse(cached) as CompiledCollection;
    }
    return this.compile(collectionName);
  }

  async invalidate(collectionName: string) {
    if (this.deps.cache) {
      await this.deps.cache.delete(cacheKey(this.deps.siteId, collectionName));
    }
  }

  // Re-export bare schema so callers can build custom queries when needed.
  static readonly schema = schema;
}
