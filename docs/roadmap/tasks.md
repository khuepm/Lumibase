# Roadmap & Task Breakdown

> **Scope:** Roadmap này dành cho **LumiBase Studio** — admin panel để quản lý data, collections, permissions, v.v.
>
> **Consumer app (frontend end-user)** là app riêng (Next.js, static site, v.v.) sử dụng SDK để gọi API từ backend — **không nằm trong roadmap này**.
>
> Ngôn ngữ task: ngắn, có thể chuyển thẳng vào issue tracker. Mỗi task có **scope rõ ràng**, **deliverable**, và link tài liệu liên quan.

Quy ước:
- `[BE]` apps/cms (Backend API - Hono + Cloudflare Workers)
- `[FE]` apps/studio (Admin panel - React + Vite)
- `[DB]` packages/database
- `[SDK]` packages/sdk (Type-safe client cho cả Studio và consumer apps)
- `[DOC]` tài liệu
- `[OPS]` infra/deploy
- Mỗi PR nên gắn 1 nhánh `feature/<phase>-<short-name>` theo Git hygiene rule.

> **TODO:** Thêm phase/section cho Consumer app demo (Next.js example) để showcase SDK usage cho end-user frontend.

---

## Phase 0 — Foundation (tuần 1-2)

Mục tiêu: bộ khung monorepo chạy được, schema lõi, auth Logto, CI.

- [x] `[OPS]` Tạo `apps/cms` (Hono + Cloudflare Workers template + wrangler config).
- [x] `[OPS]` Tạo `apps/studio` (Vite + React + TS + Tailwind + shadcn init).
- [x] `[OPS]` Tạo `packages/shared`, `packages/sdk`, `packages/ui`, `packages/extension-sdk` (boilerplate + tsconfig + lint).
- [x] `[DB]` Bổ sung schema: `users` (mở rộng), `user_sites`, `teams`, `team_members`, `roles`, `policies`, `role_policies`, `user_policies`, `permissions` (xem `data-model.md`).
- [x] `[DB]` Drizzle migration runner cho Hyperdrive (local + remote scripts).
- [x] `[BE]` Middleware `withAuth` (Logto JWKS), `withTenant` (`site_id` từ subdomain/header), `withLogger`.
- [x] `[BE]` `GET /auth/me` + `GET /utils/health`.
- [x] `[FE]` App shell + module bar + routing skeleton + Logto login flow.
- [x] `[FE]` API client trong `packages/sdk` (fetch wrapper, error format, site header).
- [x] `[OPS]` Pipeline CI (lint, typecheck, test, build) + preview deploy.
- [x] `[DOC]` Cập nhật `architecture.md` (root) khi cấu trúc thay đổi.

Definition of done Phase 0:
- Login Logto → Studio shell hiển thị site switcher → gọi `/auth/me` OK.
- `pnpm dev` chạy đủ cms + studio + web.

---

## Phase A — Schema engine (tuần 3-4)

Mục tiêu: tạo/quản lý collection & field qua API + UI (chưa cần permission đầy đủ).

- [x] `[DB]` Bảng `collections`, `fields`, `relations`.
- [x] `[BE]` `SchemaService` (CRUD + compile cache KV).
- [x] `[BE]` Endpoints `/collections`, `/fields`, `/relations` (xem `api/hono-api-spec.md`).
- [x] `[BE]` Endpoint diff `/collections/diff` + `PUT /collections/:name/schema`.
- [x] `[BE]` Validation tên collection/field, kiểm tra dependency khi xoá.
- [x] `[SDK]` Type-safe client cho schema.
- [x] `[BE]` Script CLI `apps/cms/scripts/typegen.ts` + alias `lumibase typegen`.
- [x] `[FE]` Module *Settings → Data Model* (list collection).
- [x] `[FE]` Collection wizard 3 bước.
- [x] `[FE]` Collection detail tabs (Fields, Display, Archive, Raw JSON).
- [x] `[FE]` Field inspector cơ bản (chỉ interfaces `input`, `input-multiline`, `toggle`, `select-dropdown`, `datetime`, `json-raw`).
- [x] `[FE]` Live JSON pane (Monaco) cho schema collection, two-way sync.
- [x] `[FE]` Drag-drop reorder field (dnd-kit).
- [x] `[BE]` Endpoint `GET /typegen/schema` (manifest đã apply permission). Xem `features/typegen.md`.
- [x] `[SDK]` Generator core `packages/sdk/src/typegen/` (manifest → TS string).
- [x] `[FE]` Trang *Settings → Developer → Types* (preview + download).
- [ ] `[DOC]` Capture screenshot vào `docs/features/collections-builder.md`.

---

## Phase B — Items & Field system mở rộng (tuần 5-7)

Mục tiêu: CRUD generic + đầy đủ interface field + raw mode toàn cục.

- [x] `[DB]` Bảng `items`, `revisions`, `activity` + indexes GIN.
- [x] `[BE]` `ItemService` build query Drizzle động (fields, filter, sort, paginate, deep).
- [x] `[BE]` Endpoints `/items/:collection` đầy đủ (list, detail, create, patch, put, delete, bulk, raw).
- [x] `[BE]` Revision write + revert.
- [x] `[BE]` Activity log middleware cho mutation.
- [x] `[BE]` Validation pipeline (Zod + JSONata) chạy server-side.
- [x] `[BE]` Conditions evaluator (server + helper xuất sang client).
- [x] `[BE]` Per-field encryption service (AES-GCM, key Workers Secret).
- [x] `[FE]` Content module list view (tabular layout) + filter builder + sort + paginate.
- [x] `[FE]` Detail editor + tabs side panel (Revisions, Raw JSON).
- [x] `[FE]` Interface registry hoàn chỉnh: text, number, choice, boolean, date, relation (m2o/o2m/m2m), file, json-raw, code, wysiwyg, markdown, slug, color, tags, rating, repeater, presentation.
- [x] `[FE]` Display registry: formatted-value, raw, boolean-icon, datetime, image, labels, mustache-template.
- [x] `[FE]` Raw toggle component (Monaco) cho mọi interface (xem `features/raw-data-editing.md`).
- [x] `[FE]` Bulk raw editor cho toàn item.
- [x] `[FE]` Revisions diff viewer.
- [x] `[FE]` Mustache display template editor (textarea + autocomplete + live preview).
- [x] `[BE]` `POST /utils/render-template` (mustache only Phase B).
- [x] `[DOC]` Cập nhật `features/field-types-and-config.md` với danh sách interfaces đã implement.

---

## Phase C — Permissions & Access (tuần 8-10)

Mục tiêu: triển khai hệ phân quyền field-level + row-level + policy compose.

- [x] `[BE]` `PermissionService` (compile rule, KV cache, field mask).
- [x] `[BE]` Endpoints CRUD `/roles`, `/policies`, `/policies/:id/permissions`, attach/detach.
- [x] `[BE]` `GET /permissions/me` + `POST /permissions/check` (trace).
- [x] `[BE]` Tích hợp Permission vào ItemService (where injection + post-check).
- [x] `[BE]` Magic vars `$CURRENT_USER`, `$CURRENT_SITE`, `$CURRENT_ROLE`, `$NOW`, `$IP`, `$HEADERS.*`.
- [x] `[BE]` Time-bound + IP allow/deny ở policy level.
- [x] `[BE]` Permission compose rules (xem `features/permissions-rbac.md`).
- [x] `[FE]` Module Access Control:
  - [x] Roles page (list, create, assign users).
  - [x] Policies page (GUI rules + JSON Monaco).
  - [x] Permission matrix.
  - [x] Test sandbox.
- [x] `[FE]` Field-level hide/disable trong form theo `/permissions/me`.
- [x] `[FE]` List view hide column nếu không có quyền read field.
- [x] `[FE]` Hide/disable bulk action theo permission.

---

## Phase C2 — Presets, Bookmarks, Translations cơ bản (tuần 11-12)

- [x] `[DB]` Bảng `presets`, `translations` (đã có trong migration `0000_acoustic_nighthawk.sql`, schema `packages/database/src/schema/platform.ts`).
- [x] `[BE]` CRUD `/presets`, scope resolution (user > role > site).
- [x] `[BE]` CRUD `/translations` (namespace `ui`, `field`, `content`).
- [x] `[BE]` Locale settings (`settings.locales.*`).
- [x] `[FE]` Preset switcher + save/edit dialog ở list view.
- [x] `[FE]` Module Translations (UI strings tab + content tab JSONB).
- [x] `[FE]` Interface `translatable-text` (JSONB map locale).
- [x] `[FE]` i18n cho Studio UI (react-i18next bind to translations API).

---

## Phase D — Users, Files, Settings (tuần 13-15)

- [x] `[BE]` `/users`, `/users/invite`, `/users/:id/impersonate`, sessions.
- [x] `[BE]` `/teams`, `/team_members`.
- [x] `[BE]` Files: presigned R2 upload, `/files`, `/assets/:id` transform.
- [x] `[BE]` Settings storage + KV cache + `settings.changed` event.
- [x] `[BE]` Webhooks CRUD + dispatcher (Queues).
- [x] `[BE]` Activity log endpoint (filter, paginate).
- [x] `[FE]` Module Users + Teams.
- [x] `[FE]` Module Files (grid + folders + drag-drop upload).
- [x] `[FE]` Module Settings (general, locales, security, files, webhooks, activity).
- [x] `[FE]` Notifications inbox (xem mục realtime).

---

## Phase E — Realtime / WebSocket (tuần 16-17)

- [x] `[OPS]` Tạo Durable Object class `SiteRoom` (Wrangler binding).
- [x] `[BE]` Endpoint `/realtime` upgrade WS, route tới DO theo `siteId`.
- [x] `[BE]` Protocol subscribe/unsubscribe/presence (xem `features/websockets-realtime.md`).
- [x] `[BE]` Publish pipeline trong ItemService.commit().
- [x] `[BE]` Permission re-check khi fan-out event.
- [x] `[BE]` Rate limit + heartbeat.
- [x] `[SDK]` Client realtime trong `packages/sdk`.
- [x] `[FE]` Hook `useRealtimeSubscription`, `usePresence`.
- [x] `[FE]` Presence chip topbar + detail editor.
- [x] `[FE]` List view "Live mode" toggle.
- [x] `[FE]` Smart preset subscribe.
- [x] `[FE]` Notifications realtime.

---

## Phase F — Extensions & Display Templates nâng cao (tuần 18-20)

- [x] `[DB]` Bảng `extensions`.
- [x] `[BE]` Extension uploader (multipart → R2) + manifest validator + capability registry.
- [x] `[BE]` Sandbox loader (dynamic import + proxy ctx + capability gate).
- [x] `[BE]` Hook dispatcher tích hợp ItemService (`before/after`).
- [x] `[BE]` Endpoint mount `/extensions/:name/*` từ extension type `endpoint`.
- [x] `[BE]` `/utils/render-template` hỗ trợ component DSL.
- [x] `[FE]` Module Settings → Extensions (upload, review caps, enable/disable, version).
- [x] `[FE]` Dynamic loader UI extensions (interface/display/layout/panel/module).
- [ ] `[FE]` Display template editor mode component (block builder).
- [x] `[DOC]` Tutorial "Build your first extension" trong `docs/features/extensions-system.md`.


---

## Phase G — Hardening & GA (tuần 21-24)

- [ ] `[BE]` Postgres RLS policies bổ sung (defence-in-depth).
- [ ] `[BE]` Tag-based invalidation hoàn thiện (revalidateTag webhook → Next.js).
- [ ] `[BE]` Backups + restore (Phase 2 backups Settings module).
- [ ] `[BE]` Config export/import CLI (`apps/cms/scripts/config-cli.ts`).
- [ ] `[FE]` Accessibility audit (axe) + fix.
- [ ] `[FE]` Bundle size audit, lazy module splitting.
- [ ] `[OPS]` Load test (k6) cho delivery API và realtime.
- [ ] `[OPS]` SLO dashboards (Workers Analytics Engine).
- [ ] `[DOC]` Public docs site (Mintlify/Docusaurus) tách từ `docs/` repo.

---

## Phase POST-GA — Nâng cao

- [ ] Translation Memory + glossary + MT providers (DeepL, OpenAI, Workers AI).
- [ ] Collaborative cursors (CRDT-lite) cho field text/wysiwyg.
- [ ] Flows / Operations engine (Phase 2 — like Directus Flows).
- [ ] SCIM provisioning.
- [ ] Marketplace extensions + signing.
- [ ] Materialized collection (sang bảng vật lý) cho hot data.
- [ ] AI suggest field & AI content assist (RAG via embeddings).
- [ ] Multi-region Durable Objects sharding.

---

## Cross-cutting checklist (mỗi phase)

- [ ] Cập nhật `architecture.md` nếu thay đổi cấu trúc.
- [ ] Viết unit + integration test trước khi merge.
- [ ] Cập nhật OpenAPI spec (`apps/cms/openapi.yaml`) cho mọi endpoint mới.
- [ ] Cập nhật `packages/sdk` types tương ứng.
- [ ] Tạo branch `feature/<phase>-<name>`, commit theo conventional commits, PR có checklist DoD.
