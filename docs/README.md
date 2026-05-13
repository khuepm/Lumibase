# LumiBase Documentation

Tài liệu kỹ thuật cho LumiBase — Headless CMS Edge-native lấy cảm hứng từ Directus, xây dựng trên **React (Studio)** + **Hono.js (API trên Cloudflare Workers)** + **PostgreSQL/Drizzle**.

> Mục tiêu: vượt Directus ở các mảng **No-code Collection Builder**, **Permissions theo field/JSON policy**, **Raw editor cho mọi field**, **Extension SDK an toàn**, **Display Templates** và **Realtime WebSocket**, đồng thời giữ DNA Edge-native, Multi-tenant của LumiBase.

## Cấu trúc tài liệu

- **Vision & Định vị**
  - [vision-and-positioning.md](./vision-and-positioning.md) — So sánh Directus, định vị USP của LumiBase.
- **Kiến trúc**
  - [architecture/overview.md](./architecture/overview.md) — Tổng thể tech stack, các lớp, module.
  - [architecture/page-hydration.md](./architecture/page-hydration.md) — Hợp đồng API hydrate trang.
- **Mô hình dữ liệu**
  - [data-model.md](./data-model.md) — Schema lõi (sites, collections, fields, relations, permissions, presets, translations, files, revisions, activity, webhooks, extensions).
- **Tính năng** (`features/`)
  - [collections-builder.md](./features/collections-builder.md) — No-code Collection Builder.
  - [field-types-and-config.md](./features/field-types-and-config.md) — Hệ thống field types & interface/display config.
  - [permissions-rbac.md](./features/permissions-rbac.md) — Roles, Policies, Permissions tới field (JSON rule engine).
  - [raw-data-editing.md](./features/raw-data-editing.md) — Raw editor cho mọi field.
  - [user-management.md](./features/user-management.md) — Quản lý user, invitation, SSO/Logto.
  - [extensions-system.md](./features/extensions-system.md) — SDK extension + phân quyền sandbox.
  - [system-config.md](./features/system-config.md) — Hệ thống config (settings, env, theming, modules).
  - [bookmarks-presets.md](./features/bookmarks-presets.md) — Bookmark/Preset cho list view.
  - [translations-i18n.md](./features/translations-i18n.md) — Đa ngôn ngữ field/UI/content.
  - [display-templates.md](./features/display-templates.md) — Template hiển thị (listing + detail).
  - [websockets-realtime.md](./features/websockets-realtime.md) — Realtime subscribe/publish.
  - [typegen.md](./features/typegen.md) — Sinh `lumibase-types.ts` (schema → TypeScript) như Directus.
- **API**
  - [api/hono-api-spec.md](./api/hono-api-spec.md) — REST/WS endpoints chuẩn hoá.
- **UI Studio**
  - [ui/studio-ui-spec.md](./ui/studio-ui-spec.md) — Cấu trúc trang, module, layout, component, state.
- **Lộ trình**
  - [roadmap/tasks.md](./roadmap/tasks.md) — Task list chi tiết theo phase (MVP → GA).

## Nguyên tắc khi đọc tài liệu

1. **Config-as-Code first**: tất cả collection/field/permission đều export/import được dưới dạng JSON/YAML.
2. **Multi-tenant**: mọi entity domain đều có `site_id`, mọi query/cache key bao gồm `site_id`.
3. **Edge-friendly**: ưu tiên Cloudflare KV cho permission/schema cache; tag-based invalidation.
4. **1-roundtrip**: Studio và Delivery API ưu tiên trả payload aggregated.
5. **Backward-compat**: Mọi thay đổi schema phải đi qua revision/migration system.
