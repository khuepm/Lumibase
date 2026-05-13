
import { pgTable, text, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

// --- CORE SYSTEM TABLES ---

export const sites = pgTable('sites', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  logtoId: text('logto_id').notNull().unique(), // Mapped from Logto Identity Provider
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- DYNAMIC CONTENT TABLES ---

export const pages = pgTable('pages', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  siteId: text('site_id').references(() => sites.id).notNull(), // Multi-tenancy Enforcement
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  // JSONB stores the sections, layout, and Tailwind CVA mappings
  layoutConfig: jsonb('layout_config').default({}).notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collections = pgTable('collections', {
  id: text('id').$defaultFn(() => nanoid()).primaryKey(),
  siteId: text('site_id').references(() => sites.id).notNull(),
  name: text('name').notNull(),
  // JSONB stores field definitions, types, and AI Context (RAG flags)
  schema: jsonb('schema').default({}).notNull(), 
});
