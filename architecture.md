# LumiBase — Architecture (root summary)

Bản tóm tắt kiến trúc cho LumiBase. Chi tiết theo từng tầng xem trong `docs/`.

## Components

- **apps/cms** — Hono.js trên Cloudflare Workers. Cung cấp REST + WebSocket. Truy cập Postgres qua Hyperdrive (Drizzle ORM), R2 cho file, KV cho cache config/permission, Durable Objects cho realtime.
- **apps/studio** — React 18 + Vite + TS + Tailwind + shadcn/ui. Admin SPA, không SSR.
- **apps/web** — Next.js 14 (App Router). Demo consumer của Delivery API, đại diện workload thực tế.
- **packages/database** — Drizzle schema + migrations.
- **packages/shared** — types, zod schemas, policy DSL, field DSL (dùng chung BE/FE/SDK).
- **packages/sdk** — JS SDK (REST + WS) cho client/extension + typegen core.
- **packages/ui** — shadcn components + CVA tokens.
- **packages/extension-sdk** — types & helpers cho dev viết extension.

## Interactions

```
Studio (React) ──HTTPS──┐
Web (Next.js)  ──HTTPS──┤
3rd-party SDK  ──HTTPS──┼──► apps/cms (Hono on Workers)
                        │       │
                        │       ├── Postgres (Hyperdrive) via Drizzle
                        │       ├── R2 (assets)
                        │       ├── KV (cache: schema, permission, settings)
                        │       └── Durable Object per site (realtime room)
                        │
Studio/Web ◄──WSS──── apps/cms /realtime
```

## Design rationales

- **Edge-first**: tất cả request đi qua Workers cho latency thấp toàn cầu.
- **Multi-tenant by default**: `site_id` ở mọi entity domain; mọi cache key chứa `site_id`.
- **Config-as-Code**: collections, roles, policies, settings export/import được (JSON/YAML).
- **1-roundtrip page hydration**: Delivery API trả layout + data trong 1 payload.
- **No DDL runtime**: collection/field thay đổi không tạo bảng vật lý; dùng JSONB + virtual schema. Phase 2 hỗ trợ materialize.
- **Capability sandbox cho extension** thay vì trust toàn bộ code.
- **Policy DSL** thay vì code rule cứng — cho phép field-level + row-level + time/IP-bound.

## State & coupling notes

- Permission cache là global state quan trọng → bắt buộc invalidate qua KV write + WS broadcast `permissions.changed`.
- Drizzle helper `scopeSite(siteId)` là tight contract; mọi service phải dùng để tránh leak cross-tenant.
- Tránh global mutable singleton trong Worker; mọi context truyền qua Hono `c.set/get`.
- Studio gọi `usePermissions()` (`apps/studio/src/lib/use-permissions.ts`) để hydrate `/permissions/me`; module **Access Control** (`apps/studio/src/modules/access/`) quản lý Roles, Policies, Permission Matrix, Test Sandbox. Hook là single source of truth cho UI gating (column hide, field disable, bulk action lock) — đừng fork logic ở chỗ khác.

## Update policy

File này phải được cập nhật khi:
1. Thêm/đổi app hoặc package.
2. Thay đổi cách giao tiếp giữa các thành phần.
3. Thay đổi nền tảng (Workers → Node, KV → Redis, …).
