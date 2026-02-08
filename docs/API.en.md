# API Reference (Brief)

[中文](API.md)

> Base path: `/api`  
> Example: `http://localhost:3000/api`

---

## Response Envelope

```json
{ "success": true, "data": { ... }, "error": null }
```

Error:

```json
{ "success": false, "data": null, "error": { "code": "ERROR_CODE", "message": "..." } }
```

---

## Auth (HttpOnly Cookie)

- Server sets HttpOnly cookies on login  
  - Admin: `mt_admin_token`  
  - Author: `mt_author_token`
- Frontend requests should use `credentials: 'include'`
- `Authorization: Bearer ...` is still accepted for compatibility/scripts

**Admin login (cookie)**

```bash
curl -i -c cookie.txt -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

**Request with cookie**

```bash
curl -i -b cookie.txt http://localhost:3000/api/admin/auth/me
```

---

## Health

- `GET /health`

---

## Author Auth

- `POST /auth/login`
- `POST /auth/logout`

---

## Admin Auth

- `POST /admin/auth/login`
- `POST /admin/auth/logout`
- `GET /admin/auth/me`
- `PATCH /admin/auth/me`
- `POST /admin/auth/impersonate`
- `POST /admin/auth/exit-impersonation`

---

## Admin Users

- `GET /admin/users`
- `POST /admin/users` (create author)
- `GET /admin/users/:id`
- `POST /admin/users/:id/reset`
- `POST /admin/users/:id/ban`
- `POST /admin/users/:id/unban`
- `POST /admin/users/:id/delete`
- `POST /admin/users/:id/restore`
- `POST /admin/users/:id/purge`
- `PATCH /admin/users/:id/admin-meta`

---

## Admin Articles

- `GET /admin/articles`
- `GET /admin/articles/:id`
- `POST /admin/articles/:id/unpublish`
- `POST /admin/articles/:id/delete`
- `POST /admin/articles/:id/restore`
- `POST /admin/articles/:id/purge`
- `PATCH /admin/articles/:id/admin-meta`

---

## Admin Categories

- `GET /admin/categories`
- `GET /admin/categories/:id`
- `POST /admin/categories/:id/delete`
- `POST /admin/categories/:id/restore`
- `POST /admin/categories/:id/purge`
- `PATCH /admin/categories/:id/admin-meta`

---

## Admin Tags

- `GET /admin/tags`
- `POST /admin/tags`
- `GET /admin/tags/:id`
- `PATCH /admin/tags/:id`
- `POST /admin/tags/:id/delete`

---

## Admin Upload

- `POST /admin/upload` (`multipart/form-data`, field: `file`, optional: `purpose`)

---

## Author (Auth Required)

### Profile

- `GET /profile`
- `PATCH /profile`
- `PATCH /profile/ai-config`
- `POST /profile/ai-config/models`
- `POST /profile/ai-config/proxy`
- `PUT /profile/password`

### Articles

- `GET /articles`
- `POST /articles`
- `GET /articles/:id`
- `PUT /articles/:id`
- `POST /articles/:id/publish`
- `POST /articles/:id/unpublish`
- `POST /articles/:id/save-draft`
- `POST /articles/:id/delete`
- `POST /articles/:id/restore`
- `POST /articles/:id/request-restore`
- `POST /articles/:id/confirm-delete`

### Categories

- `GET /categories`
- `POST /categories`
- `GET /categories/:id`
- `PUT /categories/:id`
- `POST /categories/:id/delete`
- `POST /categories/:id/restore`
- `POST /categories/:id/confirm-delete`

### Tags

- `GET /tags`
- `POST /tags`
- `PATCH /tags/:id`
- `POST /tags/:id/delete`

### Uploads

- `POST /uploads` (`multipart/form-data`, field: `file`, optional: `purpose`)

### Config

- `GET /config`

---

## Public (No Auth)

- `GET /public/site-status`
- `GET /public/articles`
- `GET /public/articles/:id`
- `GET /public/articles/slug/:authorId/:slug`
- `GET /public/articles/by-author/:authorUsername/:slug`
- `GET /public/articles/:id/likes`
- `POST /public/articles/:id/likes`
- `DELETE /public/articles/:id/likes`
- `GET /public/categories`
- `GET /public/categories/slug/:authorId/:slug`
- `GET /public/categories/by-author/:authorUsername/:slug`
- `GET /public/tags`
- `GET /public/tags/:slug`
- `GET /public/authors`
- `GET /public/authors/username/:username`

---

## Notes

- List endpoints typically accept `page` / `pageSize` / `q`.  
- SVG uploads are not supported.
