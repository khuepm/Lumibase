# Lumibase 

Lumibase is an Edge-native Headless CMS built for high-performance multi-website deployments, resolving the scalability and CI/CD bottlenecks of traditional monolithic CMS platforms.

## Folder Structure (Turborepo)

```text
lumibase/
├── apps/
│   ├── cms/                # Hono.js backend (Cloudflare Workers)
│   ├── studio/             # No-code admin SPA (React + Vite)
│   └── web/                # Next.js SSR delivery demo (planned)
├── packages/
│   ├── database/           # Drizzle ORM schema + migrations
│   ├── shared/             # Types, zod schemas, policy DSL, field DSL
│   ├── sdk/                # JS SDK (REST + WS) + typegen core
│   ├── ui/                 # Shared shadcn components + CVA tokens
│   └── extension-sdk/      # Types/helpers for building extensions
├── docs/                   # Architecture + feature specs + roadmap
├── architecture.md         # Root summary (update on structural changes)
├── .cursorrules            # AI agent instructions
└── package.json
```

## Quick start

```bash
pnpm install
pnpm --filter @lumibase/cms dev      # Hono API on :8787
pnpm --filter @lumibase/studio dev   # Studio SPA on :5173
```

The Studio placeholder dashboard pings `/api/v1/utils/health` to verify the wire-up. Full documentation lives in [`docs/`](./docs/README.md); the task roadmap is in [`docs/roadmap/tasks.md`](./docs/roadmap/tasks.md).

## Core Features

1. **Edge-First:** Runs entirely on Cloudflare Workers & Hyperdrive.
2. **True Multi-Tenancy:** Hard-coded `site_id` isolation.
3. **Page Hydration API:** Delivers layout and data in a single payload.
4. **GitOps Ready:** `cms config:export` for roles and schemas.

# Dưới đây là bộ tài liệu cấu trúc sẵn để bạn cung cấp cho AI, giúp nó hiểu sâu sắc và bắt đầu xây dựng Lumibase cho bạn.

---

## 1. Project Blueprint: Lumibase Core Identity

**Mục tiêu:** Giúp AI hiểu bản chất và tầm nhìn của dự án.

* **Tên dự án:** Lumibase.
* **Triết lý:** "Directus-inspired, Edge-native, Production-ready".
* **Vấn đề giải quyết:** Khắc phục nhược điểm của Directus về Multi-tenancy, ID collision, Cache quản lý kém và khó khăn trong CI/CD.
* **Kiến trúc lõi:** Headless CMS hỗ trợ quản lý dữ liệu động kết hợp cấu hình UI (Page-builder mindset) trả về trong 1 vòng gọi duy nhất.

---

## 2. Technical Stack Definition (The "Hard" Skills)

**Mục tiêu:** Quy định chặt chẽ các công nghệ AI được phép sử dụng.

* **Runtime:** Node.js (Edge-compatible, ưu tiên Hono.js hoặc ElysiaJS).
* **Database:** PostgreSQL (Hybrid RDBMS + JSONB).
* **Infrastructure:** Cloudflare Stack (Workers, R2, Hyperdrive, KV).
* **Authentication:** Logto (OIDC, Multi-tenancy).
* **Communications:** Resend (Email), Webhooks (Event-driven).
* **Frontend Reference:** Next.js (App Router, SSR), TailwindCSS, Shadcn UI.

---

## 3. Bộ kỹ năng cho AI (AI Skills / System Prompts)

Bạn hãy copy các đoạn dưới đây vào System Prompt hoặc file `README.md` của dự án để AI luôn tuân thủ:

### Skill 1: Database & Migration Architect

> **Nhiệm vụ:** Thiết kế schema và cơ chế đồng bộ dữ liệu.
> * **Quy tắc ID:** Tuyệt đối không dùng Serial/Auto-increment. Sử dụng NanoID (ngắn, URL friendly) hoặc UUIDv7.
> * **Multi-tenancy:** Mọi bảng phải có `site_id` để phân tách dữ liệu tuyệt đối ở tầng Row-Level.
> * **Config-as-Code:** Xây dựng module xuất/nhập cấu hình (Roles, Permissions, Collections) ra file YAML/JSON để hỗ trợ GitOps.
> 
> 

### Skill 2: Edge & Caching Specialist

> **Nhiệm vụ:** Tối ưu hóa hiệu năng trên Cloudflare.
> * **Cache Tagging:** Implement cơ chế xóa cache theo Tag trong Redis/Cloudflare KV. Khi một bản ghi cập nhật, phải invalid toàn bộ các cache-key liên quan.
> * **File Security:** Xây dựng middleware kiểm tra File Signature (Magic Numbers) trước khi upload vào Cloudflare R2, không tin tưởng vào file extension từ client.
> 
> 

### Skill 3: Unified Data Hydration Logic

> **Nhiệm vụ:** Xử lý luồng dữ liệu "1-roundtrip".
> * **Logic:** Thiết kế API `/deliver/{page_slug}` thực hiện gộp (Aggregator) cả Page Config (từ bảng `pages`) và Data (từ các `collections` liên quan) thành một JSON duy nhất.
> * **SEO-Ready:** Đảm bảo cấu trúc JSON trả về đủ thông tin để Next.js SSR có thể render HTML hoàn chỉnh mà không cần gọi thêm API phụ.
> 
> 

### Skill 4: UI/UX Component Bridge

> **Nhiệm vụ:** Kết nối CMS với TailwindCSS/Next.js.
> * **Pattern:** Sử dụng Class Variance Authority (CVA) để map các "Intent" từ CMS thành class Tailwind thực tế.
> * **Rich Content:** Sử dụng `html-react-parser` để xử lý HTML động từ CMS, đảm bảo convert thẻ `<a>` thành Next.js `<Link>` và thẻ `<img>` thành Next.js `<Image>`.
> 
> 

---

## 4. Lộ trình Đóng gói (Packaging for AI)

Để AI có thể thực sự bắt tay vào "code", bạn nên tổ chức thư mục dự án như sau:

1. **`/docs/specs`**: Chứa file Markdown chi tiết về từng tính năng (Auth, File, Caching).
2. **`/docs/prompts`**: Chứa các "Skills" nêu trên.
3. **`/schema`**: Chứa các file SQL khởi tạo hoặc file định nghĩa Prisma/Drizzle.
4. **`.cursorrules` (Nếu dùng Cursor):** Dán toàn bộ "Technical Stack" và "Skills" vào đây. AI sẽ tự động tuân thủ mỗi khi bạn viết code.
