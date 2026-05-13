# Lumibase 

Lumibase is an Edge-native Headless CMS built for high-performance multi-website deployments, resolving the scalability and CI/CD bottlenecks of traditional monolithic CMS platforms.

## Folder Structure (Turborepo)

```text
lumibase/
├── apps/
│   ├── cms/                # The Hono.js Backend (Cloudflare Workers)
│   ├── web/                # The Next.js SSR Frontend Demo
│   └── studio/             # The No-code UI Dashboard (React/Vite)
├── packages/
│   ├── database/           # Drizzle ORM schema and migrations
│   ├── ui/                 # Shared UI components (Shadcn)
│   └── config-eslint/      # Shared linting rules
├── .cursorrules            # AI agent instructions
└── package.json
```

## Core Features

1. **Edge-First:** Runs entirely on Cloudflare Workers & Hyperdrive.
2. **True Multi-Tenancy:** Hard-coded `site_id` isolation.
3. **Page Hydration API:** Delivers layout and data in a single payload.
4. **GitOps Ready:** `cms config:export` for roles and schemas.