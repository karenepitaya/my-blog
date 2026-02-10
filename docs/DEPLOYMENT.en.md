# Deployment (Brief)

[中文](DEPLOYMENT.md)

> Production uses **same-origin** by default (`/api`, `/admin`, `/` under one domain).  
> CORS is disabled in production, deploy with a single origin.

---

## Build

```bash
pnpm -C server build
pnpm -C admin build
pnpm -C frontend build
```

Artifacts:
- `server/dist/`
- `admin/dist/`
- `frontend/dist/` (Node adapter, includes `dist/server/entry.mjs` + `dist/client`)

---

## Run (example)

**Server (API)**

```bash
pnpm -C server start
```

**Frontend (Astro Node)**

```bash
node frontend/dist/server/entry.mjs
```

**Admin (static)**

Serve `admin/dist` with any static server or reverse proxy.

---

## Recommended Nginx (same-origin)

```nginx
server {
  listen 80;
  server_name example.com;

  location /api/ {
    # Keep `/api/...` path as-is for the upstream.
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # If you use local uploads (not OSS), expose `/<UPLOAD_DIR>/...` as well.
  # Default UPLOAD_DIR is `uploads`.
  location /uploads/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /admin/ {
    alias /path/to/admin/dist/;
    try_files $uri /index.html;
  }

  location / {
    proxy_pass http://127.0.0.1:4321;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## Auth & HTTPS

- Cookies are `Secure` in production, so HTTPS is required.  
- Frontend requests must include `credentials: 'include'`.

---

## Key Server Env

See `server/.env.example`, especially:
- `JWT_SECRET` (strong random string)
- `UPLOAD_DIR` (single path segment only)
- `PUBLIC_BASE_URL` (absolute URL for uploads)

