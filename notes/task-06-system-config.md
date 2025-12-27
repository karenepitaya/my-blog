# Task 06 - System Config & Frontend Sync

- Scope: refactor system configuration into admin + frontend domains with server persistence.
- Admin UI: SystemSettings rebuilt with grouped tabs, frontend fields (nav/social/theme/giscus/characters), and JSON overrides support.
- API: added /config (auth read) and /admin/config (admin update) with validation, SystemConfig model/repo/service.
- Frontend sync: updates write to frontend/src/site.config.ts via a TypeScript serializer.

Notes

- Config is cached in localStorage and refreshed on login; invalid cache falls back to defaults.
- Admin updates trigger file sync; failures are surfaced to the UI.
