import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { sites, users } from './core';

/**
 * Schema engine: collections (no-code definitions), fields (per-field
 * config), relations (m2o/o2m/m2m/m2a). Item storage is generic JSONB
 * (`items`) — LumiBase does not run DDL at runtime in MVP.
 */

const id = () => text('id').$defaultFn(() => nanoid()).primaryKey();
const createdAt = () => timestamp('created_at').defaultNow().notNull();
const updatedAt = () => timestamp('updated_at').defaultNow().notNull();

/** Page-builder pages (kept from initial scaffold; consumed by /deliver). */
export const pages = pgTable(
  'pages',
  {
    id: id(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    /** Sections + CVA mappings consumed by the 1-roundtrip Delivery API. */
    layoutConfig: jsonb('layout_config').default({}).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    siteSlugUnique: uniqueIndex('pages_site_slug_unique').on(t.siteId, t.slug),
  }),
);

export const collections = pgTable(
  'collections',
  {
    id: id(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    /** Machine name; unique per site. */
    name: text('name').notNull(),
    singleton: boolean('singleton').default(false).notNull(),
    icon: text('icon'),
    color: text('color'),
    note: text('note'),
    /** Default mustache display template, e.g. `{{title}} — {{status}}`. */
    displayTemplate: text('display_template'),
    sortField: text('sort_field'),
    archiveField: text('archive_field'),
    archiveValue: text('archive_value'),
    /** `all` | `activity` | `none` — controls revision/activity granularity. */
    accountability: text('accountability').default('all').notNull(),
    versioning: boolean('versioning').default(false).notNull(),
    /** UI hints (group order, presentation defaults). */
    meta: jsonb('meta').default({}).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    siteNameUnique: uniqueIndex('collections_site_name_unique').on(t.siteId, t.name),
  }),
);

export const fields = pgTable(
  'fields',
  {
    id: id(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Storage type — see docs/features/field-types-and-config.md. */
    type: text('type').notNull(),
    /** UI editor key (input, wysiwyg, select-dropdown, relation-m2m, ...). */
    interface: text('interface').notNull(),
    /** Optional display formatter key. */
    display: text('display'),
    options: jsonb('options').default({}).notNull(),
    displayOptions: jsonb('display_options').default({}).notNull(),
    validation: jsonb('validation').default({ rules: [] }).notNull(),
    conditions: jsonb('conditions').default([]).notNull(),
    translations: jsonb('translations').default({}).notNull(),
    required: boolean('required').default(false).notNull(),
    readonly: boolean('readonly').default(false).notNull(),
    hidden: boolean('hidden').default(false).notNull(),
    encrypted: boolean('encrypted').default(false).notNull(),
    versioned: boolean('versioned').default(false).notNull(),
    rawEnabled: boolean('raw_enabled').default(true).notNull(),
    /** `half` | `full` | `fill` */
    width: text('width').default('full').notNull(),
    group: text('group'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    collectionNameUnique: uniqueIndex('fields_collection_name_unique').on(
      t.collectionId,
      t.name,
    ),
    siteIdx: index('fields_site_idx').on(t.siteId),
  }),
);

export const relations = pgTable(
  'relations',
  {
    id: id(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    manyCollection: text('many_collection').notNull(),
    manyField: text('many_field').notNull(),
    oneCollection: text('one_collection').notNull(),
    oneField: text('one_field'),
    junctionCollection: text('junction_collection'),
    sortField: text('sort_field'),
    /** `restrict` | `cascade` | `set null` | `no action` */
    onDelete: text('on_delete').default('no action').notNull(),
    meta: jsonb('meta').default({}).notNull(),
    createdAt: createdAt(),
  },
  (t) => ({
    siteIdx: index('relations_site_idx').on(t.siteId),
    manyIdx: index('relations_many_idx').on(t.manyCollection, t.manyField),
  }),
);

/**
 * Generic item store. Each row is a document for `collectionId`. JSONB
 * `data` is keyed by `fields.name`. Materialization to physical tables is
 * a Phase-2 optimization.
 */
export const items = pgTable(
  'items',
  {
    id: id(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    /** `draft` | `published` | `archived` */
    status: text('status').default('draft').notNull(),
    data: jsonb('data').default({}).notNull(),
    sort: integer('sort').default(0).notNull(),
    userCreated: text('user_created').references(() => users.id),
    userUpdated: text('user_updated').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => ({
    collectionStatusIdx: index('items_collection_status_idx').on(
      t.siteId,
      t.collectionId,
      t.status,
    ),
    siteIdx: index('items_site_idx').on(t.siteId),
  }),
);

export const revisions = pgTable(
  'revisions',
  {
    id: id(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    itemId: text('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    /** JSON patch (RFC 6902) or compact delta. */
    delta: jsonb('delta').default({}).notNull(),
    parentId: text('parent_id'),
    userId: text('user_id').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => ({
    itemIdx: index('revisions_item_idx').on(t.itemId, t.createdAt),
  }),
);

export const activity = pgTable(
  'activity',
  {
    id: id(),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    /** `create` | `update` | `delete` | `login` | `permission_denied` | ... */
    action: text('action').notNull(),
    userId: text('user_id').references(() => users.id),
    collection: text('collection'),
    itemId: text('item_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    comment: text('comment'),
    payload: jsonb('payload').default({}).notNull(),
    createdAt: createdAt(),
  },
  (t) => ({
    siteCreatedIdx: index('activity_site_created_idx').on(t.siteId, t.createdAt),
    actorIdx: index('activity_actor_idx').on(t.userId, t.createdAt),
  }),
);
