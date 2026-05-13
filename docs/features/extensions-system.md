# Extension System

> Mục tiêu: cho phép cộng đồng viết extension như Directus nhưng **an toàn ở edge** nhờ capability sandbox.

## 1. Extension types

| Type | Mô tả | Chạy ở |
|---|---|---|
| `hook` | Trigger trước/sau item action, schema change, login | apps/cms (Worker) |
| `endpoint` | Mount thêm route Hono dưới `/extensions/:name` | apps/cms |
| `operation` | Node cho flow engine (Phase 2) | apps/cms |
| `interface` | Field editor React | apps/studio |
| `display` | Field display React | apps/studio |
| `layout` | List layout (cards, kanban, …) | apps/studio |
| `panel` | Insight panel cho dashboard | apps/studio |
| `module` | Trang tuỳ biến trong Studio | apps/studio |

## 2. Manifest

`lumibase-extension.json`:
```json
{
  "name": "wordcount",
  "version": "1.0.0",
  "type": "hook",
  "entry": "./dist/index.mjs",
  "capabilities": [
    "items:read:posts",
    "items:update:posts",
    "log:write"
  ],
  "config": [
    { "key": "minWords", "type": "integer", "default": 100 }
  ]
}
```

### Capabilities (chuỗi hình `<resource>:<action>:<target?>`)
- `items:read:<collection>`, `items:update:<collection>`, `items:create:<collection>`.
- `files:read`, `files:write`.
- `http:fetch:<host>` (whitelist).
- `secrets:read:<key>`.
- `log:write`, `metrics:emit`.
- `ws:emit`, `ws:listen`.
- `schema:read`, `schema:write`.

Extension chỉ được dùng API ứng với capability đã khai báo; gọi ngoài phạm vi → throw `CapabilityDenied`.

## 3. Sandbox runtime (Workers)

- Bundle ESM upload lên R2, import động qua `await import(bundleUrl)`.
- Wrap context truyền vào extension là **proxy** chỉ expose API hợp lệ với capabilities.
- `fetch` toàn cục bị thay bằng `ctx.fetch` chỉ allow host whitelist.
- Timeout: 5s per hook; memory cap qua Workers limit.
- Versioning: cài nhiều version, switch active.

## 4. Hook events

- `items.<collection>.<action>.<before|after>` (action ∈ create/update/delete/read).
- `schema.collections.created|updated|deleted`.
- `auth.login`, `auth.logout`.
- `realtime.connection.opened|closed`.

Handler:
```ts
export default defineHook({
  on: 'items.posts.update.before',
  async handler({ payload, item, ctx }) {
    if (payload.body?.length < ctx.config.minWords) {
      throw new ctx.errors.ValidationError('Body too short');
    }
  }
});
```

## 5. UI extension API

```ts
defineInterface({
  id: 'color-picker',
  types: ['string'],
  optionsSchema: z.object({ presets: z.array(z.string()).optional() }),
  Component: ColorPickerComponent
});
```

- Studio load extension JS từ endpoint `/extensions/ui/manifest` → dynamic import (vite preserves esm).
- Permission sandbox UI: extension không truy cập `localStorage` thô; phải qua `ctx.storage` (scoped key).

## 6. Lifecycle

1. Developer build → produce `dist/` + manifest.
2. Upload qua Studio (`/settings/extensions/upload`) — server validate manifest, scan capabilities, lưu vào R2 + bảng `extensions`.
3. Site admin **review + grant** capabilities trước khi enable.
4. Enable → load vào registry; broadcast `extensions.changed` để các Worker instance reload.

## 7. Signing (Phase 2)

- Marketplace ký bundle bằng key; verify SHA + signature trước khi load production.

## 8. Tasks: Phase POST-MVP-E.
