# Architecture Overview

## 1. Sơ đồ tầng

```
┌──────────────────────────────────────────────────────────────────┐
│ Clients                                                          │
│  - apps/studio (React + Vite)  ─ no-code admin UI                │
│  - apps/web (Next.js demo)     ─ delivery consumer               │
│  - 3rd-party (SDK, webhooks)                                     │
└───────────────▲──────────────────────────────▲───────────────────┘
                │ REST/GraphQL/WS              │ Hydration API
┌───────────────┴──────────────────────────────┴───────────────────┐
│ apps/cms — Hono.js on Cloudflare Workers                         │
│  Routers:                                                        │
│   /auth (Logto OIDC)                                             │
│   /collections, /fields, /relations  (schema admin)              │
│   /items/:collection                 (CRUD content)              │
│   /permissions, /roles, /policies                                │
│   /users, /teams, /sessions                                      │
│   /files (R2 presign), /assets                                   │
│   /presets, /bookmarks, /translations                            │
│   /settings, /extensions                                         │
│   /deliver/page/:slug                (1-roundtrip)               │
│   /realtime (WS upgrade → Durable Object)                        │
│  Middleware: auth, tenancy(site_id), policy-eval, cache-tag      │
│  Services: SchemaService, PermissionService, ItemService,        │
│            RevisionService, ActivityService, ExtensionRuntime    │
└───────────────▲──────────────────────────────▲───────────────────┘
                │ Drizzle ORM                  │ KV (cache)
┌───────────────┴───────┐  ┌───────────────────┴──────────────────┐
│ Postgres (Hyperdrive) │  │ Cloudflare: KV, R2, Durable Objects, │
│ packages/database     │  │ Queues, Workers AI (optional)        │
└───────────────────────┘  └──────────────────────────────────────┘
```

## 2. Monorepo layout (mục tiêu)

```
lumibase/
├── apps/
│   ├── cms/                  # Hono API (Workers)
│   │   └── src/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── middleware/
│   │       ├── realtime/     # Durable Object class
│   │       └── extensions/   # runtime loader + sandbox
│   ├── studio/               # React + Vite admin
│   │   └── src/
│   │       ├── modules/      # collections, users, settings, files...
│   │       ├── components/   # shadcn + custom
│   │       ├── interfaces/   # field interfaces registry
│   │       ├── displays/     # field displays registry
│   │       ├── layouts/      # list/cards/kanban/calendar
│   │       └── lib/          # api client, ws client, policy eval
│   └── web/                  # Next.js demo
├── packages/
│   ├── database/             # Drizzle schemas + migrations
│   ├── shared/               # types, zod schemas, policy DSL, field DSL
│   ├── ui/                   # shadcn + cva tokens
│   ├── sdk/                  # JS SDK (REST+WS) cho client/extension
│   └── extension-sdk/        # types + helpers cho dev extension
└── docs/
```

## 3. Các tầng logic chính (apps/cms)

1. **Schema layer** — quản lý `collections`, `fields`, `relations`, sinh ra "virtual schema" trong KV.
2. **Item layer** — CRUD generic dựa trên virtual schema; build query Drizzle động.
3. **Permission layer** — đánh giá Policy DSL trước mỗi hành động; trả về **field mask** (read/write).
4. **Delivery layer** — endpoints public, áp permission của role "public" + cache-tag.
5. **Realtime layer** — Durable Object per `site_id` (hoặc per collection nóng), broadcast event chuẩn hoá.
6. **Extension layer** — load manifest, mount routes/hooks/UI vào registry; gate bằng capability.

## 4. Caching & Invalidation

- KV keys: `schema:{site}:{collection}`, `perm:{site}:{role}:{collection}`, `settings:{site}`.
- Tag-based: mỗi item ghi tag `item:{site}:{collection}:{id}`, mutation phát event → invalidate KV + revalidate Next.js tag.
- WebSocket cũng phát cùng event ⇒ client realtime + cache đồng bộ.

## 5. Multi-tenancy

- `site_id` truyền qua subdomain hoặc header `X-Lumi-Site`.
- Middleware `withTenant()` gắn `c.set('siteId', …)` và inject vào mọi service.
- Drizzle helper `scoped(siteId)` wrap query builder để bắt buộc filter.

## 6. Security

- Logto JWT validate ở edge (JWKS cache KV).
- CSRF cho Studio (same-origin + token).
- Per-field encryption (AES-GCM, key in Workers Secret) cho field flagged `sensitive: true`.
- Extension chạy trong **isolated module** (dynamic import từ R2), bị giới hạn bởi capability manifest (xem `features/extensions-system.md`).

## 7. Observability

- Structured logs (JSON) → Workers Logpush.
- Activity table cho audit nghiệp vụ.
- Metrics: cache hit, policy eval time, query time → exported qua Analytics Engine.
