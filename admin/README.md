# Admin Console

This admin app talks directly to the main server APIs.

## Requirements

- Node.js
- The `server` app running on `http://localhost:3000`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Configure env in `admin/.env.local`:

   ```bash
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_GEMINI_API_KEY=your_gemini_key
   # Self-hosted Chinese font CSS (Noto Sans SC)
   VITE_FONT_CSS_ZH=https://karenepitaya.xyz/fonts/current/noto-sans-sc/fonts.css
   # Font asset origin for resolving url(/fonts/...) in the remote CSS
   VITE_FONT_ORIGIN=https://karenepitaya.xyz
   # English mono font CSS (JetBrains Mono). Default uses Google Fonts for quick verification.
   VITE_FONT_CSS_EN=https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap
   ```

   - `VITE_FONT_CSS_ZH` is read by `admin/styles/fonts.ts` and injected once at app bootstrap.
   - You can copy `admin/.env.example` as a starting point.

3. Start the admin app:

   ```bash
   npm run dev
   ```

Default dev port is `3001`.

## Notes

- Admin login uses `/api/admin/auth/login`.
- Author login uses `/api/auth/login`.
- Tailwind is built via PostCSS (no CDN in production).
