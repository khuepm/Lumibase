# Field Types & Configuration

> LumiBase coi field là **đối tượng cấu hình bậc nhất**. Mỗi field có 4 lớp config độc lập: `type` (lưu trữ), `interface` (cách edit), `display` (cách hiển thị), `validation` (rule).

## 1. Type catalogue (storage-level)

| Type | DB | Ghi chú |
|---|---|---|
| `string` | text | có `maxLength` |
| `text` | text | dài, no length |
| `integer` / `bigInteger` | int4/int8 |
| `decimal` | numeric(p,s) |
| `boolean` | boolean |
| `json` | jsonb |
| `uuid` | uuid |
| `date` / `datetime` / `time` / `timestamp` | tương ứng |
| `csv` | text (CSV serialized) |
| `hash` | text (one-way) |
| `geometry` | jsonb (GeoJSON) |
| `alias` | virtual | dùng cho M2O/O2M/M2M/M2A, group, presentation |

## 2. Interface registry

Mỗi interface có:
```ts
interface FieldInterface<TOptions> {
  id: string;            // 'input', 'wysiwyg', 'select-dropdown', 'relation-m2m', 'code', 'json-raw', 'file-image', 'datetime', ...
  types: FieldType[];    // các type tương thích
  optionsSchema: ZodSchema<TOptions>;
  Component: React.FC<{ value; onChange; options: TOptions; field }>; 
  // raw fallback
  supportsRaw: true;
}
```

Danh sách interface đã implement (được xác định trong quá trình phát triển):
- **Text & Number**: `input`, `input-multiline`, `input-number`, `wysiwyg`, `markdown`, `code` (monaco), `slug`, `color`, `rating`.
- **Choice & Boolean**: `select-dropdown`, `tags`, `toggle`.
- **Date & Time**: `datetime`.
- **Relation & File**: `relation-m2o`, `relation-o2m`, `relation-m2m`, `file`.
- **Special**: `json-raw`, `repeater`, `presentation-divider`, `presentation-notice`.

*(Các interface dự kiến khác như `slider`, `date-range`, `geometry-map`, `file-image`... sẽ được bổ sung sau)*

## 3. Display registry

Danh sách display đã implement:
- **Cơ bản**: `formatted-value`, `boolean-icon`, `datetime` (formatted-date), `badge`.
- **Trực quan**: `color-swatch`, `rating-stars`, `labels` (tags-pills).
- **Nâng cao**: `relation-related-values`, `mustache-template` (hỗ trợ string template nội suy với data).

## 4. Per-field configuration

JSON định nghĩa field:
```json
{
  "name": "cover",
  "type": "uuid",
  "interface": "file-image",
  "display": "image",
  "options": {
    "folder": "covers",
    "crop": true,
    "aspectRatio": "16:9"
  },
  "displayOptions": { "size": "medium", "rounded": true },
  "validation": {
    "rules": [
      { "type": "required" },
      { "type": "filesize", "max": "5MB" },
      { "type": "mime", "allow": ["image/png","image/jpeg","image/webp"] }
    ]
  },
  "conditions": [
    { "rule": "$.status == 'published'", "set": { "required": true } }
  ],
  "translations": {
    "en": { "label": "Cover", "help": "16:9 image" },
    "vi": { "label": "Ảnh bìa", "help": "Ảnh 16:9" }
  },
  "encrypted": false,
  "versioned": true,
  "rawEnabled": true,
  "width": "full",
  "group": "media"
}
```

### 4.1 Validation DSL
- Built-in rules: `required`, `regex`, `minLength`, `maxLength`, `min`, `max`, `enum`, `unique`, `filesize`, `mime`, `email`, `url`.
- Custom: `{ "type": "expression", "expr": "$count(value) <= 5" }` — chạy JSONata server-side & client-side.

### 4.2 Conditions DSL
- `rule` là biểu thức JSONata trên item context (`$`).
- `set` ghi đè `required`/`readonly`/`hidden`/`options`.

### 4.3 Per-field encryption
- `encrypted: true` → server mã hoá trước khi lưu (AES-GCM, key per site trong Workers Secret), giải mã khi đọc (nếu permission cho phép); raw editor sẽ hiển thị `***` trừ khi có quyền `read:decrypted`.

### 4.4 Per-field versioning
- `versioned: true` → ghi delta vào `revisions` mỗi lần thay đổi field này. Field không bật sẽ bỏ qua để tiết kiệm.

## 5. Advanced Content Features & Raw mode

Các tính năng nâng cao đã được tích hợp trong Studio Content:
- **Raw Toggle Per Field**: Người dùng có thể chuyển đổi linh hoạt giữa giao diện component trực quan và Monaco Editor (raw JSON) trên từng field. Trạng thái edit được bảo lưu kể cả khi JSON invalid.
- **Bulk Raw Editor**: Cho phép chọn hàng loạt items từ danh sách và chỉnh sửa trực tiếp raw JSON của chúng cùng lúc. Tích hợp tính năng validate trước khi lưu.
- **Revisions Diff Viewer**: Công cụ so sánh trực quan `delta.before` và `delta.after` của revisions. Hỗ trợ hiển thị highlight thay đổi, lọc hiển thị và chuyển đổi qua lại với chế độ raw.

**Raw mode contract:**
- Mọi field `rawEnabled !== false` đều render được ở chế độ Raw (xem `raw-data-editing.md`).
- Interface phải expose hàm `toRaw(value)` và `fromRaw(raw)` để chuyển đổi an toàn (mặc định JSON.stringify/parse).

## 6. Server-side responsibilities

- `SchemaService` cache "compiled field" (zod + JSONata pre-parsed) trong KV.
- `ItemService` chạy validation trước insert/update, áp `conditions`, mã hoá field flagged.

## 7. Tasks: xem `roadmap/tasks.md` Phase MVP-B & B2.
