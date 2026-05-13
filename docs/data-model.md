# Data Model (Drizzle / Postgres)

Tài liệu định nghĩa các bảng cần bổ sung cho `packages/database/src/schema.ts`. Tất cả PK là `nanoid` text. Domain table luôn có `site_id`.

## 1. Core tenancy & identity

### `sites` (đã có)
- `id`, `name`, `domain`, `createdAt`.

### `users` (mở rộng)
| Column | Type | Note |
|---|---|---|
| `id` | text PK | nanoid |
| `logtoId` | text unique | OIDC subject |
| `email`, `firstName`, `lastName`, `avatar` | text |
| `status` | text | `active`/`invited`/`suspended` |
| `language`, `theme`, `tfa` | jsonb | preferences |
| `lastSeenAt` | timestamp |
| `createdAt`, `updatedAt` | timestamp |

### `user_sites` (membership N-N)
- `userId`, `siteId`, `roleId`, `joinedAt`. PK composite.

### `teams` / `team_members`
- `teams`: `id`, `siteId`, `name`, `description`.
- `team_members`: `teamId`, `userId`. PK composite.

## 2. Schema (no-code)

### `collections`
| Column | Type | Note |
|---|---|---|
| `id` | text PK |
| `siteId` | text FK |
| `name` | text | machine name, unique per site |
| `singleton` | boolean |
| `icon`, `color`, `note` | text |
| `displayTemplate` | text | mustache template default |
| `sortField`, `archiveField`, `archiveValue` | text |
| `accountability` | text | `all` / `activity` / `none` |
| `versioning` | boolean |
| `meta` | jsonb | extra UI hints |
| `createdAt`, `updatedAt` |

### `fields`
| Column | Type | Note |
|---|---|---|
| `id` | text PK |
| `siteId`, `collectionId` | text FK |
| `name` | text | machine |
| `type` | text | `string`,`text`,`integer`,`decimal`,`boolean`,`json`,`uuid`,`date`,`datetime`,`time`,`uuid`,`csv`,`hash`,`geometry`,`alias` (relational virtual) |
| `interface` | text | UI editor key (e.g. `input`,`wysiwyg`,`select-dropdown`,`file-image`,`relation-m2m`,`code`,`json-raw`) |
| `display` | text | display formatter key |
| `options` | jsonb | per-interface options |
| `displayOptions` | jsonb |
| `validation` | jsonb | Zod-like DSL + JSONata expressions |
| `conditions` | jsonb | conditional show/hide/required |
| `permissionsHint` | jsonb | gợi ý mặc định (override ở `permissions`) |
| `required`, `readonly`, `hidden` | boolean |
| `sortOrder` | integer |
| `width` | text | `half`/`full`/`fill` |
| `group` | text | field group/section |
| `translations` | jsonb | label/help per locale |
| `encrypted` | boolean | per-field encryption |
| `versioned` | boolean |
| `rawEnabled` | boolean default true |

### `relations`
- `id`, `siteId`, `manyCollection`, `manyField`, `oneCollection`, `oneField`, `junctionCollection?`, `sortField?`, `onDelete`, `meta jsonb`.

## 3. Content (dynamic)

- LumiBase **không** tạo bảng vật lý mỗi collection ở MVP. Thay vào đó: `items` chung dạng EAV-lite + JSONB.
  - Lý do: edge-deploy + multi-tenant không thuận lợi cho DDL runtime.
- Khi cần performance, hỗ trợ "materialize" collection thành bảng riêng (Phase 2).

### `items`
| Column | Type |
|---|---|
| `id` | text PK |
| `siteId`, `collectionId` | text FK |
| `status` | text | `draft`/`published`/`archived` |
| `data` | jsonb | values keyed by field.name |
| `sort` | integer |
| `userCreated`, `userUpdated` | text FK users |
| `createdAt`, `updatedAt` | timestamp |
| `deletedAt` | timestamp nullable |

Indexes: `(siteId, collectionId, status)`, GIN on `data`.

### `revisions`
- `id`, `siteId`, `itemId`, `collectionId`, `delta jsonb`, `parentId`, `userId`, `createdAt`.

### `activity`
- `id`, `siteId`, `action` (`create`/`update`/`delete`/`login`/...), `userId`, `collection`, `itemId`, `ip`, `userAgent`, `comment`, `payload jsonb`, `createdAt`.

## 4. Permissions

### `roles`
- `id`, `siteId`, `name`, `description`, `icon`, `adminAccess` boolean, `appAccess` boolean.

### `policies`
- `id`, `siteId`, `name`, `description`, `rules jsonb`. Policy độc lập có thể attach vào nhiều roles/users.

### `role_policies`
- `roleId`, `policyId`, `priority`. PK composite.

### `user_policies`
- `userId`, `policyId`, `siteId`, `priority`. Cho phép gán policy trực tiếp user (override role).

### `permissions`
- `id`, `siteId`, `policyId`, `collection`, `action` (`create`/`read`/`update`/`delete`/`share`), `permissions jsonb` (row-level rule DSL), `validation jsonb`, `presets jsonb`, `fields text[]` (field-level allow list, `*` = all).

## 5. Files & Assets

### `files`
- `id`, `siteId`, `storage` (`r2`/`s3`), `filenameDisk`, `filenameDownload`, `mime`, `filesize`, `width`, `height`, `duration`, `folder`, `metadata jsonb`, `uploadedBy`, `createdAt`.

### `folders`
- `id`, `siteId`, `name`, `parent`.

## 6. UX state

### `presets` (bookmark + view state)
- `id`, `siteId`, `bookmark` text nullable (null = default view), `collection`, `userId?`, `roleId?`, `layout` (`tabular`/`cards`/`kanban`/`calendar`/`map`), `layoutQuery jsonb`, `layoutOptions jsonb`, `search`, `filter jsonb`, `icon`, `color`, `refreshInterval`.

### `translations` (UI strings + content)
- `id`, `siteId`, `language`, `namespace` (`ui`/`field`/`content`), `key`, `value`. Unique `(siteId, language, namespace, key)`.

## 7. Settings & Config

### `settings` (key/value per site)
- `id`, `siteId`, `key`, `value jsonb`, `scope` (`site`/`module`), `updatedAt`.

### `webhooks`
- `id`, `siteId`, `name`, `url`, `actions text[]`, `collections text[]`, `headers jsonb`, `status`, `secret`, `createdAt`.

## 8. Extensions

### `extensions`
- `id`, `siteId?` (null = global), `name`, `version`, `type` (`hook`/`endpoint`/`module`/`interface`/`display`/`layout`/`panel`/`operation`), `enabled`, `bundleUrl` (R2 path), `manifest jsonb`, `capabilities text[]`, `installedBy`, `installedAt`.

## 9. Realtime / Notifications

### `notifications`
- `id`, `siteId`, `recipient` (userId), `sender?`, `subject`, `message`, `collection?`, `item?`, `status`, `createdAt`.

## 10. Indexing & RLS

- Bắt buộc index `(siteId, …)` ở mọi bảng domain.
- Áp dụng Drizzle helper `scopeSite(siteId)` ở tầng repo; bổ sung Postgres RLS policy ở Phase 2 cho defence-in-depth.
