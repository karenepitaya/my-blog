# Frontend Site

[中文](README.md)

Astro-based frontend. Public API base is controlled by `PUBLIC_API_BASE_URL`.

---

## Requirements

- Node.js 18+
- pnpm

---

## Env (optional)

Copy `frontend/.env.example` → `frontend/.env.local`:

```
PUBLIC_API_BASE_URL=http://localhost:3000/api
```

---

## Run

```bash
pnpm install
pnpm dev
```

Build / preview:

```bash
pnpm build
pnpm preview
```

Default port: `http://localhost:4321`

---

## Content source

- Content lives in `frontend/src/content/posts`.
- When seeding/export is enabled, generated content is placed in  
  `frontend/src/content/posts/_generated`.

---

## Docs

- Env example: `frontend/.env.example`
- Backend service: `server/README.en.md`
- API doc: `docs/API.en.md`
- Deployment: `docs/DEPLOYMENT.en.md`
