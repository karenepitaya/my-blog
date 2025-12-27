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
   ```

3. Start the admin app:

   ```bash
   npm run dev
   ```

Default dev port is `3001`.

## Notes

- Admin login uses `/api/admin/auth/login`.
- Author login uses `/api/auth/login`.
- Tailwind is built via PostCSS (no CDN in production).
